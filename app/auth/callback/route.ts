import { NextResponse, type NextRequest } from 'next/server'

import type { EmailOtpType } from '@supabase/supabase-js'

import { mensajeDeAuth } from '@/lib/auth/errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Vuelta del magic link y de Google.
 *
 * Acepta las dos formas: `?code=` (PKCE, la plantilla de correo por defecto y
 * OAuth) y `?token_hash=&type=` (si algún día se personaliza la plantilla).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Solo rutas internas: un `next` absoluto sería un open redirect.
  const pedido = searchParams.get('next') ?? '/'
  const destino = pedido.startsWith('/') && !pedido.startsWith('//') ? pedido : '/'

  const falla = (msg: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)

  // El proveedor puede devolver el error directamente en la URL.
  const errorUrl = searchParams.get('error_description') ?? searchParams.get('error')
  if (errorUrl) return falla(mensajeDeAuth(errorUrl))

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return falla(mensajeDeAuth(error.message))
    return NextResponse.redirect(`${origin}${destino}`)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) return falla(mensajeDeAuth(error.message))
    return NextResponse.redirect(`${origin}${destino}`)
  }

  return falla('El enlace no es válido. Pedí uno nuevo.')
}
