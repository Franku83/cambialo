import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UsernameValidatorService } from '../users/username-validator.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, UsernameValidatorService],
  exports: [AuthService],
})
export class AuthModule {}
