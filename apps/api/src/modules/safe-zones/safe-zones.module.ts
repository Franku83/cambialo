import { Module } from '@nestjs/common'
import { SafeZonesController } from './safe-zones.controller'
import { SafeZonesService } from './safe-zones.service'

@Module({
  controllers: [SafeZonesController],
  providers: [SafeZonesService],
  exports: [SafeZonesService],
})
export class SafeZonesModule {}
