import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { PrismaService } from '../../common/database/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { MagicLinkDto } from './dto/magic-link.dto'

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    )
  }

  async register(dto: RegisterDto) {
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

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: false,
      user_metadata: {
        username: dto.username,
        full_name: dto.fullName,
      },
    })

    if (authError) {
      throw new InternalServerErrorException('Error al crear la cuenta: ' + authError.message)
    }

    // Crear perfil en la tabla users (sincronizado con Supabase Auth)
    const user = await this.prisma.user.create({
      data: {
        id: authData.user.id,
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
      },
    })

    // Enviar email de confirmación
    await this.supabase.auth.admin.inviteUserByEmail(dto.email).catch(() => {
      // Non-blocking — no fallar si el email no se envía
    })

    return {
      message: 'Cuenta creada. Revisa tu email para confirmar tu cuenta.',
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

  async logout(accessToken: string) {
    await this.supabase.auth.admin.signOut(accessToken).catch(() => {
      // Best-effort — el token ya puede estar expirado
    })
    return { message: 'Sesión cerrada correctamente' }
  }
}
