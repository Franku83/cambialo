import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

enum ListingConditionEnum {
  mint = 'mint',
  good = 'good',
  fair = 'fair',
  poor = 'poor',
}

export class CreateListingDto {
  @ApiProperty({ example: 'uuid-del-device-model' })
  @IsString()
  deviceModelId: string

  @ApiProperty({ example: 650.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  priceUsd: number

  @ApiProperty({ example: 256 })
  @IsInt()
  @Min(1)
  storageGb: number

  @ApiProperty({ example: 'Negro Medianoche' })
  @IsString()
  @MaxLength(50)
  color: string

  @ApiProperty({ example: 87, description: '0-100' })
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealth: number

  @ApiProperty({ enum: ListingConditionEnum })
  @IsEnum(ListingConditionEnum)
  condition: ListingConditionEnum

  @ApiProperty({ example: '4589', description: 'Últimos 4 dígitos del IMEI' })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'imeiLast4 debe ser exactamente 4 dígitos' })
  imeiLast4: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasIcloudLock?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasGoogleLock?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasRepairs?: boolean

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  repairDetails?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includesBox?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includesCharger?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  includesEarphones?: boolean

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  acceptsOffers?: boolean

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @IsOptional()
  minOfferUsd?: number

  @ApiPropertyOptional({ example: 'Caracas' })
  @IsString()
  @IsOptional()
  city?: string

  @ApiPropertyOptional({ example: 'Distrito Capital' })
  @IsString()
  @IsOptional()
  state?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  meetAtMall?: boolean
}
