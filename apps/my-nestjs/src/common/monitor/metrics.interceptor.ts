import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { Observable, tap } from 'rxjs'
import { MetricsService } from './metrics.service'

/**
 * 全局拦截器：为每个 HTTP 请求采集耗时与状态码，写入 MetricsService。
 * 路径上的 UUID / 数字 ID 会被归一化（如 `/members/abc-123` → `/members/:id`），
 * 防止指标被高基数路径打爆。
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const req = http.getRequest<Request>()
    const res = http.getResponse<Response>()
    const start = process.hrtime.bigint()
    const method = req.method
    const path = normalizePath(req.route?.path ?? req.path ?? req.url ?? '/')
    const tenantId
      = (req.headers['x-tenant-id'] as string | undefined) ?? undefined

    const finish = (status: number) => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000
      this.metrics.record({
        ts: Date.now(),
        method,
        path,
        status,
        durationMs: +durationMs.toFixed(3),
        tenantId,
      })
    }

    return next.handle().pipe(
      tap({
        next: () => finish(res.statusCode || 200),
        error: (err: unknown) => {
          const status
            = (err as { status?: number, statusCode?: number })?.status
              ?? (err as { statusCode?: number })?.statusCode
              ?? 500
          finish(status)
        },
      }),
    )
  }
}

const UUID_RE
  = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const LONG_HEX_RE = /\b[0-9a-f]{16,}\b/gi
const NUMERIC_RE = /\/\d+(?=\/|$)/g

function normalizePath(path: string): string {
  return path
    .replace(UUID_RE, ':id')
    .replace(LONG_HEX_RE, ':id')
    .replace(NUMERIC_RE, '/:id')
}
