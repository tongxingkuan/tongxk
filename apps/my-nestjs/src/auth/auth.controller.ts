import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import type { PublicUser } from './auth.service'
import { AuthGuard, CurrentUser } from './auth.guard'

interface AuthDto {
  username?: string
  password?: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthDto) {
    return this.auth.register(dto.username ?? '', dto.password ?? '')
  }

  @Post('login')
  login(@Body() dto: AuthDto) {
    return this.auth.login(dto.username ?? '', dto.password ?? '')
  }

  /** 当前登录用户信息（前端用来校验 token 有效性） */
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: PublicUser) {
    return user
  }
}
