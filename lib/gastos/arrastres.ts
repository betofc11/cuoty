import { cache } from 'react'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { inicialDe, personasDeLaCasa, tonoDe } from '@/lib/casas/personas'
import { add, addToPair, isZero, money, zeroPair, type MoneyPair } from '@/lib/money'

export type DeudaDeArrastre = {
  membershipId: string
  nombre: string
  inicial: string
  tono: number
  esYo: boolean
  /** Lo que le queda HOY de ese mes. Negativo = a favor. */
  saldo: MoneyPair
}

export type MesConArrastre = {
  periodoId: string
  mes: string
  /** Quienes no están en cero, en el orden de la casa. */
  deudas: DeudaDeArrastre[]
  /** Solo lo que falta abonar: un saldo a favor no se resta de lo que deben los demás. */
  porCobrar: MoneyPair
  /**
   * La foto de `period_carryovers`, y solo cuando ya no coincide con el saldo
   * vivo — o sea, cuando alguien abonó después del cierre. `null` si son iguales.
   */
  alCerrar: MoneyPair | null
}

export type MesSaldado = {
  periodoId: string
  mes: string
  /** Lo que quedaba al cerrarlo, y que ya se abonó entero. */
  alCerrar: MoneyPair
}

export type VistaDeArrastres = {
  /** Meses cerrados con saldo vivo, del más viejo al más nuevo: el orden en que se abonan. */
  pendientes: MesConArrastre[]
  /** Meses que cerraron con saldo y ya quedaron en cero, del más nuevo al más viejo. */
  saldados: MesSaldado[]
  /** La suma de `porCobrar` de todos los pendientes, cada moneda por su lado. */
  porCobrar: MoneyPair
}

/** Cada moneda con la suya: `add` no deja cruzarlas (invariante 4). */
function sumarPares(a: MoneyPair, b: MoneyPair): MoneyPair {
  return { CRC: add(a.CRC, b.CRC), USD: add(a.USD, b.USD) }
}

/** Lo a favor no cuenta como deuda: queda en cero. */
function loQueSeDebe(par: MoneyPair): MoneyPair {
  return {
    CRC: money(Math.max(par.CRC.minor, 0), 'CRC'),
    USD: money(Math.max(par.USD.minor, 0), 'USD'),
  }
}

function hayPlata(par: MoneyPair): boolean {
  return !isZero(par.CRC) || !isZero(par.USD)
}

function iguales(a: MoneyPair, b: MoneyPair): boolean {
  return a.CRC.minor === b.CRC.minor && a.USD.minor === b.USD.minor
}

/**
 * El arrastre: lo que sigue vivo de los meses ya cerrados.
 *
 * Cerrado congela los gastos y los porcentajes, NO los abonos: un mes cerrado
 * sigue recibiendo plata. Por eso lo que se debe sale de `period_balances` y no
 * de `period_carryovers`, que es la foto del cierre y se queda vieja apenas
 * alguien abona (invariante 3). La foto se usa solo para contrastarla.
 *
 * RLS decide el alcance: el admin ve a toda la casa y el miembro solo lo suyo,
 * con la misma policy en las dos fuentes. `cache` porque Gastos y la pantalla
 * de arrastres pueden pedirlo en el mismo render.
 */
export const vistaDeArrastres = cache(async (): Promise<VistaDeArrastres> => {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: cerrados, error } = await supabase
    .from('periods')
    .select('id, month')
    .eq('house_id', activa.id)
    .eq('status', 'closed')
    .order('month')

  if (error) throw new Error(error.message)

  const vacia: VistaDeArrastres = { pendientes: [], saldados: [], porCobrar: zeroPair() }
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
      supabase
        .from('period_carryovers')
        .select('period_id, currency, amount')
        .in('period_id', ids),
      personasDeLaCasa(),
    ])

  if (errorSaldo) throw new Error(errorSaldo.message)

  const saldoPorPeriodo = new Map<string, Map<string, MoneyPair>>()

  for (const fila of filasSaldo ?? []) {
    // `period_balances` es una vista: sus columnas llegan nullable al tipo.
    if (!fila.period_id || !fila.membership_id || !fila.currency) continue
    const monto = Number(fila.balance ?? 0)
    if (monto === 0) continue

    const porPersona = saldoPorPeriodo.get(fila.period_id) ?? new Map<string, MoneyPair>()
    porPersona.set(
      fila.membership_id,
      addToPair(porPersona.get(fila.membership_id) ?? zeroPair(), monto, fila.currency),
    )
    saldoPorPeriodo.set(fila.period_id, porPersona)
  }

  const fotoPorPeriodo = new Map<string, MoneyPair>()

  for (const fila of filasFoto ?? []) {
    fotoPorPeriodo.set(
      fila.period_id,
      addToPair(fotoPorPeriodo.get(fila.period_id) ?? zeroPair(), Number(fila.amount), fila.currency),
    )
  }

  // El orden de la casa, el mismo de la leyenda de los repartos.
  const orden = [...personas.keys()]
  const posicion = (id: string) => {
    const i = orden.indexOf(id)
    return i === -1 ? orden.length : i
  }

  const pendientes: MesConArrastre[] = []
  const saldados: MesSaldado[] = []
  let porCobrar = zeroPair()

  for (const p of cerrados) {
    const foto = fotoPorPeriodo.get(p.id) ?? zeroPair()
    const porPersona = saldoPorPeriodo.get(p.id)

    if (!porPersona || porPersona.size === 0) {
      // `close_period` solo escribe fotos distintas de cero: con foto, el mes
      // cerró debiendo y ya se pagó. Sin foto, cerró al día y no es arrastre.
      if (hayPlata(foto)) saldados.push({ periodoId: p.id, mes: p.month, alCerrar: foto })
      continue
    }

    const deudas: DeudaDeArrastre[] = [...porPersona.entries()]
      .sort(([a], [b]) => posicion(a) - posicion(b))
      .map(([membershipId, saldo]) => {
        const nombre = personas.get(membershipId)?.nombre ?? 'Sin nombre'
        return {
          membershipId,
          nombre,
          inicial: inicialDe(nombre),
          tono: tonoDe(personas, membershipId),
          esYo: membershipId === activa.membershipId,
          saldo,
        }
      })

    const vivo = deudas.reduce((total, d) => sumarPares(total, d.saldo), zeroPair())
    const delMes = deudas.reduce((total, d) => sumarPares(total, loQueSeDebe(d.saldo)), zeroPair())

    porCobrar = sumarPares(porCobrar, delMes)

    pendientes.push({
      periodoId: p.id,
      mes: p.month,
      deudas,
      porCobrar: delMes,
      // La foto es neta (a favor incluido), así que se compara contra el neto.
      alCerrar: iguales(foto, vivo) ? null : foto,
    })
  }

  return { pendientes, saldados: saldados.reverse(), porCobrar }
})
