import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class PriceIndexService {
  private readonly logger = new Logger(PriceIndexService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledCalculate() {
    this.logger.log('Recalculando índice de precios...')
    const result = await this.calculate()
    this.logger.log(`Price index: ${result.updated} combinaciones actualizadas`)
  }

  async calculate() {
    // Obtener todos los listings activos verificados de los últimos 90 días
    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'active',
        verificationStatus: 'verified',
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: { deviceModelId: true, storageGb: true, priceUsd: true },
    })

    // Agrupar por deviceModelId + storageGb
    const groups = new Map<string, number[]>()
    for (const l of listings) {
      const key = `${l.deviceModelId}::${l.storageGb}`
      const arr = groups.get(key) ?? []
      arr.push(Number(l.priceUsd))
      groups.set(key, arr)
    }

    let updated = 0
    for (const [key, prices] of groups) {
      if (prices.length < 3) continue // mínimo 3 muestras
      const [deviceModelId, storageStr] = key.split('::')
      if (!deviceModelId || !storageStr) continue
      const storageGb = Number(storageStr)

      const sorted = [...prices].sort((a, b) => a - b)
      const sum = sorted.reduce((a, b) => a + b, 0)
      const avg = sum / sorted.length
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
        : sorted[Math.floor(sorted.length / 2)]!

      await this.prisma.priceIndex.upsert({
        where: { deviceModelId_storageGb: { deviceModelId, storageGb } },
        create: {
          deviceModelId,
          storageGb,
          avgPrice: avg,
          medianPrice: median,
          minPrice: sorted[0]!,
          maxPrice: sorted[sorted.length - 1]!,
          sampleSize: sorted.length,
        },
        update: {
          avgPrice: avg,
          medianPrice: median,
          minPrice: sorted[0]!,
          maxPrice: sorted[sorted.length - 1]!,
          sampleSize: sorted.length,
          calculatedAt: new Date(),
        },
      })
      updated++
    }

    return { updated, groups: groups.size }
  }

  async getForListing(deviceModelId: string, storageGb: number) {
    return this.prisma.priceIndex.findUnique({
      where: { deviceModelId_storageGb: { deviceModelId, storageGb } },
    })
  }

  async getForModel(deviceModelId: string) {
    return this.prisma.priceIndex.findMany({
      where: { deviceModelId },
      orderBy: { storageGb: 'asc' },
    })
  }

  async getContext(deviceModelId: string, storageGb: number) {
    const [index, comparables] = await Promise.all([
      this.prisma.priceIndex.findUnique({
        where: { deviceModelId_storageGb: { deviceModelId, storageGb } },
      }),
      this.prisma.listing.findMany({
        where: {
          deviceModelId,
          storageGb,
          status: 'active',
          verificationStatus: 'verified',
        },
        orderBy: { batteryHealth: 'desc' },
        take: 5,
        select: {
          batteryHealth: true,
          condition: true,
          priceUsd: true,
        },
      }),
    ])

    if (!index || index.sampleSize < 3) {
      return { sampleSize: index?.sampleSize ?? 0, avgPrice: null, comparables: [] }
    }

    return {
      avgPrice: Number(index.avgPrice),
      medianPrice: Number(index.medianPrice),
      sampleSize: index.sampleSize,
      comparables: comparables.map((c) => ({
        batteryHealth: c.batteryHealth,
        condition: c.condition,
        priceUsd: Number(c.priceUsd),
      })),
    }
  }
}
