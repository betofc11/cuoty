import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/** El proxy ya bloquea el paso, pero cada página vuelve a preguntar. */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return { supabase, user }
}

export type Casa = {
  membershipId: string
  id: string
  nombre: string
  /** El rol es POR CASA: el mismo usuario puede ser admin en una y miembro en otra. */
  rol: 'admin' | 'member'
}

/**
 * Dos consultas en vez de un embed anidado, a propósito: el tipado del embed
 * de PostgREST depende de metadatos de la relación y se rompe callado cuando
 * cambian. Esto es explícito y RLS ya recorta ambas.
 */
export async function misCasas(): Promise<Casa[]> {
  const { supabase } = await requireUser()

  const { data: membresias, error } = await supabase
    .from('memberships')
    .select('id, role, house_id')
    .is('left_at', null)
    .order('joined_at')

  if (error) throw new Error(error.message)
  if (!membresias || membresias.length === 0) return []

  const { data: casas, error: errorCasas } = await supabase
    .from('houses')
    .select('id, name')
    .in(
      'id',
      membresias.map((m) => m.house_id),
    )

  if (errorCasas) throw new Error(errorCasas.message)

  const nombrePorId = new Map((casas ?? []).map((c) => [c.id, c.name]))

  return membresias.flatMap((m) => {
    const nombre = nombrePorId.get(m.house_id)
    return nombre
      ? [{ membershipId: m.id, id: m.house_id, nombre, rol: m.role }]
      : []
  })
}
