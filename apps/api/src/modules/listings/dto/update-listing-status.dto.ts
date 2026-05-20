import { IsIn, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateListingStatusDto {
  @ApiProperty({
    description: 'El nuevo estado del listing',
    enum: ['active', 'paused', 'sold', 'removed'],
    example: 'paused',
  })
  @IsString()
  @IsIn(['active', 'paused', 'sold', 'removed'])
  status: 'active' | 'paused' | 'sold' | 'removed'
}
