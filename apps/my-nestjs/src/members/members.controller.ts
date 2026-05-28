import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto'
import { MembersService } from './members.service'

/**
 * 成员路由 —— 所有请求都需通过 `x-tenant-id` 请求头声明所属租户。
 * 这是多租户系统中"行级隔离"的最简单实现：网关层统一注入租户上下文，
 * 业务层始终使用该上下文进行数据访问。
 */
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  private requireTenant(tenantId?: string): string {
    if (!tenantId) {
      throw new BadRequestException('缺少 x-tenant-id 请求头，无法识别租户')
    }
    return tenantId
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId?: string) {
    return this.membersService.findAll(this.requireTenant(tenantId))
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId?: string) {
    return this.membersService.findOne(this.requireTenant(tenantId), id)
  }

  @Post()
  create(
    @Body() dto: CreateMemberDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.membersService.create(this.requireTenant(tenantId), dto)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.membersService.update(this.requireTenant(tenantId), id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-tenant-id') tenantId?: string) {
    return this.membersService.remove(this.requireTenant(tenantId), id)
  }
}
