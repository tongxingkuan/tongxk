import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC = 'isPublic'

/** 标记接口为公开，跳过 JWT 守卫 */
export const Public = () => SetMetadata(IS_PUBLIC, true)
