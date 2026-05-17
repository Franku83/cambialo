import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'
import { CreateReviewDto } from './dto/create-review.dto'

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(reviewerId: string, dto: CreateReviewDto) {
    // Validar que no exista review previo del mismo usuario en este listing
    const existing = await this.prisma.review.findUnique({
      where: { listingId_reviewerId: { listingId: dto.listingId, reviewerId } },
    })
    if (existing) throw new ConflictException('Ya dejaste una reseña para este listing')

    // Validar que el reviewer no sea el reviewed
    if (reviewerId === dto.reviewedId) throw new ForbiddenException('No puedes reseñarte a ti mismo')

    // Verificar que el listing exista
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { sellerId: true },
    })
    if (!listing) throw new NotFoundException('Listing no encontrado')

    const review = await this.prisma.review.create({
      data: {
        listingId: dto.listingId,
        reviewerId,
        reviewedId: dto.reviewedId,
        rating: dto.rating,
        ...(dto.comment && { comment: dto.comment }),
        transactionType: dto.transactionType as never,
      },
      include: {
        reviewer: { select: { username: true, avatarUrl: true } },
      },
    })

    // Actualizar reputationScore del reviewed
    await this.updateReputationScore(dto.reviewedId)

    return review
  }

  async getReviewsForUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewedId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { username: true, avatarUrl: true } },
        },
      }),
      this.prisma.review.count({ where: { reviewedId: userId } }),
    ])

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null

    return {
      data: reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    }
  }

  private async updateReputationScore(userId: string) {
    // Calcular score basado en todas las reviews recibidas
    const reviews = await this.prisma.review.findMany({
      where: { reviewedId: userId },
      select: { rating: true },
    })

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { idVerified: true, listings: { where: { verificationStatus: 'verified' }, select: { id: true } } },
    })

    if (!reviews.length || !user) return

    let score = 0

    // Base: verificación de identidad
    if (user.idVerified) score += 20

    // Reviews
    const positives = reviews.filter((r) => r.rating >= 4).length
    const negatives = reviews.filter((r) => r.rating <= 2).length
    score += Math.min(positives * 5, 40)
    score -= negatives * 10

    // Listings verificados
    score += Math.min(user.listings.length * 2, 20)

    score = Math.max(0, Math.min(100, score))

    await this.prisma.user.update({
      where: { id: userId },
      data: { reputationScore: score },
    })
  }
}
