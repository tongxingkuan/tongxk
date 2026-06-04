import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'
import { PageVisitEntity } from './entities/page-visit.entity'

@Module({
  imports: [TypeOrmModule.forFeature([PageVisitEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
