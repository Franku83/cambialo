import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class DeviceModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async search({ search, brand, limit = 10 }: { search?: string | undefined; brand?: string | undefined; limit?: number | undefined }) {
    return this.prisma.deviceModel.findMany({
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
      },
      orderBy: [
        { brand: 'asc' },
        { releaseYear: 'desc' },
        { modelName: 'asc' },
      ],
      take: limit,
    })
  }
}
