import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@supabase/supabase-js'
import type { Request } from 'express'

/**
 * Igual que SupabaseAuthGuard pero nunca bloquea la request.
 * Si hay un Bearer token válido, inyecta `request.user` — si no, continúa anónimo.
 * Útil para endpoints públicos que quieren registrar al usuario cuando está autenticado.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const [type, token] = request.headers.authorization?.split(' ') ?? []

    if (type === 'Bearer' && token) {
      const supabase = createClient(
        this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL')!,
        this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        ;(request as Request & { user: typeof user }).user = user
      }
    }

    return true
  }
}
