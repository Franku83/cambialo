import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import { PrismaService } from '../../common/database/prisma.service'
import { Prisma } from '@prisma/client'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  private readonly supabase: SupabaseClient

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    )
  }

  /** Perfil público — solo campos no sensibles (equivalente a public_profiles view) */
  async findPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        idVerified: true,
        reputationScore: true,
        totalSales: true,
        totalPurchases: true,
        isVerifiedSeller: true,
        locationCity: true,
        locationState: true,
        createdAt: true,
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            transactionType: true,
            createdAt: true,
            reviewer: {
              select: { username: true, avatarUrl: true },
            },
          },
        },
        listings: {
          where: { status: 'active' },
          take: 10,
          orderBy: [{ isBumped: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            priceUsd: true,
            batteryHealth: true,
            condition: true,
            verificationStatus: true,
            city: true,
            isBumped: true,
            photos: {
              where: { isCover: true },
              take: 1,
              select: { cloudinaryUrl: true, width: true, height: true },
            },
            deviceModel: {
              select: { brand: true, modelName: true },
            },
          },
        },
        _count: {
          select: { listings: { where: { status: 'active' } } },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`Usuario @${username} no encontrado`)
    }

    const avgRating =
      user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
        : null

    return {
      ...user,
      activeListingsCount: user._count.listings,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    }
  }

  async searchByUsername(q: string) {
    if (!q || q.length < 2) return []
    return this.prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        isBanned: false,
      },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
      take: 5,
      orderBy: { username: 'asc' },
    })
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.locationCity !== undefined && { locationCity: dto.locationCity }),
        ...(dto.locationState !== undefined && { locationState: dto.locationState }),
        ...(dto.whatsappNumber !== undefined && { whatsappNumber: dto.whatsappNumber }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        locationCity: true,
        locationState: true,
        whatsappNumber: true,
      },
    })
  }

  async getPaymentMethods(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { paymentMethods: true },
    })
    return user?.paymentMethods ?? {}
  }

  async updatePaymentMethods(userId: string, methods: Record<string, unknown>) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { paymentMethods: methods as Prisma.InputJsonValue },
    })
    return { ok: true }
  }

  async getPublicPaymentMethods(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { paymentMethods: true },
    })
    if (!user) throw new NotFoundException(`Usuario @${username} no encontrado`)
    return user.paymentMethods ?? {}
  }

  async startKycVerification(
    userId: string,
    files: { idDocument: { buffer: Buffer; mimetype: string }; selfie: { buffer: Buffer; mimetype: string } },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { idVerified: true },
    })

    if (!user) throw new NotFoundException('Usuario no encontrado')
    if (user.idVerified) throw new BadRequestException('Tu identidad ya está verificada')

    // Subir a Supabase Storage (bucket privado — solo accesible por service role)
    const docPath = `kyc/${userId}/document_${Date.now()}.jpg`
    const selfiePath = `kyc/${userId}/selfie_${Date.now()}.jpg`

    const [docUpload, selfieUpload] = await Promise.all([
      this.supabase.storage.from('kyc-documents').upload(docPath, files.idDocument.buffer, {
        contentType: files.idDocument.mimetype,
        upsert: true,
      }),
      this.supabase.storage.from('kyc-documents').upload(selfiePath, files.selfie.buffer, {
        contentType: files.selfie.mimetype,
        upsert: true,
      }),
    ])

    if (docUpload.error || selfieUpload.error) {
      throw new BadRequestException('Error al subir los documentos')
    }

    // Guardar solo el hash del documento (nunca el documento en sí en la DB)
    const docHash = crypto.createHash('sha256').update(files.idDocument.buffer).digest('hex')

    await this.prisma.user.update({
      where: { id: userId },
      data: { idDocument: docHash },
    })

    return {
      message: 'Documentos enviados correctamente. La verificación toma hasta 24 horas.',
      status: 'pending',
    }
  }
}
