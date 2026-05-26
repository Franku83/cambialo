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
import { getListingLimit } from '../../common/constants/user-levels'
import { Prisma } from '@prisma/client'

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
  paymentMethods: true,
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
    const { lat, lng, rangeKm = 40 } = filters

    // Si hay coords, usar raw SQL con earthdistance — listings sin coords aparecen al final
    if (lat !== undefined && lng !== undefined) {
      return this.getFeedByDistance({ ...filters, lat, lng, rangeKm })
    }

    const where = this.buildWhereClause(filters)

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : undefined),
        take: limit + 1,
        orderBy: [
          { isBumped: 'desc' },
          { verificationStatus: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' },
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

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null

    const enriched = await this.attachMarketPrice(data)
    return { data: enriched, nextCursor, total }
  }

  private async attachMarketPrice<T extends { deviceModel: { id: string }; storageGb: number }>(
    items: T[],
  ): Promise<(T & { avgMarketPrice: number | null })[]> {
    if (items.length === 0) return items.map(i => ({ ...i, avgMarketPrice: null }))

    const pairs = [...new Map(
      items.map(l => [`${l.deviceModel.id}-${l.storageGb}`, { deviceModelId: l.deviceModel.id, storageGb: l.storageGb }])
    ).values()]

    const priceIndexes = await this.prisma.priceIndex.findMany({
      where: { OR: pairs },
      select: { deviceModelId: true, storageGb: true, avgPrice: true, sampleSize: true },
    })

    const piMap = new Map(priceIndexes
      .filter(pi => pi.sampleSize >= 3)
      .map(pi => [`${pi.deviceModelId}-${pi.storageGb}`, Number(pi.avgPrice)])
    )

    return items.map(l => ({
      ...l,
      avgMarketPrice: piMap.get(`${l.deviceModel.id}-${l.storageGb}`) ?? null,
    }))
  }

  async getById(id: string, userId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
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

    // Si es draft o pending_review, solo el propio vendedor o moderadores/admins/owner pueden verlo
    if (['draft', 'pending_review'].includes(listing.status)) {
      if (!userId) {
        throw new ForbiddenException('No tienes permiso para ver este listing')
      }
      const isSeller = listing.sellerId === userId
      const userRoles = await this.prisma.userRole_Assignment.findMany({
        where: { userId },
        select: { role: true }
      })
      const isModerator = userRoles.some(r => ['moderator', 'admin', 'owner'].includes(r.role))
      if (!isSeller && !isModerator) {
        throw new ForbiddenException('No tienes permiso para ver este listing')
      }
    }

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
    const seller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { idVerified: true, isVerifiedSeller: true },
    })
    if (!seller) throw new NotFoundException('Usuario no encontrado')

    const activeCount = await this.prisma.listing.count({
      where: { sellerId: userId, status: { in: ['active', 'paused', 'draft'] } },
    })

    const limit = getListingLimit(seller)
    if (activeCount >= limit) {
      throw new ForbiddenException({
        message: 'Límite de listings alcanzado',
        currentCount: activeCount,
        limit,
        isVerified: seller.idVerified,
        upgradeUrl: '/kyc',
      })
    }

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
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
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

  async markAsSold(listingId: string, sellerId: string, buyerUsername?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, sellerId },
      include: { deviceModel: { select: { modelName: true } } },
    })
    if (!listing) throw new NotFoundException('Listing no encontrado')

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'sold', soldAt: new Date() },
    })

    if (buyerUsername) {
      const buyer = await this.prisma.user.findUnique({
        where: { username: buyerUsername },
        select: { id: true },
      })
      if (buyer) {
        await this.prisma.pendingReview.createMany({
          data: [
            { listingId, reviewerId: sellerId, reviewedId: buyer.id, type: 'seller_to_buyer' },
            { listingId, reviewerId: buyer.id, reviewedId: sellerId, type: 'buyer_to_seller' },
          ],
          skipDuplicates: true,
        })
      }
    }

    return { sold: true }
  }

  async updateStatus(
    listingId: string,
    userId: string,
    newStatus: 'active' | 'paused' | 'sold' | 'removed'
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId }
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')

    // Consultar rol en la DB
    const roleRecord = await this.prisma.userRole_Assignment.findFirst({
      where: { userId },
    })
    const requesterRole = roleRecord?.role ?? 'user'

    const isModerator = ['moderator', 'admin', 'owner'].includes(requesterRole)
    const isSeller = listing.sellerId === userId

    if (!isModerator && !isSeller) {
      throw new ForbiddenException('No tienes permiso para modificar este listing')
    }

    const SELLER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
      draft:          ['removed'],
      active:         ['paused', 'sold'],
      paused:         ['active', 'sold'],
      pending_review: ['paused'],
    }

    const MODERATOR_ALLOWED_TRANSITIONS: Record<string, string[]> = {
      draft:          ['removed'],
      pending_review: ['active', 'removed'],
      active:         ['removed'],
      paused:         ['removed'],
      sold:           ['removed'],
    }

    // Combinar transiciones: si es seller Y moderador, tiene ambos sets
    const sellerTransitions = isSeller ? (SELLER_ALLOWED_TRANSITIONS[listing.status] ?? []) : []
    const modTransitions = isModerator ? (MODERATOR_ALLOWED_TRANSITIONS[listing.status] ?? []) : []
    const allowedTransitions = [...new Set([...sellerTransitions, ...modTransitions])]

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `No puedes cambiar de "${listing.status}" a "${newStatus}"`
      )
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: newStatus,
        soldAt: newStatus === 'sold' ? new Date() : null,
      },
    })

    return { status: newStatus }
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

  // ─── Geo feed ─────────────────────────────────────────────────────────────

  private async getFeedByDistance(filters: ListingFiltersDto & { lat: number; lng: number; rangeKm: number }) {
    const { lat, lng, rangeKm, limit: rawLimit = 20 } = filters
    const rangeMeters = rangeKm * 1000

    // Condiciones adicionales como SQL
    const verifiedClause = filters.verifiedOnly
      ? Prisma.sql`AND l.verification_status = 'verified'`
      : Prisma.empty
    const minPriceClause = filters.minPrice !== undefined
      ? Prisma.sql`AND l.price_usd >= ${filters.minPrice}`
      : Prisma.empty
    const maxPriceClause = filters.maxPrice !== undefined
      ? Prisma.sql`AND l.price_usd <= ${filters.maxPrice}`
      : Prisma.empty
    const minBatteryClause = filters.minBattery !== undefined
      ? Prisma.sql`AND l.battery_health >= ${filters.minBattery}`
      : Prisma.empty
    const brandClause = filters.brand
      ? Prisma.sql`AND dm.brand ILIKE ${'%' + filters.brand + '%'}`
      : Prisma.empty
    const modelClause = filters.model
      ? Prisma.sql`AND dm.model_name ILIKE ${'%' + filters.model + '%'}`
      : Prisma.empty
    const stateClause = filters.state
      ? Prisma.sql`AND l.state = ${filters.state}`
      : Prisma.empty
    const tradeInClause = filters.acceptsTradeIn
      ? Prisma.sql`AND l.accepts_trade_in = true`
      : Prisma.empty
    const paymentMethodClause = filters.paymentMethod
      ? Prisma.sql`AND (u.payment_methods->>${filters.paymentMethod}->>'enabled')::boolean = true`
      : Prisma.empty

    type RawListing = {
      id: string
      price_usd: string
      storage_gb: number
      color: string
      battery_health: number
      condition: string
      verification_status: string
      status: string
      is_bumped: boolean
      city: string | null
      state: string | null
      accepts_offers: boolean
      created_at: Date
      distance_km: number | null
      device_model_id: string
      brand: string
      model_name: string
      image_url: string | null
      cover_photo_url: string | null
      seller_id: string
      seller_username: string
      seller_full_name: string
      seller_avatar_url: string | null
      seller_reputation_score: number
      seller_total_sales: number
      seller_is_verified_seller: boolean
      seller_id_verified: boolean
      seller_location_city: string | null
    }

    const rows = await this.prisma.$queryRaw<RawListing[]>`
      SELECT
        l.id,
        l.price_usd,
        l.storage_gb,
        l.color,
        l.battery_health,
        l.condition,
        l.verification_status,
        l.status,
        l.is_bumped,
        l.city,
        l.state,
        l.accepts_offers,
        l.created_at,
        CASE
          WHEN l.latitude IS NOT NULL AND l.longitude IS NOT NULL THEN
            ROUND(
              earth_distance(
                ll_to_earth(${lat}::float8, ${lng}::float8),
                ll_to_earth(l.latitude, l.longitude)
              ) / 1000
            )
          ELSE NULL
        END AS distance_km,
        dm.id AS device_model_id,
        dm.brand,
        dm.model_name,
        dm.image_url,
        u.id AS seller_id,
        u.username AS seller_username,
        u.full_name AS seller_full_name,
        u.avatar_url AS seller_avatar_url,
        u.reputation_score AS seller_reputation_score,
        u.total_sales AS seller_total_sales,
        u.is_verified_seller AS seller_is_verified_seller,
        u.id_verified AS seller_id_verified,
        u.location_city AS seller_location_city,
        (
          SELECT lp.cloudinary_url FROM listing_photos lp
          WHERE lp.listing_id = l.id AND lp.is_cover = true
          LIMIT 1
        ) AS cover_photo_url
      FROM listings l
      JOIN device_models dm ON dm.id = l.device_model_id
      JOIN users u ON u.id = l.seller_id
      WHERE
        l.status = 'active'
        AND (
          l.latitude IS NULL
          OR earth_box(ll_to_earth(${lat}::float8, ${lng}::float8), ${rangeMeters}::float8)
             @> ll_to_earth(l.latitude, l.longitude)
        )
        ${verifiedClause}
        ${minPriceClause}
        ${maxPriceClause}
        ${minBatteryClause}
        ${brandClause}
        ${modelClause}
      ORDER BY
        l.is_bumped DESC,
        l.verification_status DESC,
        CASE WHEN l.latitude IS NOT NULL THEN 0 ELSE 1 END ASC,
        distance_km ASC NULLS LAST,
        l.created_at DESC
      LIMIT ${rawLimit + 1}
    `

    const hasMore = rows.length > rawLimit
    const data = (hasMore ? rows.slice(0, rawLimit) : rows).map((r) => ({
      id: r.id,
      priceUsd: r.price_usd,
      storageGb: r.storage_gb,
      color: r.color,
      batteryHealth: r.battery_health,
      condition: r.condition,
      verificationStatus: r.verification_status,
      status: r.status,
      isBumped: r.is_bumped,
      city: r.city,
      state: r.state,
      acceptsOffers: r.accepts_offers,
      createdAt: r.created_at,
      distanceKm: r.distance_km !== null ? Number(r.distance_km) : undefined,
      deviceModel: { id: r.device_model_id as string, brand: r.brand, modelName: r.model_name, imageUrl: r.image_url },
      seller: {
        id: r.seller_id,
        username: r.seller_username,
        fullName: r.seller_full_name,
        avatarUrl: r.seller_avatar_url,
        reputationScore: r.seller_reputation_score,
        totalSales: r.seller_total_sales,
        isVerifiedSeller: r.seller_is_verified_seller,
        idVerified: r.seller_id_verified,
        locationCity: r.seller_location_city,
      },
      photos: r.cover_photo_url ? [{ cloudinaryUrl: r.cover_photo_url }] : [],
    }))

    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null
    const enriched = await this.attachMarketPrice(data)
    return { data: enriched, nextCursor, total: null }
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

    if (filters.acceptsTradeIn) {
      where['acceptsTradeIn'] = true
    }

    if (filters.state) {
      where['state'] = filters.state
    }

    if (filters.paymentMethod) {
      // Filtra vendedores que tengan el método habilitado en su JSON
      // path: paymentMethods -> method -> enabled = true
      where['seller'] = {
        paymentMethods: {
          path: [filters.paymentMethod, 'enabled'],
          equals: true,
        },
      }
    }

    return where
  }

  async setCoverPhoto(listingId: string, photoId: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })
    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== sellerId) throw new ForbiddenException()

    await this.prisma.listingPhoto.updateMany({
      where: { listingId },
      data: { isCover: false },
    })

    await this.prisma.listingPhoto.update({
      where: { id: photoId },
      data: { isCover: true },
    })

    return { ok: true }
  }
}
