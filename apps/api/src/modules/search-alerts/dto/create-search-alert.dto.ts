import { IsString, IsOptional, MaxLength, IsNumber, Min, IsInt, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CreateSearchAlertDto {
  @ApiPropertyOptional({ example: 'Apple' })
  @IsString() @IsOptional()
  brand?: string

  @ApiPropertyOptional({ example: 'iPhone 14 Pro' })
  @IsString() @IsOptional() @MaxLength(100)
  modelName?: string

  @ApiPropertyOptional({ example: 500 })
  @Type(() => Number)
  @IsNumber() @IsOptional() @Min(1)
  maxPriceUsd?: number

  @ApiPropertyOptional({ example: 80 })
  @Type(() => Number)
  @IsInt() @IsOptional() @Min(0) @Max(100)
  minBattery?: number

  @ApiPropertyOptional({ example: 'Caracas' })
  @IsString() @IsOptional() @MaxLength(100)
  city?: string
}
