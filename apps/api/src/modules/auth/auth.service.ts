import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { PrismaService } from '../../common/database/prisma.service'
import { UsernameValidatorService } from '../users/username-validator.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { MagicLinkDto } from './dto/magic-link.dto'

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly usernameValidator: UsernameValidatorService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    )
  }

  async register(dto: RegisterDto) {
    // Validar formato y censura del username
    this.usernameValidator.validate(dto.username)

    // Verificar email baneado
    const banned = await this.prisma.bannedEmail.findUnique({ where: { email: dto.email } })
    if (banned) throw new ConflictException('No es posible crear una cuenta con este email')

    // Verificar unicidad antes de crear en Supabase
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Ya existe una cuenta con ese email')
      }
      throw new ConflictException('Ese nombre de usuario ya está en uso')
    }

    // Crear usuario en Supabase Auth — email_confirm: true para login inmediato
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        username: dto.username,
        full_name: dto.fullName,
      },
    })

    if (authError) {
      throw new InternalServerErrorException('Error al crear la cuenta: ' + authError.message)
    }

    // Crear perfil en la tabla users (upsert por si el trigger ya insertó la fila)
    const user = await this.prisma.user.upsert({
      where: { id: authData.user.id },
      create: {
        id: authData.user.id,
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
      },
      update: {
        username: dto.username,
        fullName: dto.fullName,
      },
    })

    return {
      message: 'Cuenta creada exitosamente.',
      userId: user.id,
    }
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    })

    if (error || !data.session) {
      throw new UnauthorizedException('Email o contraseña incorrectos')
    }

    // Verificar que el usuario no esté baneado
    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      select: { isBanned: true, banReason: true, username: true, fullName: true },
    })

    if (user?.isBanned) {
      throw new UnauthorizedException(`Cuenta suspendida: ${user.banReason ?? 'contacta soporte'}`)
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: user?.username,
        fullName: user?.fullName,
      },
    }
  }

  async sendMagicLink(dto: MagicLinkDto) {
    const redirectTo =
      dto.redirectTo ?? `${this.config.get<string>('NEXT_PUBLIC_APP_URL')}/auth/callback`

    const { error } = await this.supabase.auth.signInWithOtp({
      email: dto.email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      throw new BadRequestException('No se pudo enviar el magic link: ' + error.message)
    }

    return { message: 'Magic link enviado. Revisa tu email.' }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        idVerified: true,
        reputationScore: true,
        totalSales: true,
        totalPurchases: true,
        isVerifiedSeller: true,
        verifiedSellerUntil: true,
        locationCity: true,
        locationState: true,
        whatsappNumber: true,
        createdAt: true,
        roles: {
          select: { role: true },
        },
        _count: {
          select: {
            listings: { where: { status: 'active' } },
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado')
    }

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
      activeListingsCount: user._count.listings,
    }
  }

  async checkUsername(username: string): Promise<{ available: boolean }> {
    if (!username || username.length < 3) return { available: false }
    try {
      this.usernameValidator.validate(username)
    } catch {
      return { available: false }
    }
    const existing = await this.prisma.user.findFirst({ where: { username: username.toLowerCase() } })
    return { available: !existing }
  }

  async logout(accessToken: string) {
    await this.supabase.auth.admin.signOut(accessToken).catch(() => {
      // Best-effort — el token ya puede estar expirado
    })
    return { message: 'Sesión cerrada correctamente' }
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async changeEmail(userId: string, newEmail: string) {
    const existing = await this.prisma.user.findFirst({ where: { email: newEmail } })
    if (existing) throw new ConflictException('Ese email ya está en uso')

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true,
    })
    if (error) throw new BadRequestException('No se pudo actualizar el email: ' + error.message)

    await this.prisma.user.update({ where: { id: userId }, data: { email: newEmail } })
    return { ok: true }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres')

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (!user) throw new UnauthorizedException('Usuario no encontrado')

    const { error: authError } = await this.supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (authError) throw new UnauthorizedException('Contraseña actual incorrecta')

    const { error } = await this.supabase.auth.admin.updateUserById(userId, { password: newPassword })
    if (error) throw new BadRequestException('No se pudo actualizar la contraseña: ' + error.message)

    return { ok: true }
  }

  async get2FAStatus(userId: string) {
    const { data } = await this.supabase.auth.admin.mfa.listFactors({ userId })
    const factors = data?.factors ?? []
    const totp = factors.filter((f) => f.factor_type === 'totp')
    return {
      enabled: totp.some((f) => f.status === 'verified'),
      factors: totp,
    }
  }

  async disable2FA(userId: string, factorId: string) {
    const roles = await this.prisma.userRole_Assignment.findMany({ where: { userId } })
    const isCritical = roles.some((r) => ['moderator', 'admin', 'owner'].includes(r.role))
    if (isCritical) throw new ForbiddenException('Los administradores y moderadores no pueden desactivar el 2FA')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase.auth.admin.mfa as any).deleteFactor({ userId, id: factorId })
    if (error) throw new BadRequestException('No se pudo desactivar el 2FA: ' + error.message)
    return { ok: true }
  }

  async getNotificationPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({ where: { userId } })
    if (!prefs) {
      // Devolver defaults si no existen
      return {
        userId, pushEnabled: true, emailEnabled: true,
        newOffer: true, listingVerified: true, listingRejected: true,
        reviewRequest: true, priceAlert: true, searchAlert: true, marketingEmails: false,
      }
    }
    return prefs
  }

  async updateNotificationPreferences(userId: string, dto: Partial<{
    pushEnabled: boolean; emailEnabled: boolean; newOffer: boolean;
    listingVerified: boolean; listingRejected: boolean; reviewRequest: boolean;
    priceAlert: boolean; searchAlert: boolean; marketingEmails: boolean;
  }>) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    })
  }
}
