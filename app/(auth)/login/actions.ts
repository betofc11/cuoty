'use server'

import { redirect } from 'next/navigation'

import { mensajeDeAuth } from '@/lib/auth/errors'
import { siteUrl } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

export type EstadoLogin = { error?: string; enviadoA?: string }

const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function enviarEnlace(
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
      options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
    })

    if (error) return { error: mensajeDeAuth(error.message) }
    return { enviadoA: correo }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }
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
