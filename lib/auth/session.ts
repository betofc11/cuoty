import { redirect } from 'next/navigation'
import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

/**
 * El proxy ya bloquea el paso, pero cada página vuelve a preguntar.
 * `cache` lo resuelve una sola vez por request: el shell y la página lo piden
 * por separado y no tiene sentido ir dos veces al servidor de auth.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return { supabase, user }
})

export type Casa = {
  membershipId: string
  id: string
  nombre: string
  /** El rol es POR CASA: el mismo usuario puede ser admin en una y miembro en otra. */
  rol: 'admin' | 'member'
  miembros: number
}

/**
 * Dos consultas en vez de un embed anidado, a propósito: el tipado del embed
 * de PostgREST depende de metadatos de la relación y se rompe callado cuando
 * cambian. Esto es explícito y RLS ya recorta ambas.
 */
export const misCasas = cache(async (): Promise<Casa[]> => {
  const { supabase, user } = await requireUser()

  // `eq('user_id', ...)` es imprescindible: la política `memberships_select`
  // deja ver TODAS las membresías de las casas donde estás, no solo las tuyas.
  // Sin este filtro cada casa aparece una vez por miembro.
  const { data: membresias, error } = await supabase
    .from('memberships')
    .select('id, role, house_id')
    .eq('user_id', user.id)
    .is('left_at', null)
    .order('joined_at')

  if (error) throw new Error(error.message)
  if (!membresias || membresias.length === 0) return []

  const ids = membresias.map((m) => m.house_id)

  const [{ data: casas, error: errorCasas }, { data: todas, error: errorConteo }] =
    await Promise.all([
      supabase.from('houses').select('id, name').in('id', ids),
      supabase.from('memberships').select('house_id').in('house_id', ids).is('left_at', null),
    ])

  if (errorCasas) throw new Error(errorCasas.message)
  if (errorConteo) throw new Error(errorConteo.message)

  const nombrePorId = new Map((casas ?? []).map((c) => [c.id, c.name]))

  const conteo = new Map<string, number>()
  for (const fila of todas ?? []) {
    conteo.set(fila.house_id, (conteo.get(fila.house_id) ?? 0) + 1)
  }

  return membresias.flatMap((m) => {
    const nombre = nombrePorId.get(m.house_id)
    if (!nombre) return []
    return [
      {
        membershipId: m.id,
        id: m.house_id,
        nombre,
        rol: m.role,
        miembros: conteo.get(m.house_id) ?? 1,
      },
    ]
  })
})
