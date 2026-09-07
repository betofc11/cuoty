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

export type Perfil = {
  /** Vacío significa «todavía no lo puso», no «falló la consulta». */
  nombre: string
  avatarUrl: string | null
}

/**
 * El nombre de quien está usando la app.
 *
 * Sale de `profiles`, NO de `user_metadata`: la metadata solo la llena Google.
 * Todo el resto de la app —los saldos, «Quiénes están», el «registrado por» de
 * cada abono— ya lee `profiles.display_name`. Con dos fuentes, quien entraba por
 * correo se veía a sí mismo sin nombre mientras los demás lo veían con uno.
 */
export const perfilActual = cache(async (): Promise<Perfil> => {
  const { supabase, user } = await requireUser()

  // `maybeSingle` y no `single`: si por lo que sea no hay fila de perfil, esto
  // tiene que devolver «sin nombre» y mandar a /bienvenida, no reventar la app.
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return {
    nombre: (data?.display_name ?? '').trim(),
    avatarUrl: data?.avatar_url ?? null,
  }
})

/**
 * Portón: sin nombre no se pasa.
 *
 * No es cosmético. `display_name` es lo que ve TODA la casa en la lista de
 * saldos y en cada abono; dejar entrar a alguien sin nombre le ensucia la
 * contabilidad al resto, no solo su propia pantalla.
 */
export async function exigirNombre(): Promise<string> {
  const { nombre } = await perfilActual()
  if (!nombre) redirect('/bienvenida')
  return nombre
}

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
