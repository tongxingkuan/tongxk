import { Injectable } from '@nestjs/common';

interface RouteStat {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
  /** 最近 200 次延迟样本，用于计算 p50/p95/p99 */
  samples: number[];
  statusCodes: Record<number, number>;
}

export interface RecentRequest {
  ts: number;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  tenantId?: string;
}

const SAMPLE_LIMIT = 200;
const RECENT_LIMIT = 50;

/**
 * 服务端监控指标服务（内存存储，进程重启后清空）。
 * - 累计统计：每个 method+path 的请求数、错误数、平均/最大耗时、状态码分布
 * - 延迟分位数：基于最近 200 次样本计算 p50/p95/p99
 * - 最近请求：环形缓冲，最近 50 条供前端展示
 */
@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private readonly routes = new Map<string, RouteStat>();
  private readonly recent: RecentRequest[] = [];
  private totalRequests = 0;
  private totalErrors = 0;

  record(req: RecentRequest): void {
    const key = `${req.method} ${req.path}`;
    const stat = this.routes.get(key) ?? {
      count: 0,
      errors: 0,
      totalMs: 0,
      maxMs: 0,
      samples: [],
      statusCodes: {},
    };
    stat.count += 1;
    stat.totalMs += req.durationMs;
    if (req.durationMs > stat.maxMs) stat.maxMs = req.durationMs;
    if (req.status >= 400) stat.errors += 1;
    stat.statusCodes[req.status] = (stat.statusCodes[req.status] ?? 0) + 1;
    stat.samples.push(req.durationMs);
    if (stat.samples.length > SAMPLE_LIMIT) {
      stat.samples.splice(0, stat.samples.length - SAMPLE_LIMIT);
    }
    this.routes.set(key, stat);

    this.totalRequests += 1;
    if (req.status >= 400) this.totalErrors += 1;

    this.recent.unshift(req);
    if (this.recent.length > RECENT_LIMIT) this.recent.length = RECENT_LIMIT;
  }

  snapshot() {
    const memory = process.memoryUsage();
    const routes = Array.from(this.routes.entries())
      .map(([key, stat]) => {
        const [method, path] = key.split(' ');
        const sorted = [...stat.samples].sort((a, b) => a - b);
        return {
          method,
          path,
          count: stat.count,
          errors: stat.errors,
          avgMs: +(stat.totalMs / stat.count).toFixed(2),
          maxMs: +stat.maxMs.toFixed(2),
          p50: +percentile(sorted, 0.5).toFixed(2),
          p95: +percentile(sorted, 0.95).toFixed(2),
          p99: +percentile(sorted, 0.99).toFixed(2),
          statusCodes: stat.statusCodes,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      uptimeMs: Date.now() - this.startedAt,
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate:
        this.totalRequests === 0
          ? 0
          : +(this.totalErrors / this.totalRequests).toFixed(4),
      memory: {
        rssMB: +(memory.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: +(memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: +(memory.heapTotal / 1024 / 1024).toFixed(2),
      },
      cpuUsage: process.cpuUsage(),
      routes,
      recent: this.recent,
    };
  }

  reset(): void {
    this.routes.clear();
    this.recent.length = 0;
    this.totalRequests = 0;
    this.totalErrors = 0;
  }
}

function percentile(sortedSamples: number[], p: number): number {
  if (sortedSamples.length === 0) return 0;
  const idx = Math.min(
    sortedSamples.length - 1,
    Math.ceil(sortedSamples.length * p) - 1,
  );
  return sortedSamples[Math.max(0, idx)];
}
