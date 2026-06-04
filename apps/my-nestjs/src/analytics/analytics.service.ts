import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { Between, Repository } from 'typeorm'
import { TrackPageViewDto } from './dto/analytics.dto'
import { PageVisitEntity } from './entities/page-visit.entity'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PageVisitEntity)
    private readonly visits: Repository<PageVisitEntity>,
  ) {}

  async track(
    dto: TrackPageViewDto,
    userId?: string | null,
    userAgent?: string,
  ) {
    const visit = this.visits.create({
      id: randomUUID(),
      path: dto.path,
      pageTitle: dto.pageTitle ?? null,
      visitorId: dto.visitorId,
      sessionId: dto.sessionId,
      userId: userId ?? null,
      referrer: dto.referrer ?? null,
      userAgent: userAgent ?? null,
      source: dto.source ?? 'react-app',
      createdAt: new Date(),
    })
    await this.visits.save(visit)
    return { ok: true }
  }

  async overview(days = 7) {
    const since = daysAgo(days)
    const all = await this.visits.find({
      where: { createdAt: Between(since, new Date()) },
      order: { createdAt: 'DESC' },
    })

    const pv = all.length
    const uv = new Set(all.map(v => v.visitorId)).size
    const loggedInUv = new Set(
      all.filter(v => v.userId).map(v => v.userId as string),
    ).size

    const byDay = new Map<string, { pv: number, uv: Set<string> }>()
    for (const v of all) {
      const key = startOfDay(v.createdAt).toISOString().slice(0, 10)
      const row = byDay.get(key) ?? { pv: 0, uv: new Set<string>() }
      row.pv += 1
      row.uv.add(v.visitorId)
      byDay.set(key, row)
    }

    const byPath = new Map<string, { pv: number, uv: Set<string> }>()
    for (const v of all) {
      const row = byPath.get(v.path) ?? { pv: 0, uv: new Set<string>() }
      row.pv += 1
      row.uv.add(v.visitorId)
      byPath.set(v.path, row)
    }

    const bySource = new Map<string, number>()
    for (const v of all) {
      bySource.set(v.source, (bySource.get(v.source) ?? 0) + 1)
    }

    return {
      range: { days, since: since.toISOString() },
      summary: { pv, uv, loggedInUv },
      daily: Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, row]) => ({ date, pv: row.pv, uv: row.uv.size })),
      topPages: Array.from(byPath.entries())
        .map(([path, row]) => ({ path, pv: row.pv, uv: row.uv.size }))
        .sort((a, b) => b.pv - a.pv)
        .slice(0, 20),
      bySource: Array.from(bySource.entries()).map(([source, count]) => ({
        source,
        count,
      })),
      recent: all.slice(0, 30).map(v => ({
        id: String(v.id),
        path: v.path,
        pageTitle: v.pageTitle,
        visitorId: v.visitorId,
        userId: v.userId,
        source: v.source,
        createdAt: v.createdAt,
      })),
    }
  }
}
