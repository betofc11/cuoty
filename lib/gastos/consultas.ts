import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
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
}

export type ArrastreVista = {
  periodoId: string
  mes: string
  /** Cuántos DEBEN, no cuántos viven en la casa. */
  miembros: number
  monto: MoneyPair
}

export type VistaDeGastos = {
  periodo: PeriodoVista
  periodos: PeriodoVista[]
  listas: ListaVista[]
  miCargo: MoneyPair
  arrastres: ArrastreVista[]
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
    .select('id, month, status, closed_at')
    .eq('house_id', activa.id)
    .order('month', { ascending: false })

  if (errorPeriodos) throw new Error(errorPeriodos.message)

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

  const listas: ListaVista[] = (filasListas ?? []).map((l) => ({
    id: l.id,
    nombre: l.name,
    gastos: gastosPorLista.get(l.id) ?? [],
    miSubtotal: subtotalPorLista.get(l.id) ?? zeroPair(),
  }))

  // ── Arrastre: foto congelada de lo que quedó en meses ya cerrados ──
  const cerradosPrevios = periodos.filter(
    (p) => p.estado === 'closed' && p.mes < periodo.mes,
  )

  const arrastres: ArrastreVista[] = []

  if (cerradosPrevios.length > 0) {
    const { data: filasArrastre } = await supabase
      .from('period_carryovers')
      .select('period_id, membership_id, currency, amount')
      .in(
        'period_id',
        cerradosPrevios.map((p) => p.id),
      )

    const porPeriodo = new Map<string, { par: MoneyPair; miembros: Set<string> }>()

    for (const fila of filasArrastre ?? []) {
      const monto = Number(fila.amount)
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

    for (const p of cerradosPrevios) {
      const dato = porPeriodo.get(p.id)
      if (!dato) continue
      arrastres.push({
        periodoId: p.id,
        mes: p.mes,
        miembros: dato.miembros.size,
        monto: dato.par,
      })
    }
  }

  return { periodo, periodos, listas, miCargo, arrastres }
}
