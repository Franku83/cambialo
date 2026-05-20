import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { PriceIndexService } from './price-index.service'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'

@ApiTags('Price Index')
@Controller('price-index')
export class PriceIndexController {
  constructor(private readonly service: PriceIndexService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener precio promedio para un modelo + storage' })
  async get(
    @Query('deviceModelId') deviceModelId: string,
    @Query('storageGb') storageGb: string,
  ) {
    if (!deviceModelId || !storageGb) return null
    return this.service.getForListing(deviceModelId, Number(storageGb))
  }

  @Get('model')
  @ApiOperation({ summary: 'Precios promedio de todos los storages de un modelo' })
  async getForModel(@Query('deviceModelId') deviceModelId: string) {
    if (!deviceModelId) return []
    return this.service.getForModel(deviceModelId)
  }

  @Get('context')
  @ApiOperation({ summary: 'Contexto de mercado para el wizard de publicación' })
  async getContext(
    @Query('deviceModelId') deviceModelId: string,
    @Query('storageGb') storageGb: string,
  ) {
    if (!deviceModelId || !storageGb) return null
    return this.service.getContext(deviceModelId, Number(storageGb))
  }

  @Post('calculate')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalcular índices de precio (solo admin/owner)' })
  async calculate() {
    return this.service.calculate()
  }
}
