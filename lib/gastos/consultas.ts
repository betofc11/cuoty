import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { personasDeLaCasa, type ParteDelReparto } from '@/lib/casas/personas'
import {
  addToPair as sumarEnPar,
  fromDecimal,
  zeroPair,
  type CurrencyCode,
  type MoneyAny,
  type MoneyPair,
} from '@/lib/money'

export type PeriodoVista = {
  id: string
  mes: string
  estado: 'open' | 'closed'
  cerradoEl: string | null
}

export type CierreVista = { cerradoEl: string; cerradoPor: string }

export type GastoVista = {
  id: string
  nombre: string
  monto: MoneyAny
  moneda: CurrencyCode
  fechaCobro: string | null
  /** Congelado en el asiento: en un mes cerrado sigue mostrando el % de entonces. */
  miPorcentaje: number | null
  miCargo: MoneyAny
}

export type ListaVista = {
  id: string
  nombre: string
  gastos: GastoVista[]
  miSubtotal: MoneyPair
  /**
   * Los porcentajes vigentes de la lista (`list_shares`), en el orden de la casa.
   * Vacío en un mes cerrado: los de ahora pueden no ser los que se aplicaron.
   */
  reparto: ParteDelReparto[]
}

export type ArrastreVista = {
  periodoId: string
  mes: string
  /** Cuántos DEBEN, no cuántos viven en la casa. */
  miembros: number
  /** Lo que sigue vivo HOY, no lo que quedó al cerrar. */
  monto: MoneyPair
  /**
   * La foto de `period_carryovers`, y solo cuando ya no coincide con el saldo
   * vivo — o sea, cuando alguien abonó después del cierre. `null` si son iguales.
   */
  alCerrar: MoneyPair | null
}

export type VistaDeGastos = {
  periodo: PeriodoVista
  periodos: PeriodoVista[]
  listas: ListaVista[]
  miCargo: MoneyPair
  arrastres: ArrastreVista[]
  /** Quién cerró este mes y cuándo. Solo si está cerrado. */
  cierre: CierreVista | null
}

/**
 * Todo lo que necesita la pantalla de Gastos para un mes.
 * `mesPedido` viene de la URL (`2026-08`). Sin él se usa el período más nuevo.
 */
export async function vistaDeGastos(mesPedido?: string): Promise<VistaDeGastos> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  // Abre el mes en curso si todavía no existe. Los períodos se crean solos.
  await supabase.rpc('ensure_current_period', { p_house_id: activa.id })

  const { data: filasPeriodos, error: errorPeriodos } = await supabase
    .from('periods')
    .select('id, month, status, closed_at, closed_by')
    .eq('house_id', activa.id)
    .order('month', { ascending: false })

  if (errorPeriodos) throw new Error(errorPeriodos.message)

  const cerradoPorId = new Map(
    (filasPeriodos ?? []).map((p) => [p.id, p.closed_by] as const),
  )

  const periodos: PeriodoVista[] = (filasPeriodos ?? []).map((p) => ({
    id: p.id,
    mes: p.month,
    estado: p.status,
    cerradoEl: p.closed_at,
  }))

  const primero = periodos[0]
  if (!primero) throw new Error('La casa no tiene ningún mes abierto.')

  const periodo =
    (mesPedido ? periodos.find((p) => p.mes.startsWith(mesPedido)) : null) ?? primero

  const [{ data: filasListas }, { data: filasGastos }, { data: filasLedger }] =
    await Promise.all([
      supabase
        .from('expense_lists')
        .select('id, name, position')
        .eq('house_id', activa.id)
        .is('archived_at', null)
        .order('position'),
      supabase
        .from('expenses')
        .select('id, list_id, name, amount, currency, charge_date')
        .eq('period_id', periodo.id)
        .is('voided_at', null)
        .order('created_at'),
      // RLS deja ver el ledger de TODA la casa: sin este filtro se mezclan los
      // cargos de los demás con los míos.
      supabase
        .from('ledger_entries')
        .select('expense_id, currency, amount, percent_applied')
        .eq('period_id', periodo.id)
        .eq('membership_id', activa.membershipId),
    ])

  const cargoPorGasto = new Map<string, number>()
  const porcentajePorGasto = new Map<string, number>()

  for (const asiento of filasLedger ?? []) {
    if (!asiento.expense_id) continue
    cargoPorGasto.set(
      asiento.expense_id,
      (cargoPorGasto.get(asiento.expense_id) ?? 0) + Number(asiento.amount),
    )
    if (asiento.percent_applied !== null) {
      porcentajePorGasto.set(asiento.expense_id, Number(asiento.percent_applied))
    }
  }

  const gastosPorLista = new Map<string, GastoVista[]>()
  const subtotalPorLista = new Map<string, MoneyPair>()
  let miCargo = zeroPair()

  for (const g of filasGastos ?? []) {
    const moneda = g.currency
    const cargo = cargoPorGasto.get(g.id) ?? 0

    const vista: GastoVista = {
      id: g.id,
      nombre: g.name,
      monto: fromDecimal(g.amount, moneda),
      moneda,
      fechaCobro: g.charge_date,
      miPorcentaje: porcentajePorGasto.get(g.id) ?? null,
      miCargo: fromDecimal(cargo, moneda),
    }

    gastosPorLista.set(g.list_id, [...(gastosPorLista.get(g.list_id) ?? []), vista])
    subtotalPorLista.set(
      g.list_id,
      sumarEnPar(subtotalPorLista.get(g.list_id) ?? zeroPair(), cargo, moneda),
    )
    miCargo = sumarEnPar(miCargo, cargo, moneda)
  }

  // El reparto vigente, solo en un mes abierto. RLS deja leer `list_shares` a
  // cualquier miembro de la casa: el porcentaje de cada quien no es secreto.
  const repartoPorLista = new Map<string, ParteDelReparto[]>()

  if (periodo.estado === 'open' && (filasListas ?? []).length > 0) {
    const [{ data: filasRepartos }, personas] = await Promise.all([
      supabase
        .from('list_shares')
        .select('list_id, membership_id, percent')
        .in('list_id', (filasListas ?? []).map((l) => l.id)),
      personasDeLaCasa(),
    ])

    const porcentaje = new Map(
      (filasRepartos ?? []).map((r) => [`${r.list_id}:${r.membership_id}`, Number(r.percent)]),
    )

    for (const l of filasListas ?? []) {
      // Recorre las personas en el orden de la casa y no el de `list_shares`:
      // así la leyenda de todas las listas sale en el mismo orden.
      const partes: ParteDelReparto[] = []
      for (const [membershipId, persona] of personas) {
        const percent = porcentaje.get(`${l.id}:${membershipId}`) ?? 0
        if (percent > 0) {
          partes.push({ membershipId, nombre: persona.nombre, tono: persona.tono, percent })
        }
      }
      repartoPorLista.set(l.id, partes)
    }
  }

  const listas: ListaVista[] = (filasListas ?? []).map((l) => ({
    id: l.id,
    nombre: l.name,
    gastos: gastosPorLista.get(l.id) ?? [],
    miSubtotal: subtotalPorLista.get(l.id) ?? zeroPair(),
    reparto: repartoPorLista.get(l.id) ?? [],
  }))

  // ── Arrastre: lo que sigue vivo de meses ya cerrados ──
  const cerradosPrevios = periodos.filter(
    (p) => p.estado === 'closed' && p.mes < periodo.mes,
  )

  const arrastres: ArrastreVista[] = []

  if (cerradosPrevios.length > 0) {
    const idsPrevios = cerradosPrevios.map((p) => p.id)

    const [{ data: filasSaldo }, { data: filasFoto }] = await Promise.all([
      // Cerrado congela los gastos y los porcentajes, NO los abonos: un mes
      // cerrado sigue recibiendo plata. Por eso el monto sale del saldo vivo y
      // no de `period_carryovers` —esa foto se queda vieja apenas alguien abona,
      // y decía «debe ₡16.604» de un mes ya saldado.
      supabase
        .from('period_balances')
        .select('period_id, membership_id, currency, balance')
        .in('period_id', idsPrevios),
      // La foto sí, pero solo para contrastarla abajo.
      supabase
        .from('period_carryovers')
        .select('period_id, currency, amount')
        .in('period_id', idsPrevios),
    ])

    const porPeriodo = new Map<string, { par: MoneyPair; miembros: Set<string> }>()

    for (const fila of filasSaldo ?? []) {
      // `period_balances` es una vista: sus columnas llegan nullable al tipo.
      if (!fila.period_id || !fila.membership_id || !fila.currency) continue
      const monto = Number(fila.balance)
      if (monto === 0) continue
      const actual = porPeriodo.get(fila.period_id) ?? {
        par: zeroPair(),
        miembros: new Set<string>(),
      }
      porPeriodo.set(fila.period_id, {
        par: sumarEnPar(actual.par, monto, fila.currency),
        miembros: actual.miembros.add(fila.membership_id),
      })
    }

    const fotoPorPeriodo = new Map<string, MoneyPair>()

    for (const fila of filasFoto ?? []) {
      fotoPorPeriodo.set(
        fila.period_id,
        sumarEnPar(
          fotoPorPeriodo.get(fila.period_id) ?? zeroPair(),
          Number(fila.amount),
          fila.currency,
        ),
      )
    }

    for (const p of cerradosPrevios) {
      // Sin saldo vivo no hay nada que cobrar: el mes quedó saldado y la
      // tarjeta desaparece sola.
      const dato = porPeriodo.get(p.id)
      if (!dato) continue

      const foto = fotoPorPeriodo.get(p.id) ?? zeroPair()
      const abonaronDespues =
        foto.CRC.minor !== dato.par.CRC.minor || foto.USD.minor !== dato.par.USD.minor

      arrastres.push({
        periodoId: p.id,
        mes: p.mes,
        miembros: dato.miembros.size,
        monto: dato.par,
        alCerrar: abonaronDespues ? foto : null,
      })
    }
  }

  // Quién cerró el mes: es parte del mismo mecanismo de confianza que el
  // historial de abonos — un acto del admin que el miembro puede ver.
  let cierre: CierreVista | null = null
  const autorCierre = cerradoPorId.get(periodo.id)

  if (periodo.estado === 'closed' && periodo.cerradoEl && autorCierre) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', autorCierre)
      .maybeSingle()

    cierre = {
      cerradoEl: periodo.cerradoEl,
      cerradoPor: perfil?.display_name || 'el admin',
    }
  }

  return { periodo, periodos, listas, miCargo, arrastres, cierre }
}
