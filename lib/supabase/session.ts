import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env'

/**
 * Refresca el token de sesión en cada request y lo devuelve en la respuesta.
 * Sin esto, los Server Components ven sesiones vencidas.
 *
 * Ojo: no metas lógica entre `createServerClient` y `getUser()`. Un bug ahí
 * produce cierres de sesión intermitentes y muy difíciles de reproducir.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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

  await supabase.auth.getUser()

  return response
}
