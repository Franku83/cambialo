import { Controller, Get, Query } from '@nestjs/common'
import { DeviceModelsService } from './device-models.service'

@Controller('device-models')
export class DeviceModelsController {
  constructor(private readonly service: DeviceModelsService) {}

  @Get()
  search(
    @Query('search') search?: string,
    @Query('brand') brand?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.search({
      ...(search !== undefined && { search }),
      ...(brand !== undefined && { brand }),
      limit: limit ? Math.min(Number(limit), 50) : 10,
    })
  }
}
