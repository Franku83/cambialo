import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../../common/database/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

// Cambiar a true cuando haya suficientes moderadores activos
const VERIFICATION_CODE_REQUIRED = false

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CAM-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  const now = new Date()
  const dateStr = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `${code}-${dateStr}`
}

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('listings') private readonly listingsQueue: Queue,
    @InjectQueue('verification') private readonly verificationQueue: Queue,
    private readonly notifications: NotificationsService,
  ) {}

  async generateCode(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, verificationStatus: true },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== userId) throw new ForbiddenException()
    if (listing.verificationStatus === 'verified') {
      throw new BadRequestException('Este listing ya está verificado')
    }

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { verificationCode: code, verificationExpiresAt: expiresAt },
    })

    return { code, expiresAt }
  }

  async submitForReview(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        photos: { select: { isVerificationPhoto: true } },
      },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== userId) throw new ForbiddenException()

    if (listing.photos.length < 1) {
      throw new BadRequestException('Se requiere al menos 1 foto para publicar')
    }

    if (VERIFICATION_CODE_REQUIRED) {
      const hasVerificationPhoto = listing.photos.some((p) => p.isVerificationPhoto)
      if (!hasVerificationPhoto) {
        throw new BadRequestException('Falta la foto de verificación con el código en papel')
      }

      if (!listing.verificationCode || !listing.verificationExpiresAt) {
        throw new BadRequestException('Genera el código de verificación primero')
      }

      if (listing.verificationExpiresAt < new Date()) {
        throw new BadRequestException('El código de verificación expiró. Genera uno nuevo.')
      }
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { verificationStatus: 'pending', status: 'pending_review' },
    })

    await this.verificationQueue.add('verify-listing', { listingId })

    return { message: 'Enviado para revisión. Te notificaremos en máx. 2 horas.' }
  }

  async approveVerification(listingId: string, moderatorId: string) {
    await this.assertModerator(moderatorId)

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, verificationStatus: true },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.verificationStatus !== 'pending') {
      throw new BadRequestException('El listing no está pendiente de verificación')
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        status: 'active',
      },
    })

    // Sincronizar en Typesense
    await this.listingsQueue.add('sync-listing', { listingId })

    // Notificar al vendedor
    await this.notifications.createNotification({
      userId: listing.sellerId,
      type: 'verification_approved',
      title: '¡Listing verificado! ✅',
      body: 'Tu equipo fue verificado y ya está publicado en Cambialo.',
      payload: { listing_id: listingId },
    })

    return { message: 'Verificación aprobada' }
  }

  async rejectVerification(listingId: string, moderatorId: string, reason: string) {
    await this.assertModerator(moderatorId)

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, verificationStatus: true },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { verificationStatus: 'rejected' },
    })

    await this.notifications.createNotification({
      userId: listing.sellerId,
      type: 'verification_rejected',
      title: 'Verificación rechazada',
      body: `Tu foto de verificación fue rechazada. Motivo: ${reason}`,
      payload: { listing_id: listingId, reason },
    })

    return { message: 'Verificación rechazada' }
  }

  private async assertModerator(userId: string) {
    const role = await this.prisma.userRole_Assignment.findFirst({
      where: { userId, role: { in: ['moderator', 'admin'] } },
    })
    if (!role) throw new UnauthorizedException('Se requiere rol de moderador o admin')
  }
}
