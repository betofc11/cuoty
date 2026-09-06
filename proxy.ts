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
    //
    // `sw.js` va afuera por obligación, no por eficiencia: si la sesión venció,
    // el proxy respondería con un redirect al login, y la especificación de
    // service workers prohíbe redirects al pedir el script. El worker dejaría
    // de actualizarse y no habría forma de darse cuenta.
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
