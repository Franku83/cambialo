import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { UsernameValidatorService } from './username-validator.service'

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsernameValidatorService],
  exports: [UsersService, UsernameValidatorService],
})
export class UsersModule {}
