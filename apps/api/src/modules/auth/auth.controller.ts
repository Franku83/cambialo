import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import type { User } from '@supabase/supabase-js'
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

  // ─── Settings ─────────────────────────────────────────────────────────────

  @Post('settings/change-email')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar email' })
  async changeEmail(@CurrentUser() user: User, @Body() body: { newEmail: string }) {
    return this.authService.changeEmail(user.id, body.newEmail)
  }

  @Post('settings/change-password')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword)
  }

  @Get('settings/2fa-status')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado del 2FA' })
  async get2FAStatus(@CurrentUser() user: User) {
    return this.authService.get2FAStatus(user.id)
  }

  @Delete('settings/2fa/:factorId')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar 2FA' })
  async disable2FA(@CurrentUser() user: User, @Param('factorId') factorId: string) {
    return this.authService.disable2FA(user.id, factorId)
  }

  @Get('settings/notifications')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preferencias de notificaciones' })
  async getNotificationPreferences(@CurrentUser() user: User) {
    return this.authService.getNotificationPreferences(user.id)
  }

  @Put('settings/notifications')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar preferencias de notificaciones' })
  async updateNotificationPreferences(@CurrentUser() user: User, @Body() body: Record<string, boolean>) {
    return this.authService.updateNotificationPreferences(user.id, body)
  }
}
