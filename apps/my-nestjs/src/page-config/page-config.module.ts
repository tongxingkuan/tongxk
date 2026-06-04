import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PageConfigEntity } from './entities/page-config.entity'
import { PageConfigController } from './page-config.controller'
import { PageConfigService } from './page-config.service'

@Module({
  imports: [TypeOrmModule.forFeature([PageConfigEntity])],
  controllers: [PageConfigController],
  providers: [PageConfigService],
  exports: [PageConfigService],
})
export class PageConfigModule {}
