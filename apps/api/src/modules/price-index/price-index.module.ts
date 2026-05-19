import { Module } from '@nestjs/common'
import { PriceIndexController } from './price-index.controller'
import { PriceIndexService } from './price-index.service'

@Module({
  controllers: [PriceIndexController],
  providers: [PriceIndexService],
  exports: [PriceIndexService],
})
export class PriceIndexModule {}
