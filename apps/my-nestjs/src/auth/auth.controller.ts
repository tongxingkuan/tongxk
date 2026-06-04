import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import type { PublicUser } from './auth.service'
import { AuthGuard, CurrentUser } from './auth.guard'
import { Public } from './public.decorator'

interface AuthDto {
  username?: string
  password?: string
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Public()
  register(@Body() dto: AuthDto) {
    return this.auth.register(dto.username ?? '', dto.password ?? '')
  }

  @Post('login')
  @Public()
  login(@Body() dto: AuthDto) {
    return this.auth.login(dto.username ?? '', dto.password ?? '')
  }

  /** 当前登录用户信息（含权限列表） */
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: PublicUser) {
    return this.auth.enrichUser(user)
  }
}
