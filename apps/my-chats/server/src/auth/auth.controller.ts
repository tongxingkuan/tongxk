import { Body, Controller, Post, Req } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExtractJwt } from 'passport-jwt'
import type { Request } from 'express'
import { CurrentUser } from '../common/current-user.decorator'
import type { RequestUser } from '../common/current-user.decorator'
import { Public } from '../common/public.decorator'
import { RedisService } from '../redis/redis.service'
import { AuthService } from './auth.service'
import { AuthDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: AuthDto) {
    return this.auth.register(dto.username, dto.password)
  }

  @Public()
  @Post('login')
  login(@Body() dto: AuthDto) {
    return this.auth.login(dto.username, dto.password)
  }

  /** 登出：将当前 token 加入黑名单（按过期时间设置 TTL） */
  @Post('logout')
  async logout(@CurrentUser() _user: RequestUser, @Req() req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if (token) {
      const ttl = this.parseExpiresInSeconds(this.config.get<string>('JWT_EXPIRES_IN') ?? '7d')
      await this.redis.set(`jwt:blacklist:${token}`, '1', ttl)
    }
    return { success: true }
  }

  private parseExpiresInSeconds(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim())
    if (!match) return 7 * 24 * 3600
    const n = parseInt(match[1], 10)
    const unit = match[2]
    const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 86400
    return n * factor
  }
}
