import { IsString, MinLength } from 'class-validator'

export class AuthDto {
  @IsString()
  @MinLength(3, { message: '用户名至少 3 个字符' })
  username!: string

  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password!: string
}
