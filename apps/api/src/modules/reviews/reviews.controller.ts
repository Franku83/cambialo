import { Controller, Post, Get, Body, Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear reseña post-transacción' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto)
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Reviews recibidas por un usuario' })
  async getForUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getReviewsForUser(userId, page, Math.min(limit, 50))
  }
}
