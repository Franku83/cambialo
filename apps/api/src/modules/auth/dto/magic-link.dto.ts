// apps/api/src/modules/auth/dto/magic-link.dto.ts
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class MagicLinkDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @IsOptional()
  redirectTo?: string;
}
