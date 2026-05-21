import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { PublicUser } from './auth.service'
import { verifyToken } from './auth.utils'

interface AuthRequest extends Request {
  user?: PublicUser
}

/** 路由元数据 key */
export const ROLES_KEY = 'roles'
/** 控制路由所需角色，例如 @Roles('superadmin') */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

/** 当前已登录用户参数装饰器 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser | undefined => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>()
    return req.user
  },
)

/**
 * 鉴权 + 角色守卫。
 * - 解析 Authorization: Bearer <token>
 * - 校验签名/过期，挂到 req.user
 * - 若路由声明 @Roles，则要求角色匹配，否则只要登录即可
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthRequest>()
    const auth = req.headers['authorization']
    const token
      = typeof auth === 'string' && auth.startsWith('Bearer ')
        ? auth.slice('Bearer '.length).trim()
        : ''
    const payload = verifyToken(token)
    if (!payload) throw new UnauthorizedException('请先登录')

    // 把最简用户信息挂到 req.user（service 中可按需补全）
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      createdAt: new Date(payload.iat * 1000),
    }

    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    )
    if (required && required.length && !required.includes(payload.role)) {
      throw new ForbiddenException(`需要角色：${required.join('/')}`)
    }
    return true
  }
}
