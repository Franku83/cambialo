import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getPendingVerifications(moderatorId: string) {
    await this.assertModerator(moderatorId)

    return this.prisma.listing.findMany({
      where: { status: 'pending_review', verificationStatus: 'pending' },
      orderBy: { updatedAt: 'asc' }, // los más antiguos primero
      include: {
        deviceModel: { select: { brand: true, modelName: true, modelNumber: true } },
        seller: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            reputationScore: true,
            totalSales: true,
          },
        },
        photos: {
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
          select: {
            id: true,
            cloudinaryUrl: true,
            isVerificationPhoto: true,
            isCover: true,
            width: true,
            height: true,
          },
        },
      },
    })
  }

  async approveListing(listingId: string, moderatorId: string) {
    await this.assertModerator(moderatorId)

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new NotFoundException('Listing no encontrado')

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        status: 'active',
      },
    })

    await this.notifications.createNotification({
      userId: listing.sellerId,
      type: 'verification_approved',
      title: '¡Listing verificado! ✅',
      body: 'Tu equipo fue verificado y ya está publicado en Cambialo.',
      payload: { listing_id: listingId },
    })

    return { approved: true }
  }

  async rejectListing(listingId: string, moderatorId: string, reason?: string) {
    await this.assertModerator(moderatorId)

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new NotFoundException('Listing no encontrado')

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { verificationStatus: 'rejected', status: 'draft' },
    })

    await this.notifications.createNotification({
      userId: listing.sellerId,
      type: 'verification_rejected',
      title: 'Verificación rechazada',
      body: `Tu foto de verificación fue rechazada. Motivo: ${reason ?? 'No especificado'}`,
      payload: { listing_id: listingId, reason: reason ?? 'No especificado' },
    })

    return { rejected: true, reason }
  }

  async banUser(userId: string, reason: string, moderatorId: string) {
    await this.assertAdmin(moderatorId) // solo admins pueden banear

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuario no encontrado')

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, banReason: reason },
    })

    // Desactivar todos sus listings activos
    await this.prisma.listing.updateMany({
      where: { sellerId: userId, status: { in: ['active', 'paused'] } },
      data: { status: 'removed' },
    })

    await this.notifications.createNotification({
      userId,
      type: 'listing_expired',
      title: 'Cuenta suspendida',
      body: `Tu cuenta ha sido suspendida. Motivo: ${reason}`,
      payload: { reason },
    })

    return { banned: true }
  }

  private async assertModerator(userId: string) {
    const role = await this.prisma.userRole_Assignment.findFirst({
      where: { userId, role: { in: ['moderator', 'admin', 'owner'] } },
    })
    if (!role) throw new UnauthorizedException('Se requiere rol de moderador, admin u owner')
  }

  private async assertAdmin(userId: string) {
    const role = await this.prisma.userRole_Assignment.findFirst({
      where: { userId, role: { in: ['admin', 'owner'] } },
    })
    if (!role) throw new UnauthorizedException('Se requiere rol de admin u owner')
  }
}
