import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'
import { PrismaService } from '../database/prisma.service'
import type { Request } from 'express'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('Token de autenticación requerido')
    }

    const supabase = createClient(
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new UnauthorizedException('Token inválido o expirado')
    }

    // Verificar ban/suspensión
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isBanned: true, banReason: true, isSuspended: true, suspendedUntil: true, suspendReason: true },
    }).catch(() => null)

    if (profile?.isBanned) {
      throw new ForbiddenException({ code: 'ACCOUNT_BANNED', reason: profile.banReason })
    }

    if (profile?.isSuspended) {
      if (profile.suspendedUntil && profile.suspendedUntil < new Date()) {
        // Suspensión expirada — levantar automáticamente
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isSuspended: false, suspendedUntil: null },
        }).catch(() => null)
      } else {
        throw new ForbiddenException({
          code: 'ACCOUNT_SUSPENDED',
          until: profile.suspendedUntil,
          reason: profile.suspendReason,
        })
      }
    }

    // Inyectar usuario en el request para uso en controllers
    ;(request as Request & { user: typeof user }).user = user
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
