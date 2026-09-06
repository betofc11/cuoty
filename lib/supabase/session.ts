import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

import { supabasePublishableKey, supabaseUrl } from './env'

/**
 * Rutas que se pueden ver sin sesión.
 *
 * `/offline` va acá porque el service worker la precachea al instalarse, y en
 * ese momento no manda cookies: si el proxy la redirigiera al login, lo que
 * quedaría guardado para mostrar sin señal sería la pantalla de login.
 */
function esPublica(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/offline'
  )
}

/**
 * Refresca el token de sesión en cada request y manda al login a quien no la
 * tenga. Sin esto, los Server Components ven sesiones vencidas.
 *
 * Ojo: no metas lógica entre `createServerClient` y `getUser()`. Un bug ahí
 * produce cierres de sesión intermitentes y muy difíciles de reproducir.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !esPublica(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''

    const redireccion = NextResponse.redirect(url)
    // Arrastrar las cookies recién refrescadas, o la sesión se pierde acá.
    for (const cookie of response.cookies.getAll()) {
      redireccion.cookies.set(cookie)
    }
    return redireccion
  }

  return response
}
