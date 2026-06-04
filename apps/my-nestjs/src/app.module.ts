import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AnalyticsModule } from './analytics/analytics.module'
import { AuthModule } from './auth/auth.module'
import { LoggerMiddleware } from './common/middleware/logger.middleware'
import { MonitorModule } from './common/monitor/monitor.module'
import { appConfig } from './config/app.config'
import { databaseConfig, type DatabaseConfig } from './config/database.config'
import { DbModule } from './db/db.module'
import { MemberEntity } from './members/entities/member.entity'
import { MembersModule } from './members/members.module'
import { NotificationsModule } from './notifications/notifications.module'
import {
  NotificationEntity,
  NotificationReadEntity,
} from './notifications/entities/notification.entity'
import { PageConfigEntity } from './page-config/entities/page-config.entity'
import { PageConfigModule } from './page-config/page-config.module'
import { PageVisitEntity } from './analytics/entities/page-visit.entity'
import { RoleEntity } from './roles/entities/role.entity'
import { RolesModule } from './roles/roles.module'
import { TenantEntity } from './tenants/entities/tenant.entity'
import { TenantsModule } from './tenants/tenants.module'
import { UserEntity } from './users/entities/user.entity'
import { UsersModule } from './users/users.module'

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
            entities: [
              TenantEntity,
              MemberEntity,
              UserEntity,
              RoleEntity,
              PageVisitEntity,
              PageConfigEntity,
              NotificationEntity,
              NotificationReadEntity,
            ],
          }
        }
        // sql.js：纯 JS SQLite，无需编译 native 模块（Windows 友好）
        const location = join(process.cwd(), db.database)
        mkdirSync(dirname(location), { recursive: true })
        return {
          type: 'sqljs' as const,
          location,
          autoSave: true,
          synchronize: db.synchronize,
          logging: db.logging,
          entities: [
            TenantEntity,
            MemberEntity,
            UserEntity,
            RoleEntity,
            PageVisitEntity,
            PageConfigEntity,
            NotificationEntity,
            NotificationReadEntity,
          ],
        }
      },
    }),
    AuthModule,
    TenantsModule,
    MembersModule,
    UsersModule,
    RolesModule,
    AnalyticsModule,
    PageConfigModule,
    NotificationsModule,
    MonitorModule,
    DbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
