import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ListingsService } from './listings.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { ListingFiltersDto } from './dto/listing-filters.dto'
import { UpdateListingStatusDto } from './dto/update-listing-status.dto'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Feed principal con cursor-based pagination y filtros' })
  async getFeed(@Query() filters: ListingFiltersDto) {
    return this.listingsService.getFeed(filters)
  }

  @Get('mine/stats')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listings del usuario con stats' })
  async myStats(@CurrentUser() user: { id: string }) {
    return this.listingsService.getMyStats(user.id)
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Listings similares (mismo modelo ±20% precio)' })
  async getSimilar(@Param('id') id: string) {
    return this.listingsService.getSimilar(id)
  }

  @Get(':id/safe-zones')
  @ApiOperation({ summary: 'Zonas seguras cerca de la ciudad del listing' })
  async getSafeZones(@Param('id') id: string) {
    const listing = await this.listingsService.getById(id)
    if (!listing.city) return []
    return this.listingsService.getSafeZonesByCity(listing.city)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un listing' })
  async getById(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    return this.listingsService.getById(id, userId)
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear draft de listing' })
  async createDraft(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.createDraft(user.id, dto)
  }

  @Post(':id/save')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guardar listing en watchlist' })
  async save(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.listingsService.saveListing(id, user.id)
  }

  @Delete(':id/save')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar listing de watchlist' })
  async unsave(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.listingsService.unsaveListing(id, user.id)
  }

  @Post(':id/mark-sold')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar listing como vendido + crear pending reviews' })
  async markAsSold(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { buyerUsername?: string },
  ) {
    return this.listingsService.markAsSold(id, user.id, body.buyerUsername)
  }

  @Patch(':id/status')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar estado de un listing (pausar, reactivar, marcar vendido, remover)' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: UpdateListingStatusDto,
  ) {
    return this.listingsService.updateStatus(id, user.id, body.status)
  }

  @Post(':id/whatsapp-click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar click en botón WhatsApp (fire-and-forget)' })
  async trackWhatsappClick(@Param('id') id: string) {
    return this.listingsService.trackWhatsappClick(id)
  }
}
