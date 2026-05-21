import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { DataSource, Repository } from 'typeorm'
import { MemberEntity } from '../members/entities/member.entity'
import { TenantEntity } from '../tenants/entities/tenant.entity'

export type ClearScope = 'all' | 'tenants' | 'members'

export interface ExportData {
  exportedAt: string
  dbType: 'sqlite' | 'mongodb' | string
  tenants: TenantEntity[]
  members: MemberEntity[]
}

@Injectable()
export class DbService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepo: Repository<TenantEntity>,
    @InjectRepository(MemberEntity)
    private readonly membersRepo: Repository<MemberEntity>,
  ) {}

  async info() {
    const opts = this.dataSource.options as { type: string, database?: string }
    const dbType = opts.type
    const database
      = dbType === 'mongodb'
        ? (opts.database ?? '(default)')
        : (opts.database ?? '(unknown)')

    const [tenantCount, memberCount] = await Promise.all([
      this.tenantsRepo.count(),
      this.membersRepo.count(),
    ])

    return {
      dbType,
      database,
      isInitialized: this.dataSource.isInitialized,
      counts: {
        tenants: tenantCount,
        members: memberCount,
      },
    }
  }

  async clear(scope: ClearScope) {
    const result: Record<string, number> = {}
    if (scope === 'all' || scope === 'members') {
      result.members = await this.deleteAll(this.membersRepo)
    }
    if (scope === 'all' || scope === 'tenants') {
      result.tenants = await this.deleteAll(this.tenantsRepo)
    }
    return { scope, deleted: result }
  }

  /**
   * 灌入示例数据：3 个租户 + 每个租户若干成员。
   * 已存在同名租户会跳过，保证幂等。
   */
  async seed() {
    const seedData: Array<{
      name: string
      plan: string
      members: Array<{ name: string, email: string, role: string }>
    }> = [
      {
        name: 'acme-corp',
        plan: 'enterprise',
        members: [
          { name: 'Alice', email: 'alice@acme.com', role: 'owner' },
          { name: 'Bob', email: 'bob@acme.com', role: 'admin' },
          { name: 'Carol', email: 'carol@acme.com', role: 'member' },
        ],
      },
      {
        name: 'globex',
        plan: 'pro',
        members: [
          { name: 'Dave', email: 'dave@globex.com', role: 'owner' },
          { name: 'Eve', email: 'eve@globex.com', role: 'member' },
        ],
      },
      {
        name: 'initech',
        plan: 'free',
        members: [{ name: 'Frank', email: 'frank@initech.com', role: 'owner' }],
      },
    ]

    let createdTenants = 0
    let createdMembers = 0
    for (const t of seedData) {
      const exist = await this.tenantsRepo.findOne({ where: { name: t.name } })
      const tenant
        = exist
          ?? (await this.tenantsRepo.save(
            this.tenantsRepo.create({
              id: randomUUID(),
              name: t.name,
              plan: t.plan,
              active: true,
              createdAt: new Date(),
            }),
          ))
      if (!exist) createdTenants += 1

      for (const m of t.members) {
        const dup = await this.membersRepo.findOne({
          where: { tenantId: tenant.id, email: m.email },
        })
        if (dup) continue
        await this.membersRepo.save(
          this.membersRepo.create({
            id: randomUUID(),
            tenantId: tenant.id,
            name: m.name,
            email: m.email,
            role: m.role,
            createdAt: new Date(),
          }),
        )
        createdMembers += 1
      }
    }
    return { createdTenants, createdMembers }
  }

  async exportAll(): Promise<ExportData> {
    const [tenants, members] = await Promise.all([
      this.tenantsRepo.find(),
      this.membersRepo.find(),
    ])
    return {
      exportedAt: new Date().toISOString(),
      dbType: this.dataSource.options.type as string,
      tenants,
      members,
    }
  }

  /**
   * 导入数据。默认先清空再导入，保证幂等。
   * - 校验最低限度的字段，防止脏数据
   * - 不存在的字段使用默认值
   */
  async importAll(payload: Partial<ExportData>) {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('payload 必须是对象')
    }
    const tenants = Array.isArray(payload.tenants) ? payload.tenants : []
    const members = Array.isArray(payload.members) ? payload.members : []

    await this.clear('all')

    for (const t of tenants) {
      if (!t || typeof t.name !== 'string') continue
      await this.tenantsRepo.save(
        this.tenantsRepo.create({
          id: typeof t.id === 'string' ? t.id : randomUUID(),
          name: t.name,
          plan: typeof t.plan === 'string' ? t.plan : 'free',
          active: typeof t.active === 'boolean' ? t.active : true,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        }),
      )
    }

    for (const m of members) {
      if (
        !m
        || typeof m.tenantId !== 'string'
        || typeof m.name !== 'string'
        || typeof m.email !== 'string'
      ) {
        continue
      }
      await this.membersRepo.save(
        this.membersRepo.create({
          id: typeof m.id === 'string' ? m.id : randomUUID(),
          tenantId: m.tenantId,
          name: m.name,
          email: m.email,
          role: typeof m.role === 'string' ? m.role : 'member',
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }),
      )
    }

    return {
      imported: {
        tenants: tenants.length,
        members: members.length,
      },
    }
  }

  private async deleteAll<T extends { id: string }>(
    repo: Repository<T>,
  ): Promise<number> {
    const all = await repo.find()
    if (all.length === 0) return 0
    await repo.remove(all)
    return all.length
  }
}
