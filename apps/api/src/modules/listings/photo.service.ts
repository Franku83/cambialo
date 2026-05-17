import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { PrismaService } from '../../common/database/prisma.service'

@Injectable()
export class PhotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME') ?? '',
      api_key: this.config.get<string>('CLOUDINARY_API_KEY') ?? '',
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET') ?? '',
    })
  }

  async uploadPhoto(
    listingId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string },
    isVerificationPhoto = false,
  ) {
    const listingData = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        sellerId: true,
        _count: { select: { photos: true } },
      },
    })

    if (!listingData) throw new NotFoundException('Listing no encontrado')
    if (listingData.sellerId !== userId) throw new ForbiddenException()

    const maxPhotos = 10
    if (listingData._count.photos >= maxPhotos) {
      throw new BadRequestException(`Máximo ${maxPhotos} fotos por listing`)
    }

    // Upload a Cloudinary
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `techmarket/listings/${listingId}`,
          transformation: isVerificationPhoto
            ? [{ quality: 'auto', fetch_format: 'auto' }]
            : [
                { quality: 'auto', fetch_format: 'auto' },
                {
                  overlay: {
                    font_family: 'Arial',
                    font_size: 18,
                    font_weight: 'bold',
                    text: 'Cambialo',
                  },
                  gravity: 'south_east',
                  x: 10,
                  y: 10,
                  opacity: 60,
                  color: '#ffffff',
                },
              ],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload failed'))
          else resolve(result)
        },
      )
      uploadStream.end(file.buffer)
    })

    // Determinar sortOrder
    const existingCount = await this.prisma.listingPhoto.count({ where: { listingId } })
    const isFirstPhoto = existingCount === 0

    const photo = await this.prisma.listingPhoto.create({
      data: {
        listingId,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        isVerificationPhoto,
        isCover: isFirstPhoto && !isVerificationPhoto,
        sortOrder: existingCount,
      },
    })

    return photo
  }

  async deletePhoto(photoId: string, userId: string) {
    const photo = await this.prisma.listingPhoto.findUnique({
      where: { id: photoId },
      include: { listing: { select: { sellerId: true } } },
    })

    if (!photo) throw new NotFoundException('Foto no encontrada')
    if (photo.listing.sellerId !== userId) throw new ForbiddenException()

    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(photo.cloudinaryId).catch(() => null)

    await this.prisma.listingPhoto.delete({ where: { id: photoId } })

    // Si era la cover, asignar la siguiente como cover
    if (photo.isCover) {
      const next = await this.prisma.listingPhoto.findFirst({
        where: { listingId: photo.listingId, isVerificationPhoto: false },
        orderBy: { sortOrder: 'asc' },
      })
      if (next) {
        await this.prisma.listingPhoto.update({
          where: { id: next.id },
          data: { isCover: true },
        })
      }
    }

    return { deleted: true }
  }

  async reorderPhotos(listingId: string, userId: string, order: string[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== userId) throw new ForbiddenException()

    await Promise.all(
      order.map((photoId, index) =>
        this.prisma.listingPhoto.update({
          where: { id: photoId, listingId },
          data: { sortOrder: index },
        }),
      ),
    )

    return { reordered: true }
  }

  async setCover(photoId: string, listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    })

    if (!listing) throw new NotFoundException('Listing no encontrado')
    if (listing.sellerId !== userId) throw new ForbiddenException()

    // Quitar cover de todas las fotos del listing
    await this.prisma.listingPhoto.updateMany({
      where: { listingId },
      data: { isCover: false },
    })

    // Marcar la nueva cover
    await this.prisma.listingPhoto.update({
      where: { id: photoId, listingId },
      data: { isCover: true },
    })

    return { covered: true }
  }
}
