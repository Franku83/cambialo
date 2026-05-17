import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'
import type { Request } from 'express'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

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

    // Inyectar usuario en el request para uso en controllers
    ;(request as Request & { user: typeof user }).user = user
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
