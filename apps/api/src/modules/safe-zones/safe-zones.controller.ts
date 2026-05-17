import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { SafeZonesService } from './safe-zones.service'

@ApiTags('Safe Zones')
@Controller('safe-zones')
export class SafeZonesController {
  constructor(private readonly safeZonesService: SafeZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar zonas seguras, opcionalmente filtradas por ciudad' })
  async findAll(@Query('city') city?: string, @Query('state') state?: string) {
    if (city) return this.safeZonesService.findByCity(city, state)
    return this.safeZonesService.findAll()
  }
}
