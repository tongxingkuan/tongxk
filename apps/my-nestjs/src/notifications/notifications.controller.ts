import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import {
  CreateNotificationDto,
  MarkReadDto,
  UpdateNotificationDto,
} from './dto/notification.dto'
import { NotificationsService } from './notifications.service'

interface AuthRequest extends Request {
  user?: PublicUser | null
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** 个性化通知流（游客/登录用户均可） */
  @Get('feed')
  @Public()
  @OptionalAuth()
  @UseGuards(OptionalAuthGuard)
  feed(@Req() req: AuthRequest, @Query('visitorId') visitorId?: string) {
    return this.notifications.feed({
      userId: req.user?.id ?? null,
      role: req.user?.role ?? 'guest',
      visitorId,
    })
  }

  @Post('read')
  @Public()
  @OptionalAuth()
  @UseGuards(OptionalAuthGuard)
  markRead(@Body() dto: MarkReadDto, @Req() req: AuthRequest) {
    return this.notifications.markRead(dto, {
      userId: req.user?.id ?? null,
      role: req.user?.role ?? 'guest',
      visitorId: dto.visitorId,
    })
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  findAll() {
    return this.notifications.findAllAdmin()
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  findOne(@Param('id') id: string) {
    return this.notifications.findOne(id)
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(dto)
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notifications.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string) {
    return this.notifications.remove(id)
  }
}
