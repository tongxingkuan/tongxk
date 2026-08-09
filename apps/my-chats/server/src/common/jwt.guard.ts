import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt'
import { RedisService } from '../redis/redis.service'
import { IS_PUBLIC } from './public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {
    // 调用父类构造函数
    super()
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])
    if (isPublic) return true

    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>()
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if (token && (await this.redis.exists(`jwt:blacklist:${token}`))) {
      throw new UnauthorizedException('登录已失效，请重新登录')
    }

    return (await super.canActivate(ctx)) as boolean
  }
}
