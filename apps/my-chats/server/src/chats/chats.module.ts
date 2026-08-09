import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { KnowledgeModule } from '../knowledge/knowledge.module'
import { LlmModule } from '../llm/llm.module'
import { ChatsController } from './chats.controller'
import { ChatsService } from './chats.service'
import { ConversationEntity } from './entities/conversation.entity'
import { MessageEntity } from './entities/message.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ConversationEntity, MessageEntity]), LlmModule, KnowledgeModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
