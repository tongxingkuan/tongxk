import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { PublicUser } from './auth.service'
import { IS_OPTIONAL_AUTH_KEY, IS_PUBLIC_KEY } from './public.decorator'
import { verifyToken } from './auth.utils'

interface AuthRequest extends Request {
  user?: PublicUser | null
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [ctx.getHandler(), ctx.getClass()],
    )

    const req = ctx.switchToHttp().getRequest<AuthRequest>()
    const auth = req.headers['authorization']
    const token
      = typeof auth === 'string' && auth.startsWith('Bearer ')
        ? auth.slice('Bearer '.length).trim()
        : ''
    const payload = verifyToken(token)

    if (payload) {
      req.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        createdAt: new Date(payload.iat * 1000),
      }
    } else {
      req.user = null
    }

    if (isPublic || isOptional) return true
    if (!payload) throw new UnauthorizedException('请先登录')
    return true
  }
}
