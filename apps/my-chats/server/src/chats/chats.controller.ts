import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../common/current-user.decorator'
import type { RequestUser } from '../common/current-user.decorator'
import { ChatsService } from './chats.service'
import { CHARACTERS } from './characters'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateChatDto } from './dto/update-chat.dto'

@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser) {
    return this.chats.create(user.id)
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.chats.list(user.id)
  }

  /** 角色预设列表（提示词不下发） */
  @Get('characters')
  characters() {
    return CHARACTERS.map(({ key, name, description }) => ({ key, name, description }))
  }

  @Get(':id')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const conv = await this.chats.findById(id, user.id)
    if (!conv) throw new NotFoundException('对话不存在')
    return conv
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateChatDto) {
    return this.chats.updateTitle(id, user.id, dto.title)
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chats.remove(id, user.id)
  }

  @Post(':id/messages')
  streamMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Res() res: Response,
  ) {
    return this.chats.streamMessage(id, user.id, dto.content, res, dto.character)
  }

  /** 刷新后续传：对生成中的 assistant 消息恢复 SSE 流 */
  @Post(':id/messages/:messageId/resume')
  resumeMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Res() res: Response,
  ) {
    return this.chats.resumeMessage(id, messageId, user.id, res)
  }
}
