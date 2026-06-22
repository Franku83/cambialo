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
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard'
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

  @Get('mine/archived')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listings archivados del vendedor (sold/removed/expired) con paginación' })
  async myArchived(
    @CurrentUser() user: { id: string },
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.getArchivedListings(user.id, cursor, limit ? Number(limit) : undefined)
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
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Detalle de un listing' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.listingsService.getById(id, user?.id)
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

  @Delete(':id/draft')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar borrador (hard delete — solo drafts)' })
  async deleteDraft(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.listingsService.deleteDraft(id, user.id)
  }

  @Patch(':id/details')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar detalles de un draft (precio, ciudad, ofertas, etc.)' })
  async updateDraftDetails(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: {
      priceUsd?: number
      city?: string
      state?: string
      acceptsOffers?: boolean
      minOfferUsd?: number | null
      meetAtMall?: boolean
      acceptsTradeIn?: boolean
      description?: string
      latitude?: number
      longitude?: number
      condition?: 'mint' | 'good' | 'fair' | 'poor'
      batteryHealth?: number
      hasRepairs?: boolean
      repairDetails?: string | null
      includesBox?: boolean
      includesCharger?: boolean
      includesEarphones?: boolean
      imei?: string | null
      imeiVisibility?: 'last4' | 'full' | 'hidden' | null
    },
  ) {
    return this.listingsService.updateDraftDetails(id, user.id, body)
  }

  @Post(':id/whatsapp-click')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar click en botón WhatsApp (fire-and-forget) — guarda userId si hay sesión' })
  async trackWhatsappClick(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string },
  ) {
    return this.listingsService.trackWhatsappClick(id, user?.id)
  }

  @Get(':id/potential-buyers')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuarios registrados que contactaron por WhatsApp (para sugerir al marcar vendido)' })
  async getPotentialBuyers(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.listingsService.getPotentialBuyers(id, user.id)
  }

  @Patch(':id/cover-photo')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar foto de portada del listing' })
  async setCoverPhoto(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { photoId: string },
  ) {
    return this.listingsService.setCoverPhoto(id, body.photoId, user.id)
  }
}
