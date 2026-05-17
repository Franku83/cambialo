import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

enum ListingConditionEnum {
  mint = 'mint',
  good = 'good',
  fair = 'fair',
  poor = 'poor',
}

export class ListingFiltersDto {
  @ApiPropertyOptional({ example: 'Apple' })
  @IsString()
  @IsOptional()
  brand?: string

  @ApiPropertyOptional({ example: 'iPhone 14 Pro' })
  @IsString()
  @IsOptional()
  model?: string

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number

  @ApiPropertyOptional({ description: 'Salud de batería mínima 0-100' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  minBattery?: number

  @ApiPropertyOptional({ enum: ListingConditionEnum, isArray: true })
  @IsArray()
  @IsEnum(ListingConditionEnum, { each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  condition?: ListingConditionEnum[]

  @ApiPropertyOptional({ example: 'Caracas' })
  @IsString()
  @IsOptional()
  city?: string

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  verifiedOnly?: boolean

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  acceptsOffers?: boolean

  @ApiPropertyOptional({ description: 'Cursor para paginación (ID del último listing)' })
  @IsString()
  @IsOptional()
  cursor?: string

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number
}
