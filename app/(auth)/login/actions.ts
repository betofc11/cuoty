'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { mensajeDeAuth } from '@/lib/auth/errors'
import { siteUrl } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

export type EstadoLogin = { error?: string; enviadoA?: string }
export type EstadoCodigo = { error?: string }

const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Mínimo de dígitos antes de molestar a Supabase.
 *
 * NO se valida el largo exacto a propósito: «Email OTP Length» es una opción del
 * panel de Supabase que acepta de 6 a 10, y este proyecto la tiene en 8. Cuando
 * acá estaba clavado en 6, el campo truncaba el código bueno y lo rechazaba.
 * El largo lo decide el servidor; acá solo se atajan los descuidos obvios.
 */
const LARGO_MINIMO_CODIGO = 6

/**
 * Manda el código de seis dígitos.
 *
 * Es la misma llamada que mandaba el enlace: lo que decide qué sale es la
 * PLANTILLA del correo en Supabase, no esto. Con `{{ .Token }}` sale el código;
 * con `{{ .ConfirmationURL }}`, el enlace. Y hay dos plantillas en juego — «Confirm
 * signup» para quien nunca entró y «Magic Link» para quien ya existe — así que
 * las dos tienen que llevar el token.
 *
 * `shouldCreateUser` se queda en su valor por defecto (`true`) a propósito: es lo
 * que hace que este mismo formulario sirva para entrar y para registrarse.
 */
export async function enviarCodigo(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const correo = String(formData.get('correo') ?? '')
    .trim()
    .toLowerCase()

  if (!correo) return { error: 'Escribí tu correo.' }
  if (!CORREO.test(correo)) return { error: 'Ese correo no parece válido.' }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: correo,
      // Inerte mientras la plantilla mande solo el código, pero se queda: si
      // alguien vuelve a poner el enlace en la plantilla, sin esto apuntaría al
      // Site URL del proyecto en vez de al callback.
      options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
    })

    if (error) return { error: mensajeDeAuth(error.message) }
    return { enviadoA: correo }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }
}

/**
 * Cambia el código por una sesión.
 *
 * A diferencia del enlace, acá no hay PKCE ni salto a otra app: el código se
 * escribe en la misma pestaña que lo pidió, así que la sesión queda en las
 * cookies correctas. Eso es justo lo que estaba roto en el iPhone, donde el
 * enlace abría en Safari — que tiene su propio frasco de cookies, separado del
 * de la app instalada — y la cookie del `code_verifier` se quedaba del otro lado.
 */
export async function verificarCodigo(
  _prev: EstadoCodigo,
  formData: FormData,
): Promise<EstadoCodigo> {
  const correo = String(formData.get('correo') ?? '')
    .trim()
    .toLowerCase()

  // Que pegar «482 917» o «482-917» funcione igual.
  const codigo = String(formData.get('codigo') ?? '').replace(/\D/g, '')

  if (!CORREO.test(correo)) return { error: 'Volvé a empezar: nos falta tu correo.' }
  if (codigo.length < LARGO_MINIMO_CODIGO) {
    return { error: 'Escribí el código completo que te llegó al correo.' }
  }

  try {
    const supabase = await createClient()

    // `type: 'email'` y no `'signup'` ni `'magiclink'`: el token de quien se
    // registra por primera vez es de un tipo y el de quien ya existe es de otro,
    // y este los cubre a los dos. Con uno de los específicos, la mitad de los
    // ingresos fallaría.
    const { error } = await supabase.auth.verifyOtp({
      email: correo,
      token: codigo,
      type: 'email',
    })

    if (error) return { error: mensajeDeAuth(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  // `redirect()` lanza: va fuera del try para no atraparse a sí mismo.
  redirect('/')
}

export async function entrarConGoogle(): Promise<void> {
  let destino: string | null = null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl()}/auth/callback` },
    })
    if (error) throw error
    destino = data.url
  } catch (e) {
    const msg =
      e instanceof Error ? mensajeDeAuth(e.message) : 'No se pudo conectar con Google.'
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }

  // redirect() lanza, así que va fuera del try para no atraparse a sí mismo.
  if (!destino) {
    redirect(`/login?error=${encodeURIComponent('No se pudo conectar con Google.')}`)
  }
  redirect(destino)
}
