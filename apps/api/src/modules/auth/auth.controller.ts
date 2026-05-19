import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { MagicLinkDto } from './dto/magic-link.dto'
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nueva cuenta' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar magic link de acceso' })
  async sendMagicLink(@Body() dto: MagicLinkDto) {
    return this.authService.sendMagicLink(dto)
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id)
  }

  @Get('check-username')
  @ApiOperation({ summary: 'Verificar disponibilidad de username' })
  async checkUsername(@Query('username') username: string) {
    return this.authService.checkUsername(username ?? '')
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1]
    return this.authService.logout(token ?? '')
  }
}
