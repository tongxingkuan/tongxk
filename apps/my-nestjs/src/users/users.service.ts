import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { hashPassword } from '../auth/auth.utils'
import { idWhere } from '../common/db/id.util'
import { UpdateUserDto } from './dto/user.dto'
import { UserEntity } from './entities/user.entity'

export interface PublicUserRecord {
  id: string
  username: string
  role: string
  status: string
  displayName: string | null
  createdAt: Date
}

const toPublic = (u: UserEntity): PublicUserRecord => ({
  id: String(u.id),
  username: u.username,
  role: u.role,
  status: u.status,
  displayName: u.displayName,
  createdAt: u.createdAt,
})

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findAll() {
    const list = await this.users.find({ order: { createdAt: 'DESC' } })
    return list.map(toPublic)
  }

  async findOne(id: string) {
    const user = await this.users.findOne({ where: idWhere(id) })
    if (!user) throw new NotFoundException(`用户 ${id} 不存在`)
    return toPublic(user)
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.users.findOne({ where: idWhere(id) })
    if (!user) throw new NotFoundException(`用户 ${id} 不存在`)
    if (user.role === 'superadmin' && dto.role && dto.role !== 'superadmin') {
      throw new ConflictException('不能修改超级管理员的角色')
    }
    Object.assign(user, {
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.displayName !== undefined && { displayName: dto.displayName }),
    })
    const saved = await this.users.save(user)
    return toPublic(saved)
  }

  async remove(id: string) {
    const user = await this.users.findOne({ where: idWhere(id) })
    if (!user) throw new NotFoundException(`用户 ${id} 不存在`)
    if (user.role === 'superadmin') {
      throw new ConflictException('不能删除超级管理员')
    }
    await this.users.remove(user)
    return { ok: true }
  }

  async resetPassword(id: string, password: string) {
    if (!password || password.length < 6) {
      throw new ConflictException('密码至少 6 个字符')
    }
    const user = await this.users.findOne({ where: idWhere(id) })
    if (!user) throw new NotFoundException(`用户 ${id} 不存在`)
    user.passwordHash = hashPassword(password)
    await this.users.save(user)
    return { ok: true }
  }
}
