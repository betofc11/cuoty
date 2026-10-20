/*
 * Solo servidor: `personasDeLaCasa` lee la sesión y las cookies. Un componente
 * cliente no importa nada de acá salvo tipos (`import type`, que se borra al
 * compilar); la inicial y el tono le llegan ya calculados, como al editor de
 * porcentajes en `lib/gastos/porcentajes.ts`.
 */
import { cache } from 'react'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

/** Cuántos tonos de persona hay en `globals.css` (`--persona-N-fondo` y `-tinta`). */
export const TONOS_DE_PERSONA = 6

export type Persona = {
  nombre: string
  inicial: string
  /** De 1 a `TONOS_DE_PERSONA`. Ver `components/ui/avatar.tsx`. */
  tono: number
}

/** Una persona y su porcentaje, para `components/gastos/reparto.tsx`. */
export type ParteDelReparto = {
  membershipId: string
  nombre: string
  tono: number
  /** De 0 a 100. */
  percent: number
}

export function inicialDe(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || '?'
}

/**
 * Las personas de la casa activa, por membresía, cada una con su tono.
 *
 * El tono sale de la POSICIÓN de la membresía por fecha de ingreso, igual que el
 * de las etiquetas (`lib/compras/tonos.ts`): con un hash, dos personas de la
 * misma casa caen en el mismo color demasiado seguido. Por posición, una casa de
 * seis o menos nunca repite.
 *
 * Cuenta también las membresías de quien ya se fue (`left_at`), a propósito:
 * si se saltearan, la salida de alguien le cambiaría el color a todos los que
 * entraron después. RLS deja leer todas las membresías de la casa a cualquier
 * miembro (`memberships_select`).
 */
export const personasDeLaCasa = cache(async (): Promise<Map<string, Persona>> => {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: membresias } = await supabase
    .from('memberships')
    .select('id, user_id')
    .eq('house_id', activa.id)
    .order('joined_at')
    // Desempate estable: dos que entraron en la misma transacción comparten
    // `joined_at`, y sin esto el orden entre ellos cambiaría de una consulta a otra.
    .order('id')

  const ids = (membresias ?? []).map((m) => m.user_id)
  const { data: perfiles } =
    ids.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [] }

  const nombrePorUsuario = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))

  return new Map(
    (membresias ?? []).map((m, i) => {
      const nombre = nombrePorUsuario.get(m.user_id) || 'Sin nombre'
      return [m.id, { nombre, inicial: inicialDe(nombre), tono: (i % TONOS_DE_PERSONA) + 1 }]
    }),
  )
})

/**
 * El tono de una membresía, con un respaldo para la que no está en el mapa: no
 * debería pasar, pero un avatar sin tono no puede romper la pantalla.
 */
export function tonoDe(personas: Map<string, Persona>, membershipId: string): number {
  return personas.get(membershipId)?.tono ?? 1
}
