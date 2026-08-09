import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'node:path'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { UserEntity } from './auth/entities/user.entity'
import { ChatsModule } from './chats/chats.module'
import { ConversationEntity } from './chats/entities/conversation.entity'
import { MessageEntity } from './chats/entities/message.entity'
import { JwtAuthGuard } from './common/jwt.guard'
import { appConfig } from './config/app.config'
import { databaseConfig, type DatabaseConfig } from './config/database.config'
import { llmConfig } from './config/llm.config'
import { redisConfig } from './config/redis.config'
import { KnowledgeBaseEntity } from './knowledge/entities/knowledge-base.entity'
import { KnowledgeModule } from './knowledge/knowledge.module'
import { LlmModule } from './llm/llm.module'
import { RedisModule } from './redis/redis.module'
import { CostInterceptor } from './interceptor/cost.interceptor'

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const entities = [UserEntity, ConversationEntity, MessageEntity, KnowledgeBaseEntity]

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), `.env.${NODE_ENV}.local`),
        join(process.cwd(), `.env.${NODE_ENV}`),
        join(process.cwd(), '.env'),
      ],
      load: [appConfig, databaseConfig, redisConfig, llmConfig],
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: DatabaseConfig) => ({
        type: db.type,
        host: db.host,
        port: db.port,
        username: db.username,
        password: db.password,
        database: db.database,
        entities,
        synchronize: db.synchronize,
        logging: db.logging,
      }),
    }),
    RedisModule,
    LlmModule,
    KnowledgeModule,
    AuthModule,
    ChatsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: CostInterceptor },
  ],
})
export class AppModule {}
