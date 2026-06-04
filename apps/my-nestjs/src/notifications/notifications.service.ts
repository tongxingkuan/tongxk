import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { Repository } from 'typeorm'
import { idWhere } from '../common/db/id.util'
import {
  CreateNotificationDto,
  MarkReadDto,
  UpdateNotificationDto,
} from './dto/notification.dto'
import {
  NotificationEntity,
  NotificationReadEntity,
} from './entities/notification.entity'

interface FeedContext {
  userId?: string | null
  role?: string
  visitorId?: string
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    @InjectRepository(NotificationReadEntity)
    private readonly reads: Repository<NotificationReadEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.notifications.count()
    if (count > 0) return
    const now = new Date()
    await this.notifications.save([
      this.notifications.create({
        id: randomUUID(),
        title: '欢迎使用 TongXK',
        content: '前台支持游客访问，注册后可接收个性化推荐通知。',
        type: 'system',
        targetRoles: [],
        targetUserIds: [],
        priority: 10,
        link: null,
        expiresAt: null,
        createdAt: now,
      }),
      this.notifications.create({
        id: randomUUID(),
        title: '新用户专享',
        content: '注册成为会员，解锁更多个性化内容推荐。',
        type: 'recommend',
        targetRoles: ['user'],
        targetUserIds: [],
        priority: 5,
        link: '/register',
        expiresAt: null,
        createdAt: now,
      }),
    ])
  }

  findAllAdmin() {
    return this.notifications.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    })
  }

  async findOne(id: string) {
    const item = await this.notifications.findOne({ where: idWhere(id) })
    if (!item) throw new NotFoundException(`通知 ${id} 不存在`)
    return item
  }

  async create(dto: CreateNotificationDto) {
    return this.notifications.save(
      this.notifications.create({
        id: randomUUID(),
        title: dto.title,
        content: dto.content,
        type: dto.type ?? 'info',
        targetRoles: dto.targetRoles ?? [],
        targetUserIds: dto.targetUserIds ?? [],
        priority: dto.priority ?? 0,
        link: dto.link ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdAt: new Date(),
      }),
    )
  }

  async update(id: string, dto: UpdateNotificationDto) {
    const item = await this.findOne(id)
    Object.assign(item, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.targetRoles !== undefined && { targetRoles: dto.targetRoles }),
      ...(dto.targetUserIds !== undefined && {
        targetUserIds: dto.targetUserIds,
      }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.link !== undefined && { link: dto.link }),
      ...(dto.expiresAt !== undefined && {
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      }),
    })
    return this.notifications.save(item)
  }

  async remove(id: string) {
    const item = await this.findOne(id)
    await this.notifications.remove(item)
    return { ok: true }
  }

  /** 个性化推荐：按角色/用户/游客过滤 */
  async feed(ctx: FeedContext) {
    const now = new Date()
    const all = await this.notifications.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    })

    const role = ctx.role ?? 'guest'
    const filtered = all.filter(n => {
      if (n.expiresAt && n.expiresAt < now) return false
      if (n.targetUserIds.length && ctx.userId) {
        return n.targetUserIds.includes(ctx.userId)
      }
      if (n.targetUserIds.length && !ctx.userId) return false
      if (n.targetRoles.length) {
        return n.targetRoles.includes(role)
      }
      return true
    })

    const readSet = await this.loadReadSet(ctx)
    return filtered.map(n => ({
      id: String(n.id),
      title: n.title,
      content: n.content,
      type: n.type,
      priority: n.priority,
      link: n.link,
      createdAt: n.createdAt,
      read: readSet.has(String(n.id)),
    }))
  }

  async markRead(dto: MarkReadDto, ctx: FeedContext) {
    const now = new Date()
    for (const notificationId of dto.notificationIds) {
      const where = ctx.userId
        ? { notificationId, userId: ctx.userId }
        : {
            notificationId,
            visitorId: dto.visitorId ?? ctx.visitorId ?? '',
          }
      const exist = await this.reads.findOne({ where: where as never })
      if (exist) continue
      await this.reads.save(
        this.reads.create({
          id: randomUUID(),
          notificationId,
          userId: ctx.userId ?? null,
          visitorId: ctx.userId
            ? null
            : (dto.visitorId ?? ctx.visitorId ?? null),
          readAt: now,
        }),
      )
    }
    return { ok: true }
  }

  private async loadReadSet(ctx: FeedContext) {
    const where = ctx.userId
      ? { userId: ctx.userId }
      : { visitorId: ctx.visitorId ?? '' }
    const list = await this.reads.find({ where: where as never })
    return new Set(list.map(r => r.notificationId))
  }
}
