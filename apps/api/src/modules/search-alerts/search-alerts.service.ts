import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'
import { CreateSearchAlertDto } from './dto/create-search-alert.dto'

@Injectable()
export class SearchAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSearchAlertDto) {
    return this.prisma.searchAlert.create({
      data: {
        userId,
        ...(dto.brand && { brand: dto.brand }),
        ...(dto.modelName && { modelName: dto.modelName }),
        ...(dto.maxPriceUsd && { maxPriceUsd: dto.maxPriceUsd }),
        ...(dto.minBattery !== undefined && { minBattery: dto.minBattery }),
        ...(dto.city && { city: dto.city }),
        isActive: true,
      },
    })
  }

  async findForUser(userId: string) {
    return this.prisma.searchAlert.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async delete(id: string, userId: string) {
    const alert = await this.prisma.searchAlert.findUnique({ where: { id } })
    if (!alert) throw new NotFoundException('Alerta no encontrada')
    if (alert.userId !== userId) throw new ForbiddenException()

    return this.prisma.searchAlert.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /** Verifica si un nuevo listing activo hace match con alguna alerta */
  async checkNewListingMatches(listing: {
    id: string
    deviceModelId: string
    priceUsd: number
    batteryHealth: number
    city?: string | null
  }) {
    const deviceModel = await this.prisma.deviceModel.findUnique({
      where: { id: listing.deviceModelId },
      select: { brand: true, modelName: true },
    })
    if (!deviceModel) return []

    const alerts = await this.prisma.searchAlert.findMany({
      where: {
        isActive: true,
        ...(deviceModel.brand && { OR: [{ brand: null }, { brand: deviceModel.brand }] }),
        ...(listing.priceUsd && { OR: [{ maxPriceUsd: null }, { maxPriceUsd: { gte: listing.priceUsd } }] }),
        ...(listing.batteryHealth && { OR: [{ minBattery: null }, { minBattery: { lte: listing.batteryHealth } }] }),
      },
      include: { user: { select: { id: true, email: true } } },
    })

    // Filtrar por modelName si la alerta lo especifica
    return alerts.filter((a) => {
      if (a.modelName && !deviceModel.modelName.toLowerCase().includes(a.modelName.toLowerCase())) return false
      if (a.city && listing.city && !listing.city.toLowerCase().includes(a.city.toLowerCase())) return false
      return true
    })
  }
}
