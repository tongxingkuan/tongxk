import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'

export interface PublicUser {
  id: string
  username: string
  createdAt: Date
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async register(username: string, password: string): Promise<{ token: string, user: PublicUser }> {
    const exist = await this.users.findOne({ where: { username } })
    if (exist) throw new ConflictException(`用户名 "${username}" 已被占用`)

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await this.users.save(this.users.create({ username, passwordHash }))
    return this.issue(user)
  }

  async login(username: string, password: string): Promise<{ token: string, user: PublicUser }> {
    const user = await this.users.findOne({
      where: { username },
      select: ['id', 'username', 'passwordHash', 'createdAt'],
    })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    return this.issue(user)
  }

  private async issue(user: UserEntity): Promise<{ token: string, user: PublicUser }> {
    const token = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
    })
    return {
      token,
      user: { id: user.id, username: user.username, createdAt: user.createdAt },
    }
  }
}
