import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard, Roles } from '../auth/auth.guard'
import { ClearScope, DbService } from './db.service'

/**
 * 数据库管理接口（demo 用，仅 superadmin 可调用）。
 *
 * - GET    /db/info     公开：DB 类型 / 库名 / 各集合记录数
 * - DELETE /db/data     需 superadmin：清空数据，?scope=all|tenants|members
 * - POST   /db/seed     需 superadmin：灌入示例数据
 * - GET    /db/export   需 superadmin：导出全量 JSON
 * - POST   /db/import   需 superadmin：导入 JSON（先清空再写入）
 */
@Controller('db')
export class DbController {
  constructor(private readonly db: DbService) {}

  /** info 不涉及数据修改，对外公开方便排查 */
  @Get('info')
  info() {
    return this.db.info()
  }

  @Delete('data')
  @UseGuards(AuthGuard)
  @Roles('superadmin')
  clear(@Query('scope') scope?: string) {
    const allowed: ClearScope[] = ['all', 'tenants', 'members']
    const target = (scope ?? 'all') as ClearScope
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `scope 必须是 ${allowed.join(' / ')}，收到 "${scope}"`,
      )
    }
    return this.db.clear(target)
  }

  @Post('seed')
  @UseGuards(AuthGuard)
  @Roles('superadmin')
  seed() {
    return this.db.seed()
  }

  @Get('export')
  @UseGuards(AuthGuard)
  @Roles('superadmin')
  exportAll() {
    return this.db.exportAll()
  }

  @Post('import')
  @UseGuards(AuthGuard)
  @Roles('superadmin')
  importAll(@Body() payload: unknown) {
    return this.db.importAll(payload as Parameters<DbService['importAll']>[0])
  }
}
