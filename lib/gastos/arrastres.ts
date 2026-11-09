import { cache } from 'react'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { inicialDe, personasDeLaCasa, tonoDe, type Persona } from '@/lib/casas/personas'
import { add, addToPair, isZero, money, zeroPair, type MoneyPair } from '@/lib/money'

/*
 * El arrastre: lo que quedó sin abonar de los meses ya cerrados.
 *
 * Cerrado congela los gastos y los porcentajes, NO los abonos: un mes cerrado
 * sigue recibiendo plata. Por eso lo que se debe HOY sale de `period_balances`,
 * y `period_carryovers` (la foto del cierre) se usa solo para mostrar cuánto
 * quedaba al cerrar (invariante 3).
 *
 * RLS decide el alcance: el admin ve a toda la casa y el miembro solo lo suyo,
 * con la misma policy en las dos fuentes.
 */

export type PersonaDelArrastre = {
  membershipId: string
  nombre: string
  inicial: string
  tono: number
  esYo: boolean
}

export type DeudaDeArrastre = PersonaDelArrastre & {
  /** Lo que le queda HOY de ese mes. Negativo = a favor. */
  saldo: MoneyPair
}

export type MesDeArrastre = {
  periodoId: string
  mes: string
  /** Quienes todavía no están en cero, en el orden de la casa. Vacío si ya se saldó. */
  deudas: DeudaDeArrastre[]
  /** Solo lo que falta abonar: un saldo a favor no se resta de lo que deben los demás. */
  porCobrar: MoneyPair
  saldado: boolean
}

export type VistaDeArrastres = {
  /**
   * Cada mes que cerró con saldo, del más nuevo al más viejo, como el selector
   * de mes. Incluye los que ya se saldaron: son el historial.
   */
  meses: MesDeArrastre[]
  /** Cuántos de esos meses siguen con saldo. */
  sinSaldar: number
  /** La suma de `porCobrar` de todos los meses, cada moneda por su lado. */
  porCobrar: MoneyPair
}

/** Cada moneda con la suya: `add` no deja cruzarlas (invariante 4). */
function sumarPares(a: MoneyPair, b: MoneyPair): MoneyPair {
  return { CRC: add(a.CRC, b.CRC), USD: add(a.USD, b.USD) }
}

/** Lo a favor no cuenta como deuda: queda en cero. */
export function loQueSeDebe(par: MoneyPair): MoneyPair {
  return {
    CRC: money(Math.max(par.CRC.minor, 0), 'CRC'),
    USD: money(Math.max(par.USD.minor, 0), 'USD'),
  }
}

export function hayPlata(par: MoneyPair): boolean {
  return !isZero(par.CRC) || !isZero(par.USD)
}

/** Las personas de un mapa por membresía, en el orden de la casa. */
function enOrden<T>(
  porPersona: Map<string, T>,
  personas: Map<string, Persona>,
  miMembresia: string,
): (PersonaDelArrastre & { dato: T })[] {
  const orden = [...personas.keys()]
  const posicion = (id: string) => {
    const i = orden.indexOf(id)
    return i === -1 ? orden.length : i
  }

  return [...porPersona.entries()]
    .sort(([a], [b]) => posicion(a) - posicion(b))
    .map(([membershipId, dato]) => {
      const nombre = personas.get(membershipId)?.nombre ?? 'Sin nombre'
      return {
        membershipId,
        nombre,
        inicial: inicialDe(nombre),
        tono: tonoDe(personas, membershipId),
        esYo: membershipId === miMembresia,
        dato,
      }
    })
}

/** Suma filas de `period_balances` o `period_carryovers` por persona, sin los ceros. */
function porPersona(
  filas: { membership_id: string | null; currency: 'CRC' | 'USD' | null; monto: number }[],
): Map<string, MoneyPair> {
  const mapa = new Map<string, MoneyPair>()
  for (const f of filas) {
    if (!f.membership_id || !f.currency || f.monto === 0) continue
    mapa.set(f.membership_id, addToPair(mapa.get(f.membership_id) ?? zeroPair(), f.monto, f.currency))
  }
  for (const [id, par] of mapa) if (!hayPlata(par)) mapa.delete(id)
  return mapa
}

/**
 * Los meses con arrastre, para el desplegable de Gastos. `cache` porque es una
 * consulta por casa y no por mes: la pide cada vista de la pestaña.
 */
export const vistaDeArrastres = cache(async (): Promise<VistaDeArrastres> => {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: cerrados, error } = await supabase
    .from('periods')
    .select('id, month')
    .eq('house_id', activa.id)
    .eq('status', 'closed')
    .order('month', { ascending: false })

  if (error) throw new Error(error.message)

  const vacia: VistaDeArrastres = { meses: [], sinSaldar: 0, porCobrar: zeroPair() }
  if (!cerrados || cerrados.length === 0) return vacia

  const ids = cerrados.map((p) => p.id)

  const [{ data: filasSaldo, error: errorSaldo }, { data: filasFoto }, personas] =
    await Promise.all([
      supabase
        .from('period_balances')
        .select('period_id, membership_id, currency, balance')
        // RLS deja ver toda la casa: el filtro por casa va siempre.
        .eq('house_id', activa.id)
        .in('period_id', ids),
      supabase.from('period_carryovers').select('period_id').in('period_id', ids),
      personasDeLaCasa(),
    ])

  if (errorSaldo) throw new Error(errorSaldo.message)

  // `close_period` solo escribe fotos distintas de cero: un mes con foto cerró
  // debiendo. Sin foto cerró al día y no es arrastre, ni siquiera saldado.
  const cerraronDebiendo = new Set((filasFoto ?? []).map((f) => f.period_id))

  const meses: MesDeArrastre[] = []
  let porCobrar = zeroPair()

  for (const p of cerrados) {
    const vivos = porPersona(
      (filasSaldo ?? [])
        .filter((f) => f.period_id === p.id)
        .map((f) => ({ ...f, monto: Number(f.balance ?? 0) })),
    )
    if (vivos.size === 0 && !cerraronDebiendo.has(p.id)) continue

    const deudas = enOrden(vivos, personas, activa.membershipId).map(({ dato, ...persona }) => ({
      ...persona,
      saldo: dato,
    }))
    const delMes = deudas.reduce((total, d) => sumarPares(total, loQueSeDebe(d.saldo)), zeroPair())
    porCobrar = sumarPares(porCobrar, delMes)

    meses.push({
      periodoId: p.id,
      mes: p.month,
      deudas,
      porCobrar: delMes,
      saldado: deudas.length === 0,
    })
  }

  return { meses, sinSaldar: meses.filter((m) => !m.saldado).length, porCobrar }
})

export type PersonaEnElArrastre = PersonaDelArrastre & {
  /** Lo que le quedaba al cerrar el mes: la foto, que no cambia nunca. */
  alCerrar: MoneyPair
  /** Lo que le queda hoy. Puede ser menos que `alCerrar`: el mes sigue recibiendo abonos. */
  hoy: MoneyPair
}

export type DetalleDeArrastre = {
  periodoId: string
  mes: string
  cerradoEl: string | null
  cerradoPor: string | null
  /** Quienes arrastraron algo, o todavía deben algo, de ese mes. */
  personas: PersonaEnElArrastre[]
  porCobrar: MoneyPair
}

/**
 * Quién arrastró qué de un mes cerrado. `clave` es '2026-07', la de la URL.
 * `null` si el mes no existe, no es de la casa activa o no está cerrado.
 */
export async function detalleDeArrastre(clave: string): Promise<DetalleDeArrastre | null> {
  if (!/^\d{4}-\d{2}$/.test(clave)) return null

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: periodo } = await supabase
    .from('periods')
    .select('id, month, status, closed_at, closed_by')
    .eq('house_id', activa.id)
    // `month` es date: comparación exacta. Un LIKE sobre una fecha no matchea nada.
    .eq('month', `${clave}-01`)
    .maybeSingle()

  if (!periodo || periodo.status !== 'closed') return null

  const [{ data: filasSaldo }, { data: filasFoto }, personas, { data: perfil }] =
    await Promise.all([
      supabase
        .from('period_balances')
        .select('membership_id, currency, balance')
        .eq('house_id', activa.id)
        .eq('period_id', periodo.id),
      supabase
        .from('period_carryovers')
        .select('membership_id, currency, amount')
        .eq('period_id', periodo.id),
      personasDeLaCasa(),
      periodo.closed_by
        ? supabase.from('profiles').select('display_name').eq('id', periodo.closed_by).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

  const hoy = porPersona((filasSaldo ?? []).map((f) => ({ ...f, monto: Number(f.balance ?? 0) })))
  const alCerrar = porPersona((filasFoto ?? []).map((f) => ({ ...f, monto: Number(f.amount) })))

  const todas = new Map<string, null>([...alCerrar.keys(), ...hoy.keys()].map((id) => [id, null]))

  const lista = enOrden(todas, personas, activa.membershipId).map(({ dato: _dato, ...persona }) => ({
    ...persona,
    alCerrar: alCerrar.get(persona.membershipId) ?? zeroPair(),
    hoy: hoy.get(persona.membershipId) ?? zeroPair(),
  }))

  return {
    periodoId: periodo.id,
    mes: periodo.month,
    cerradoEl: periodo.closed_at,
    cerradoPor: perfil?.display_name || (periodo.closed_by ? 'el admin' : null),
    personas: lista,
    porCobrar: lista.reduce((total, p) => sumarPares(total, loQueSeDebe(p.hoy)), zeroPair()),
  }
}
