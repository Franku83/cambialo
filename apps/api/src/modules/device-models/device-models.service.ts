import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class DeviceModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async search({ search, brand, limit = 10 }: { search?: string | undefined; brand?: string | undefined; limit?: number | undefined }) {
    const models = await this.prisma.deviceModel.findMany({
      where: {
        isActive: true,
        ...(brand && { brand: { equals: brand, mode: 'insensitive' } }),
        ...(search && {
          OR: [
            { modelName: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { modelNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        brand: true,
        modelName: true,
        modelNumber: true,
        releaseYear: true,
        originalStorageOptions: true,
        originalColors: true,
        imageUrl: true,
      },
      orderBy: [
        { brand: 'asc' },
        { releaseYear: 'desc' },
        { modelName: 'asc' },
      ],
      take: limit,
    })

    return this.attachModelStats(models)
  }

  /** Agrega precio mínimo, listings activos y rating promedio por modelo (vista estilo Swappa) */
  private async attachModelStats<T extends { id: string }>(models: T[]) {
    if (models.length === 0) return models

    const modelIds = models.map((m) => m.id)

    const [listingStats, ratingStats] = await Promise.all([
      this.prisma.listing.groupBy({
        by: ['deviceModelId'],
        where: { deviceModelId: { in: modelIds }, status: 'active', verificationStatus: 'verified' },
        _min: { priceUsd: true },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<{ deviceModelId: string; avgRating: number }[]>`
        SELECT l.device_model_id AS "deviceModelId", AVG(r.rating)::float AS "avgRating"
        FROM reviews r
        JOIN listings l ON l.id = r.listing_id
        WHERE l.device_model_id = ANY(${modelIds}::uuid[])
        GROUP BY l.device_model_id
      `,
    ])

    const listingMap = new Map(listingStats.map((s) => [s.deviceModelId, s]))
    const ratingMap = new Map(ratingStats.map((r) => [r.deviceModelId, r.avgRating]))

    return models.map((m) => {
      const stats = listingMap.get(m.id)
      const avgRating = ratingMap.get(m.id) ?? null
      return {
        ...m,
        minPrice: stats?._min.priceUsd ? Number(stats._min.priceUsd) : null,
        activeListings: stats?._count._all ?? 0,
        avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      }
    })
  }
}
