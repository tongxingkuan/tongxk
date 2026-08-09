import { ExecutionContext, createParamDecorator } from '@nestjs/common'

export interface RequestUser {
  id: string
  username: string
}

/** 从 req.user 取当前登录用户（由 JwtStrategy.validate 注入） */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const req = ctx.switchToHttp().getRequest<{ user: RequestUser }>()
  return req.user
})
