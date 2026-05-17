import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

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

  // Refrescar sesión (crítico: no agregar lógica entre esto y el return)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/sell', '/dashboard', '/profile/settings']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
