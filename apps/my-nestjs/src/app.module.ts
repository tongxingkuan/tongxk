import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { join } from 'node:path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerMiddleware } from './common/middleware/logger.middleware'
import { MonitorModule } from './common/monitor/monitor.module'
import { appConfig } from './config/app.config'
import { databaseConfig, type DatabaseConfig } from './config/database.config'
import { MemberEntity } from './members/entities/member.entity'
import { MembersModule } from './members/members.module'
import { TenantEntity } from './tenants/entities/tenant.entity'
import { TenantsModule } from './tenants/tenants.module'

const NODE_ENV = process.env.NODE_ENV ?? 'development'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 多环境加载：优先 .env.{NODE_ENV}.local，其次 .env.{NODE_ENV}，最后 .env
      envFilePath: [
        join(process.cwd(), `.env.${NODE_ENV}.local`),
        join(process.cwd(), `.env.${NODE_ENV}`),
        join(process.cwd(), '.env'),
      ],
      load: [appConfig, databaseConfig],
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [databaseConfig.KEY],
      useFactory: (db: DatabaseConfig) => {
        if (db.type === 'mongodb') {
          return {
            type: 'mongodb' as const,
            url: db.url,
            database: db.mongoDatabase,
            synchronize: db.synchronize,
            logging: db.logging,
            entities: [TenantEntity, MemberEntity],
          }
        }
        return {
          type: 'better-sqlite3' as const,
          database: db.database,
          synchronize: db.synchronize,
          logging: db.logging,
          entities: [TenantEntity, MemberEntity],
        }
      },
    }),
    TenantsModule,
    MembersModule,
    MonitorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
