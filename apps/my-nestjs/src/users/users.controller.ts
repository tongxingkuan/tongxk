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
import { UpdateUserDto } from './dto/user.dto'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('superadmin', 'admin')
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  @Roles('superadmin', 'admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  @Roles('superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @Post(':id/reset-password')
  @Roles('superadmin')
  resetPassword(@Param('id') id: string, @Body() body: { password?: string }) {
    return this.usersService.resetPassword(id, body.password ?? '')
  }

  @Delete(':id')
  @Roles('superadmin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
