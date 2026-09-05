import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/session'

/**
 * Convención `proxy` de Next 16 (reemplaza a `middleware`).
 * Por ahora solo mantiene fresco el token. Los redirects por sesión llegan en
 * la fase 4 (auth).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Todo salvo estáticos e imágenes.
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
