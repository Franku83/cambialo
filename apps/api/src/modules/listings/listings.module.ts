import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ListingsController } from './listings.controller'
import { ListingsService } from './listings.service'
import { PhotoController } from './photo.controller'
import { PhotoService } from './photo.service'
import { TypesenseService } from './typesense.service'
import { TypesenseSyncWorker } from './workers/typesense-sync.worker'
import { AutoModerationService } from '../admin/auto-moderation.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'listings' }),
  ],
  controllers: [ListingsController, PhotoController],
  providers: [ListingsService, PhotoService, TypesenseService, TypesenseSyncWorker, AutoModerationService],
  exports: [ListingsService, PhotoService, TypesenseService],
})
export class ListingsModule {}
