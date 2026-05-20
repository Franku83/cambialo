import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const ROLES_REQUIRE_2FA = ['moderator', 'admin', 'owner']
const TWO_FA_EXEMPT = ['/setup-2fa', '/verify-2fa', '/login', '/auth/callback']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // @ts-expect-error — @supabase/ssr cookie types incompatible with exactOptionalPropertyTypes
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          // @ts-expect-error — same
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/sell', '/dashboard', '/profile/settings', '/admin', '/kyc']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2FA para roles críticos (moderator, admin, owner)
  if (user && !TWO_FA_EXEMPT.some((p) => pathname.startsWith(p))) {
    try {
      // Verificar si el usuario tiene rol crítico via Supabase admin
      const adminClient = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      const { data: rolesData } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ROLES_REQUIRE_2FA)

      const hasCriticalRole = (rolesData ?? []).length > 0

      if (hasCriticalRole) {
        // Verificar nivel de autenticación (AAL2 = 2FA completado)
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

        if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
          // Tiene 2FA configurado pero no lo ha completado en esta sesión
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/verify-2fa'
          redirectUrl.searchParams.set('next', pathname)
          return NextResponse.redirect(redirectUrl)
        }

        // Verificar si tiene factores TOTP registrados
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const hasVerifiedTOTP = factors?.totp?.some((f) => f.status === 'verified') ?? false

        if (!hasVerifiedTOTP) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/setup-2fa'
          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch {
      // Error en el check de 2FA — dejar pasar para no bloquear la app
    }
  }

  return supabaseResponse
}
