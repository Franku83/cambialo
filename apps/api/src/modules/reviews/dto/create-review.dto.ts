import { IsString, IsInt, IsOptional, IsEnum, Min, Max, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  listingId: string

  @ApiProperty()
  @IsString()
  reviewedId: string

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5)
  rating: number

  @ApiPropertyOptional()
  @IsString() @IsOptional() @MaxLength(500)
  comment?: string

  @ApiProperty({ enum: ['buy', 'sell'] })
  @IsEnum(['buy', 'sell'])
  transactionType: 'buy' | 'sell'
}
