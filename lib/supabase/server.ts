import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

import { supabasePublishableKey, supabaseUrl } from './env'

/**
 * Cliente para Server Components, Route Handlers y Server Actions.
 * Toda la seguridad vive en RLS: este cliente usa la llave publicable y la
 * sesión del usuario, nunca una service key.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Llamado desde un Server Component: el middleware ya refresca la
          // sesión, así que se puede ignorar.
        }
      },
    },
  })
}
