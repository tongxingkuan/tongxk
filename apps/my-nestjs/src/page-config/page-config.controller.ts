import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard, Roles } from '../auth/auth.guard'
import { Public } from '../auth/public.decorator'
import {
  CreatePageConfigDto,
  UpdatePageConfigDto,
} from './dto/page-config.dto'
import { PageConfigService } from './page-config.service'

@Controller('page-config')
export class PageConfigController {
  constructor(private readonly pageConfig: PageConfigService) {}

  /** 前台读取页面配置（游客可访问），?locale=zh-CN 下发对应语言 */
  @Get('public')
  @Public()
  findPublic(@Query('group') group?: string, @Query('locale') locale?: string) {
    return this.pageConfig.findPublic(group, locale)
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  findAll() {
    return this.pageConfig.findAllAdmin()
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  findOne(@Param('id') id: string) {
    return this.pageConfig.findOne(id)
  }

  @Post()
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: CreatePageConfigDto) {
    return this.pageConfig.create(dto)
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdatePageConfigDto) {
    return this.pageConfig.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string) {
    return this.pageConfig.remove(id)
  }
}
