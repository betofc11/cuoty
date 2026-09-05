'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type EstadoCasa = { error?: string }

/**
 * Los RPC de la base ya lanzan mensajes en español pensados para el usuario.
 * Esto solo atrapa los que se escaparon del guion y suenan a base de datos.
 */
function mensajeDeBase(bruto: string): string {
  const tecnico =
    /violates|duplicate key|permission denied|syntax error|does not exist|null value/i
  if (tecnico.test(bruto)) return 'No se pudo completar. Intentá de nuevo.'
  return bruto
}

export async function crearCasa(
  _prev: EstadoCasa,
  formData: FormData,
): Promise<EstadoCasa> {
  const nombre = String(formData.get('nombre') ?? '').trim()

  if (!nombre) return { error: 'Poné un nombre para la casa.' }
  if (nombre.length > 60) return { error: 'El nombre es muy largo: máximo 60 caracteres.' }

  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('create_house', { p_name: nombre })
    if (error) return { error: mensajeDeBase(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function unirseACasa(
  _prev: EstadoCasa,
  formData: FormData,
): Promise<EstadoCasa> {
  const codigo = String(formData.get('codigo') ?? '').trim()

  if (!codigo) return { error: 'Escribí el código que te pasaron.' }

  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('join_house', { p_code: codigo })
    if (error) return { error: mensajeDeBase(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
