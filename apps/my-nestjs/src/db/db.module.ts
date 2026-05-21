import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MemberEntity } from '../members/entities/member.entity'
import { TenantEntity } from '../tenants/entities/tenant.entity'
import { DbController } from './db.controller'
import { DbService } from './db.service'

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity, MemberEntity])],
  controllers: [DbController],
  providers: [DbService],
})
export class DbModule {}
