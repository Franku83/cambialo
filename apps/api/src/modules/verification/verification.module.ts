import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { VerificationController } from './verification.controller'
import { VerificationService } from './verification.service'
import { VerificationWorker } from './workers/verification.worker'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'verification' }),
    BullModule.registerQueue({ name: 'listings' }),
    NotificationsModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationWorker],
  exports: [VerificationService],
})
export class VerificationModule {}
