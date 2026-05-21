import { Controller, Delete, Get } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import { MetricsService } from './metrics.service'

/**
 * /health  —— 健康检查（liveness + readiness）
 * /metrics —— 服务端运行指标（请求数、错误数、延迟分位、内存、最近请求）
 * DELETE /metrics —— 清空指标（仅用于 demo / 排障）
 */
@Controller()
export class MonitorController {
  constructor(
    private readonly metrics: MetricsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get('health')
  async health() {
    const dbOk = await this.checkDb()
    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      checks: {
        db: dbOk ? 'up' : 'down',
      },
    }
  }

  @Get('metrics')
  metricsSnapshot() {
    return this.metrics.snapshot()
  }

  @Delete('metrics')
  reset() {
    this.metrics.reset()
    return { ok: true }
  }

  private async checkDb(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) return false
      if (this.dataSource.options.type === 'mongodb') {
        // mongo 驱动：用 admin ping 命令探活
        const mongo = this.dataSource.driver as unknown as {
          queryRunner?: {
            databaseConnection?: {
              db: (n: string) => { command: (c: unknown) => Promise<unknown> }
            }
          }
        }
        const conn = mongo.queryRunner?.databaseConnection
        if (conn) await conn.db('admin').command({ ping: 1 })
      } else {
        await this.dataSource.query('SELECT 1')
      }
      return true
    } catch {
      return false
    }
  }
}
