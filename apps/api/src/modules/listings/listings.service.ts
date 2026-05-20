import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../../common/database/prisma.service'
import { AutoModerationService } from '../admin/auto-moderation.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { ListingFiltersDto } from './dto/listing-filters.dto'

/** Campos públicos del vendedor — nunca exponer datos sensibles */
const PUBLIC_SELLER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  idVerified: true,
  reputationScore: true,
  totalSales: true,
  isVerifiedSeller: true,
  locationCity: true,
  locationState: true,
  whatsappNumber: true,
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoMod: AutoModerationService,
    @InjectQueue('listings') private readonly listingsQueue: Queue,
  ) {}

  async getFeed(filters: ListingFiltersDto) {
    const limit = filters.limit ?? 20
    const where = this.buildWhereClause(filters)

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : undefined),
        take: limit + 1, // +1 para saber si hay siguiente página
        orderBy: [
          { isBumped: 'desc' },
          // verified='desc' → verified aparece primero (z > p > e), resto después
          { verificationStatus: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' }, // tie-breaker único para cursor pagination estable
        ],
        select: {
          id: true,
          priceUsd: true,
          storageGb: true,
          color: true,
          batteryHealth: true,
          condition: true,
          verificationStatus: true,
          status: true,
          isBumped: true,
          bumpExpiresAt: true,
          city: true,
          state: true,
          acceptsOffers: true,
          createdAt: true,
          deviceModel: {
            select: { id: true, brand: true, modelName: true, imageUrl: true },
          },
          seller: { select: PUBLIC_SELLER_SELECT },
          photos: {
            where: { isCover: true },
            take: 1,
            select: { cloudinaryUrl: true, width: true, height: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ])

    // Determinar si hay página siguiente y calcular cursor
    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null

    // Bump expiry se maneja via CRON job en el módulo de listings
    // No actualizar DB en una operación de lectura (anti-pattern)

    return { data, nextCursor, total }
  }

  async getById(id: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id, status: 'active' },
      include: {
        deviceModel: true,
        seller: { select: PUBLIC_SELLER_SELECT },
        photos: {
          where: { isVerificationPhoto: false },
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')

    // Incrementar views de forma async (fire and forget)
    void this.prisma.listing
      .update({ where: { id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => null)

    // Si el usuario está autenticado, revisar si lo tiene guardado
    let isSaved = false
    if (userId) {
      const saved = await this.prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId: id } },
      })
      isSaved = !!saved
    }

    return { ...listing, isSaved }
  }

  async getSimilar(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { deviceModelId: true, priceUsd: true },
    })

    if (!listing) return []

    const price = Number(listing.priceUsd)
    const minPrice = price * 0.8
    const maxPrice = price * 1.2

    return this.prisma.listing.findMany({
      where: {
        deviceModelId: listing.deviceModelId,
        status: 'active',
        id: { not: listingId },
        priceUsd: { gte: minPrice, lte: maxPrice },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        priceUsd: true,
        batteryHealth: true,
        condition: true,
        verificationStatus: true,
        city: true,
        isBumped: true,
        photos: {
          where: { isCover: true },
          take: 1,
          select: { cloudinaryUrl: true, width: true, height: true },
        },
        deviceModel: { select: { brand: true, modelName: true } },
      },
    })
  }

  async createDraft(userId: string, dto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: {
        sellerId: userId,
        deviceModelId: dto.deviceModelId,
        priceUsd: dto.priceUsd,
        storageGb: dto.storageGb,
        color: dto.color,
        batteryHealth: dto.batteryHealth,
        condition: dto.condition,
        imeiLast4: dto.imeiLast4,
        hasIcloudLock: dto.hasIcloudLock ?? false,
        hasGoogleLock: dto.hasGoogleLock ?? false,
        hasRepairs: dto.hasRepairs ?? false,
        ...(dto.repairDetails && { repairDetails: dto.repairDetails }),
        includesBox: dto.includesBox ?? false,
        includesCharger: dto.includesCharger ?? false,
        includesEarphones: dto.includesEarphones ?? false,
        ...(dto.description && { description: dto.description }),
        acceptsOffers: dto.acceptsOffers ?? false,
        ...(dto.minOfferUsd && { minOfferUsd: dto.minOfferUsd }),
        ...(dto.city && { city: dto.city }),
        ...(dto.state && { state: dto.state }),
        meetAtMall: dto.meetAtMall ?? true,
        status: 'draft',
      },
    })

    // Auto-moderación (fire and forget — no bloquea la creación)
    void this.autoMod.applyCheck(listing.id).catch(() => null)

    // Disparar job anti-fraude de IMEI
    await this.listingsQueue.add('check-imei', {
      listingId: listing.id,
      imeiLast4: listing.imeiLast4,
      deviceModelId: listing.deviceModelId,
      userId,
    })

    return listing
  }

  async saveListing(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, status: 'active' },
    })
    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId === userId) {
      throw new ForbiddenException('No puedes guardar tu propio listing')
    }

    await this.prisma.savedListing.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    })

    await this.prisma.listing
      .update({ where: { id: listingId }, data: { savesCount: { increment: 1 } } })
      .catch(() => null)

    return { saved: true }
  }

  async unsaveListing(listingId: string, userId: string) {
    const existing = await this.prisma.savedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    })
    if (!existing) return { saved: false }

    await this.prisma.savedListing.delete({
      where: { userId_listingId: { userId, listingId } },
    })

    await this.prisma.listing
      .update({ where: { id: listingId }, data: { savesCount: { decrement: 1 } } })
      .catch(() => null)

    return { saved: false }
  }

  async getMyStats(userId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        priceUsd: true,
        storageGb: true,
        status: true,
        verificationStatus: true,
        viewsCount: true,
        savesCount: true,
        whatsappClicks: true,
        createdAt: true,
        deviceModel: { select: { brand: true, modelName: true } },
        photos: {
          where: { isCover: true },
          take: 1,
          select: { cloudinaryUrl: true },
        },
      },
    })

    return listings.map((l) => ({
      id: l.id,
      brand: l.deviceModel.brand,
      modelName: l.deviceModel.modelName,
      storageGb: l.storageGb,
      priceUsd: l.priceUsd,
      status: l.status,
      verificationStatus: l.verificationStatus,
      viewsCount: l.viewsCount,
      savesCount: l.savesCount,
      whatsappClicks: l.whatsappClicks,
      coverPhotoUrl: l.photos[0]?.cloudinaryUrl ?? null,
      createdAt: l.createdAt,
    }))
  }

  async updateStatus(listingId: string, userId: string, newStatus: 'active' | 'paused' | 'sold') {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== userId) throw new ForbiddenException('No tienes permiso para modificar este listing')

    const allowed: Record<string, string[]> = {
      active: ['paused', 'draft'],
      paused: ['active', 'paused'],
      sold: ['active', 'paused', 'draft', 'sold'],
    }
    if (!allowed[newStatus]?.includes(listing.status)) {
      throw new BadRequestException(`No se puede pasar de '${listing.status}' a '${newStatus}'`)
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: newStatus },
    })

    return { status: newStatus }
  }

  async deleteListing(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== userId) throw new ForbiddenException('No tienes permiso para eliminar este listing')

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'removed' },
    })

    return { deleted: true }
  }

  async trackWhatsappClick(listingId: string) {
    await this.prisma.listing
      .update({ where: { id: listingId }, data: { whatsappClicks: { increment: 1 } } })
      .catch(() => null)
    return { ok: true }
  }

  async getSafeZonesByCity(city: string) {
    return this.prisma.safeZone.findMany({
      where: {
        isActive: true,
        city: { contains: city, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: 10,
    })
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private buildWhereClause(filters: ListingFiltersDto) {
    const where: Record<string, unknown> = { status: 'active' }

    if (filters.brand || filters.model) {
      where['deviceModel'] = {
        ...(filters.brand && { brand: { contains: filters.brand, mode: 'insensitive' } }),
        ...(filters.model && { modelName: { contains: filters.model, mode: 'insensitive' } }),
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where['priceUsd'] = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      }
    }

    if (filters.minBattery !== undefined) {
      where['batteryHealth'] = { gte: filters.minBattery }
    }

    if (filters.condition?.length) {
      where['condition'] = { in: filters.condition }
    }

    if (filters.city) {
      where['city'] = { contains: filters.city, mode: 'insensitive' }
    }

    if (filters.verifiedOnly) {
      where['verificationStatus'] = 'verified'
    }

    if (filters.acceptsOffers) {
      where['acceptsOffers'] = true
    }

    return where
  }
}
