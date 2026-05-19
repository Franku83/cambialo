import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { ModerationController } from './moderation.controller'
import { ModerationService } from './moderation.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController, ModerationController],
  providers: [AdminService, ModerationService],
  exports: [AdminService, ModerationService],
})
export class AdminModule {}
