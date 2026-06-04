import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { Repository } from 'typeorm'
import { idWhere } from '../common/db/id.util'
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto'
import { RoleEntity } from './entities/role.entity'

const DEFAULT_ROLES: Omit<RoleEntity, 'id' | 'createdAt'>[] = [
  {
    code: 'superadmin',
    name: '超级管理员',
    description: '拥有全部权限',
    permissions: ['*'],
    active: true,
  },
  {
    code: 'admin',
    name: '管理员',
    description: '运营管理员：可查看数据、配置页面与通知，不可管理角色与用户',
    permissions: [
      'analytics:read',
      'page-config:read',
      'page-config:write',
      'notifications:read',
      'notifications:write',
      'users:read',
    ],
    active: true,
  },
  {
    code: 'user',
    name: '普通用户',
    description: '前台注册用户',
    permissions: ['profile:read'],
    active: true,
  },
  {
    code: 'guest',
    name: '游客',
    description: '未登录访客',
    permissions: [],
    active: true,
  },
]

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const role of DEFAULT_ROLES) {
      const exist = await this.roles.findOne({ where: { code: role.code } })
      if (!exist) {
        await this.roles.save(
          this.roles.create({
            id: randomUUID(),
            ...role,
            createdAt: new Date(),
          }),
        )
        continue
      }
      // 同步预置角色的权限定义（避免升级后 admin 仍保留旧权限）
      if (role.code === 'admin' || role.code === 'superadmin') {
        exist.permissions = role.permissions
        exist.description = role.description
        exist.name = role.name
        await this.roles.save(exist)
      }
    }
  }

  findAll() {
    return this.roles.find({ order: { createdAt: 'ASC' } })
  }

  async findOne(id: string) {
    const role = await this.roles.findOne({ where: idWhere(id) })
    if (!role) throw new NotFoundException(`角色 ${id} 不存在`)
    return role
  }

  async findByCode(code: string) {
    return this.roles.findOne({ where: { code } })
  }

  async getPermissionsByCode(code: string): Promise<string[]> {
    if (code === 'superadmin') return ['*']
    const role = await this.findByCode(code)
    return role?.permissions ?? []
  }

  async create(dto: CreateRoleDto) {
    const exist = await this.roles.findOne({ where: { code: dto.code } })
    if (exist) throw new ConflictException(`角色编码 "${dto.code}" 已存在`)
    return this.roles.save(
      this.roles.create({
        id: randomUUID(),
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        permissions: dto.permissions ?? [],
        active: dto.active ?? true,
        createdAt: new Date(),
      }),
    )
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id)
    if (role.code === 'superadmin' && dto.active === false) {
      throw new ConflictException('不能禁用超级管理员角色')
    }
    Object.assign(role, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.permissions !== undefined && { permissions: dto.permissions }),
      ...(dto.active !== undefined && { active: dto.active }),
    })
    return this.roles.save(role)
  }

  async remove(id: string) {
    const role = await this.findOne(id)
    if (role.code === 'superadmin') {
      throw new ConflictException('不能删除超级管理员角色')
    }
    await this.roles.remove(role)
    return { ok: true }
  }
}
