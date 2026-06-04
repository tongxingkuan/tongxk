import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../users/entities/user.entity'
import { RolesModule } from '../roles/roles.module'
import { RolesService } from '../roles/roles.service'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { OptionalAuthGuard } from './optional-auth.guard'
import { AuthService } from './auth.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RolesModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OptionalAuthGuard],
  exports: [AuthService, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
