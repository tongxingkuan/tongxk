import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantsModule } from '../tenants/tenants.module'
import { MemberEntity } from './entities/member.entity'
import { MembersController } from './members.controller'
import { MembersService } from './members.service'

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity]), TenantsModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
