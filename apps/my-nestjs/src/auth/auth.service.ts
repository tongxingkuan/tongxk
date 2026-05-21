import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { Repository } from 'typeorm'
import { UserEntity } from '../users/entities/user.entity'
import {
  hashPassword,
  signToken,
  TokenPayload,
  verifyPassword,
} from './auth.utils'

export interface PublicUser {
  id: string
  username: string
  role: string
  createdAt: Date
}

const toPublic = (u: UserEntity): PublicUser => ({
  // mongo 历史数据可能是 ObjectId，统一转字符串
  id: String(u.id),
  username: u.username,
  role: u.role,
  createdAt: u.createdAt,
})

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  /** 应用启动时确保超级管理员存在 */
  async onModuleInit(): Promise<void> {
    const username = 'superadmin'
    const exist = await this.users.findOne({ where: { username } })
    if (exist) return
    const password = process.env.SUPERADMIN_PASSWORD ?? 'superadmin@123'
    await this.users.save(
      this.users.create({
        id: randomUUID(),
        username,
        passwordHash: hashPassword(password),
        role: 'superadmin',
        createdAt: new Date(),
      }),
    )

    console.log(
      `[auth] 已创建超级管理员账号 username=${username} password=${password}（生产环境请通过 SUPERADMIN_PASSWORD 配置自定义密码）`,
    )
  }

  async register(
    username: string,
    password: string,
  ): Promise<{ user: PublicUser, token: string }> {
    if (!username || username.length < 3)
      throw new ConflictException('用户名至少 3 个字符')
    if (!password || password.length < 6)
      throw new ConflictException('密码至少 6 个字符')
    const exist = await this.users.findOne({ where: { username } })
    if (exist) throw new ConflictException(`用户名 "${username}" 已被占用`)
    const user = await this.users.save(
      this.users.create({
        id: randomUUID(),
        username,
        passwordHash: hashPassword(password),
        role: 'user',
        createdAt: new Date(),
      }),
    )
    return this.issue(user)
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ user: PublicUser, token: string }> {
    const user = await this.users.findOne({ where: { username } })
    if (!user || !verifyPassword(password, user.passwordHash))
      throw new UnauthorizedException('用户名或密码错误')
    return this.issue(user)
  }

  async findById(id: string): Promise<PublicUser | null> {
    const u = await this.users.findOne({ where: { id } })
    return u ? toPublic(u) : null
  }

  /** 仅在 token 有效时返回当前用户，否则返回 null */
  async resolveFromPayload(
    payload: TokenPayload | null,
  ): Promise<PublicUser | null> {
    if (!payload) return null
    return this.findById(payload.sub)
  }

  private issue(user: UserEntity): { user: PublicUser, token: string } {
    const token = signToken({
      sub: String(user.id),
      username: user.username,
      role: user.role,
    })
    return { user: toPublic(user), token }
  }
}
