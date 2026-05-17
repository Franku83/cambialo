import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../../../common/database/prisma.service'
import { TypesenseService } from '../typesense.service'

@Processor('listings')
export class TypesenseSyncWorker extends WorkerHost {
  private readonly logger = new Logger(TypesenseSyncWorker.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly typesense: TypesenseService,
  ) {
    super()
  }

  async process(job: Job) {
    switch (job.name) {
      case 'sync-listing':
        return this.syncListing(job.data as { listingId: string })
      case 'delete-listing':
        return this.deleteListing(job.data as { listingId: string })
      case 'check-imei':
        return this.checkImei(
          job.data as { listingId: string; imeiLast4: string; deviceModelId: string; userId: string },
        )
      default:
        this.logger.warn(`Job desconocido: ${job.name}`)
    }
  }

  private async syncListing({ listingId }: { listingId: string }) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        deviceModel: true,
        seller: { select: { username: true } },
        photos: { where: { isCover: true }, take: 1 },
      },
    })

    if (!listing || listing.status !== 'active') {
      this.logger.debug(`Listing ${listingId} no está activo — skip sync`)
      return
    }

    await this.typesense.indexListing({
      id: listing.id,
      brand: listing.deviceModel.brand,
      modelName: listing.deviceModel.modelName,
      modelNumber: listing.deviceModel.modelNumber,
      priceUsd: Number(listing.priceUsd),
      storageGb: listing.storageGb,
      batteryHealth: listing.batteryHealth,
      condition: listing.condition,
      verificationStatus: listing.verificationStatus,
      status: listing.status,
      city: listing.city,
      state: listing.state,
      isBumped: listing.isBumped,
      acceptsOffers: listing.acceptsOffers,
      coverPhotoUrl: listing.photos[0]?.cloudinaryUrl ?? null,
      sellerUsername: listing.seller.username,
      createdAt: listing.createdAt,
    })

    this.logger.debug(`Listing ${listingId} sincronizado en Typesense`)
  }

  private async deleteListing({ listingId }: { listingId: string }) {
    await this.typesense.deleteListing(listingId)
    this.logger.debug(`Listing ${listingId} eliminado de Typesense`)
  }

  private async checkImei({
    listingId,
    imeiLast4,
    deviceModelId,
    userId,
  }: {
    listingId: string
    imeiLast4: string
    deviceModelId: string
    userId: string
  }) {
    // Contar cuántos listings activos tienen el mismo IMEI+modelo (excluyendo el actual)
    const count = await this.prisma.listing.count({
      where: {
        imeiLast4,
        deviceModelId,
        status: 'active',
        id: { not: listingId },
      },
    })

    if (count > 0) {
      this.logger.warn(`IMEI duplicado detectado: ${imeiLast4} (listing ${listingId})`)

      // Registrar en imei_reports
      await this.prisma.imeiReport.upsert({
        where: { imeiLast4_listingId: { imeiLast4, listingId } },
        create: {
          imeiLast4,
          deviceModelId,
          listingId,
          userId,
          occurrenceCount: count + 1,
          flagged: count >= 2,
          ...(count >= 2 && { flaggedAt: new Date() }),
        },
        update: {
          occurrenceCount: { increment: 1 },
          ...(count >= 2 && { flagged: true, flaggedAt: new Date() }),
        },
      })
    }
  }
}
