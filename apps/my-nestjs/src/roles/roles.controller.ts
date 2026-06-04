import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard, Roles } from '../auth/auth.guard'
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto'
import { RolesService } from './roles.service'

/** 角色管理仅超级管理员可访问 */
@Controller('roles')
@UseGuards(AuthGuard)
@Roles('superadmin')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id)
  }
}
