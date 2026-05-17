// apps/api/src/modules/users/dto/update-user.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  locationCity?: string;

  @IsOptional()
  @IsString()
  locationState?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Avatar URL inválida' })
  avatarUrl?: string;
}
