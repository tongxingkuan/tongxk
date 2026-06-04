import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard, Roles } from '../auth/auth.guard'
import type { PublicUser } from '../auth/auth.service'
import { OptionalAuth, Public } from '../auth/public.decorator'
import { OptionalAuthGuard } from '../auth/optional-auth.guard'
import { AnalyticsService } from './analytics.service'
import { TrackPageViewDto } from './dto/analytics.dto'

interface AuthRequest extends Request {
  user?: PublicUser | null
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** 前台埋点：支持游客，登录用户自动关联 userId */
  @Post('track')
  @Public()
  @OptionalAuth()
  @UseGuards(OptionalAuthGuard)
  track(@Body() dto: TrackPageViewDto, @Req() req: AuthRequest) {
    return this.analytics.track(
      dto,
      req.user?.id ?? null,
      req.headers['user-agent'],
    )
  }

  /** 后台 PV/UV 概览 */
  @Get('overview')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  overview(@Query('days') days?: string) {
    const n = Math.min(90, Math.max(1, parseInt(days ?? '7', 10) || 7))
    return this.analytics.overview(n)
  }
}
