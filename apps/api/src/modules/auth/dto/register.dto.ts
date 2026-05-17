// apps/api/src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsString()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El usuario solo puede contener letras, números y guiones bajos',
  })
  username: string;

  @IsString()
  @MinLength(2, { message: 'El nombre completo debe tener al menos 2 caracteres' })
  @MaxLength(100)
  fullName: string;
}
