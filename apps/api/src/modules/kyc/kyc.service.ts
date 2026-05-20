import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { PrismaService } from '../../common/database/prisma.service'

type KycStatus = 'none' | 'pending' | 'approved' | 'rejected'

@Injectable()
export class KycService {
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

  async getStatus(userId: string): Promise<{ status: KycStatus; rejectionReason?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')

    if (user.kycStatus !== 'pending' && user.kycStatus !== 'rejected') {
      return { status: user.kycStatus as KycStatus }
    }

    // Si está pendiente o rechazado, traer la última submission para la razón
    const latest = await this.prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      select: { status: true, rejectionReason: true },
    })

    return {
      status: user.kycStatus as KycStatus,
      ...(latest?.rejectionReason ? { rejectionReason: latest.rejectionReason } : {}),
    }
  }

  async submit(
    userId: string,
    documentFrontBuffer: Buffer,
    selfieBuffer: Buffer,
    documentMime: string,
    selfieMime: string,
    whatsappNumber: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    if (user.kycStatus === 'approved') {
      throw new ConflictException('Ya estás verificado')
    }
    if (user.kycStatus === 'pending') {
      throw new ConflictException('Ya tienes una solicitud en revisión')
    }

    const ext = (mime: string) => mime.split('/')[1] ?? 'jpg'
    const ts = Date.now()
    const docPath = `${userId}/doc-${ts}.${ext(documentMime)}`
    const selfiePath = `${userId}/selfie-${ts}.${ext(selfieMime)}`

    const [docUpload, selfieUpload] = await Promise.all([
      this.supabase.storage.from('kyc-documents').upload(docPath, documentFrontBuffer, {
        contentType: documentMime,
        upsert: true,
      }),
      this.supabase.storage.from('kyc-documents').upload(selfiePath, selfieBuffer, {
        contentType: selfieMime,
        upsert: true,
      }),
    ])

    if (docUpload.error) throw new BadRequestException('Error subiendo documento: ' + docUpload.error.message)
    if (selfieUpload.error) throw new BadRequestException('Error subiendo selfie: ' + selfieUpload.error.message)

    const submission = await this.prisma.kycSubmission.create({
      data: {
        userId,
        documentFrontPath: docPath,
        selfiePath,
        whatsappNumber: whatsappNumber.trim(),
        status: 'pending',
      },
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'pending' },
    })

    return { id: submission.id, status: 'pending' }
  }

  async getPending(adminId: string) {
    await this.assertAdmin(adminId)

    const submissions = await this.prisma.kycSubmission.findMany({
      where: { status: 'pending' },
      orderBy: { submittedAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
    })

    // Generar URLs firmadas (válidas 1 hora)
    return Promise.all(
      submissions.map(async (s) => {
        const [docUrl, selfieUrl] = await Promise.all([
          this.supabase.storage.from('kyc-documents').createSignedUrl(s.documentFrontPath, 3600),
          this.supabase.storage.from('kyc-documents').createSignedUrl(s.selfiePath, 3600),
        ])
        return {
          id: s.id,
          userId: s.userId,
          username: s.user.username,
          fullName: s.user.fullName,
          whatsappNumber: s.whatsappNumber,
          submittedAt: s.submittedAt,
          status: s.status,
          documentFrontUrl: docUrl.data?.signedUrl ?? null,
          selfieUrl: selfieUrl.data?.signedUrl ?? null,
        }
      }),
    )
  }

  async approve(submissionId: string, adminId: string) {
    await this.assertAdmin(adminId)

    const submission = await this.prisma.kycSubmission.findUnique({ where: { id: submissionId } })
    if (!submission) throw new NotFoundException('Solicitud no encontrada')
    if (submission.status !== 'pending') throw new BadRequestException('Solicitud ya procesada')

    await this.prisma.$transaction([
      this.prisma.kycSubmission.update({
        where: { id: submissionId },
        data: { status: 'approved', reviewedBy: adminId, reviewedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: submission.userId },
        data: { kycStatus: 'approved', idVerified: true, isVerifiedSeller: true },
      }),
    ])

    return { approved: true }
  }

  async reject(submissionId: string, adminId: string, reason: string) {
    await this.assertAdmin(adminId)

    const submission = await this.prisma.kycSubmission.findUnique({ where: { id: submissionId } })
    if (!submission) throw new NotFoundException('Solicitud no encontrada')
    if (submission.status !== 'pending') throw new BadRequestException('Solicitud ya procesada')

    if (!reason?.trim()) throw new BadRequestException('Se requiere una razón de rechazo')

    await this.prisma.$transaction([
      this.prisma.kycSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'rejected',
          rejectionReason: reason.trim(),
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: submission.userId },
        data: { kycStatus: 'rejected' },
      }),
    ])

    return { rejected: true, reason }
  }

  private async assertAdmin(userId: string) {
    const role = await this.prisma.userRole_Assignment.findFirst({
      where: { userId, role: { in: ['admin', 'owner'] } },
    })
    if (!role) throw new UnauthorizedException('Se requiere rol de admin u owner')
  }
}
