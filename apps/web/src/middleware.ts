import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, manifest.json, sw.js (archivos PWA)
     * - Imágenes públicas
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|screenshots/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
