import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../../../common/database/prisma.service'
import { NotificationsService } from '../../notifications/notifications.service'

@Processor('verification')
export class VerificationWorker extends WorkerHost {
  private readonly logger = new Logger(VerificationWorker.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    super()
  }

  async process(job: Job) {
    if (job.name === 'verify-listing') {
      return this.autoCheck(job.data as { listingId: string })
    }
  }

  private async autoCheck({ listingId }: { listingId: string }) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        photos: { select: { isVerificationPhoto: true } },
      },
    })

    if (!listing) {
      this.logger.warn(`Auto-check: listing ${listingId} no encontrado`)
      return
    }

    const issues: string[] = []

    if (listing.photos.length < 4) {
      issues.push(`Solo tiene ${listing.photos.length} fotos (mínimo 4)`)
    }

    if (!listing.photos.some((p) => p.isVerificationPhoto)) {
      issues.push('Falta la foto de verificación con el código en papel')
    }

    if (listing.verificationExpiresAt && listing.verificationExpiresAt < new Date()) {
      issues.push('El código de verificación expiró')
    }

    if (issues.length > 0) {
      // Auto-rechazar si no pasa el check básico
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { verificationStatus: 'rejected' },
      })

      await this.notifications.createNotification({
        userId: listing.sellerId,
        type: 'verification_rejected',
        title: 'Verificación rechazada automáticamente',
        body: `Problemas encontrados: ${issues.join(', ')}. Puedes intentarlo de nuevo.`,
        payload: { listing_id: listingId },
      })

      this.logger.warn(`Listing ${listingId} auto-rechazado: ${issues.join(', ')}`)
    } else {
      // Pasa el check automático → queda en 'pending' para revisión manual
      this.logger.log(`Listing ${listingId} pasó auto-check. Esperando revisión manual.`)
    }
  }
}
