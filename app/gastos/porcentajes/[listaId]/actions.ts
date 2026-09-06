'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

export type EstadoGuardado = { error?: string }

type Reparto = { membershipId: string; percent: number }

export async function guardarPorcentajes(
  _prev: EstadoGuardado,
  formData: FormData,
): Promise<EstadoGuardado> {
  const listaId = String(formData.get('listaId') ?? '')
  const crudo = String(formData.get('reparto') ?? '[]')

  let reparto: Reparto[]
  try {
    reparto = JSON.parse(crudo) as Reparto[]
  } catch {
    return { error: 'No se pudo leer el reparto.' }
  }

  const suma = reparto.reduce((acc, r) => acc + Math.round(r.percent * 100), 0)
  if (suma !== 10_000) {
    return { error: `Los porcentajes suman ${suma / 100}%, tienen que sumar 100%.` }
  }

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') {
    return { error: 'Solo el admin reparte los porcentajes.' }
  }

  try {
    const { supabase } = await requireUser()

    // UN SOLO upsert a propósito: el constraint de "suman 100" es DEFERRABLE y
    // se verifica al cerrar la transacción. Mandar una fila por request haría
    // que cada una fallara sola. Además el trigger de ajustes es a nivel de
    // statement: así escribe un solo movimiento por cambio, no uno por miembro.
    const { error } = await supabase.from('list_shares').upsert(
      reparto.map((r) => ({
        list_id: listaId,
        membership_id: r.membershipId,
        percent: r.percent,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'list_id,membership_id' },
    )

    if (error) return { error: error.message }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/gastos')
  redirect('/gastos')
}
