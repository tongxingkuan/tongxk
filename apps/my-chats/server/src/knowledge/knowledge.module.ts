import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../auth/entities/user.entity'
import { KnowledgeController } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity'

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeBaseEntity, UserEntity])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
