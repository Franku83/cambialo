import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class SafeZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCity(city: string, state?: string) {
    return this.prisma.safeZone.findMany({
      where: {
        isActive: true,
        city: { contains: city, mode: 'insensitive' },
        ...(state && { state: { contains: state, mode: 'insensitive' } }),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, address: true, city: true, state: true, googleMapsUrl: true, openingHours: true, latitude: true, longitude: true },
    })
  }

  async findAll() {
    return this.prisma.safeZone.findMany({
      where: { isActive: true },
      orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
    })
  }
}
