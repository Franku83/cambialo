import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class FraudReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: {
    reportedUserId: string
    listingId?: string
    reason: string
    evidenceUrls?: string[]
  }) {
    return this.prisma.fraudReport.create({
      data: {
        reporterId,
        reportedUserId: dto.reportedUserId,
        ...(dto.listingId && { listingId: dto.listingId }),
        reason: dto.reason,
        evidenceUrls: dto.evidenceUrls ?? [],
        status: 'open',
      },
    })
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.prisma.fraudReport.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { username: true, avatarUrl: true } },
          reportedUser: { select: { username: true, avatarUrl: true } },
          listing: { select: { id: true } },
        },
      }),
      this.prisma.fraudReport.count(),
    ])
    return { data, total, page, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, moderatorId: string, status: string, adminNotes?: string) {
    const report = await this.prisma.fraudReport.findUnique({ where: { id } })
    if (!report) throw new NotFoundException('Reporte no encontrado')

    const mod = await this.prisma.userRole_Assignment.findFirst({
      where: { userId: moderatorId, role: { in: ['moderator', 'admin'] } },
    })
    if (!mod) throw new ForbiddenException('Se requiere rol de moderador')

    return this.prisma.fraudReport.update({
      where: { id },
      data: {
        status: status as never,
        ...(adminNotes && { adminNotes }),
      },
    })
  }
}
