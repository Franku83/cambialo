// apps/api/src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
