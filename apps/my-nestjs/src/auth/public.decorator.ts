import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
/** 标记路由无需登录 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth'
/** 标记路由支持游客访问，有 token 时挂载用户信息 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true)
