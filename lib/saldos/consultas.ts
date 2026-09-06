import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import {
  addToPair,
  fromDecimal,
  zeroPair,
  type MoneyAny,
  type MoneyPair,
} from '@/lib/money'

export type SaldoMiembro = {
  membershipId: string
  nombre: string
  esYo: boolean
  /** Cargos y ajustes, sobre todos los períodos con saldo vivo. */
  cargo: MoneyPair
  /** Abonos ya aplicados. */
  abonado: MoneyPair
  /** cargo − abonado. Negativo = a favor. */
  saldo: MoneyPair
}

export type SaldoPorMes = {
  periodoId: string
  mes: string
  estado: 'open' | 'closed'
  saldo: MoneyPair
}

export type Movimiento = {
  id: string
  clase: 'cargo' | 'ajuste' | 'abono' | 'reverso' | 'devolucion'
  fecha: string
  titulo: string
  detalle: string
  monto: MoneyAny
  /** Los abonos bajan el saldo; los cargos lo suben. */
  reduce: boolean
}

/**
 * Saldos de la casa. RLS decide el alcance sola: el admin ve a todos, el
 * miembro solo se ve a sí mismo — no hay ningún `if` de rol acá.
 */
export async function saldosDeLaCasa(): Promise<SaldoMiembro[]> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: filas, error } = await supabase
    .from('membership_balances')
    .select('membership_id, user_id, currency, balance')
    .eq('house_id', activa.id)

  if (error) throw new Error(error.message)

  const ids = [...new Set((filas ?? []).flatMap((f) => (f.membership_id ? [f.membership_id] : [])))]
  if (ids.length === 0) return []

  const [{ data: membresias }, { data: cargos }, { data: abonos }] = await Promise.all([
    supabase.from('memberships').select('id, user_id, joined_at').in('id', ids),
    supabase.from('ledger_entries').select('membership_id, amount, currency').in('membership_id', ids),
    supabase
      .from('payment_allocations')
      .select('membership_id, amount, currency')
      .in('membership_id', ids),
  ])

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', (membresias ?? []).map((m) => m.user_id))

  const nombrePorUsuario = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))

  const porCargo = new Map<string, MoneyPair>()
  for (const c of cargos ?? []) {
    porCargo.set(
      c.membership_id,
      addToPair(porCargo.get(c.membership_id) ?? zeroPair(), Number(c.amount), c.currency),
    )
  }

  const porAbono = new Map<string, MoneyPair>()
  for (const a of abonos ?? []) {
    porAbono.set(
      a.membership_id,
      addToPair(porAbono.get(a.membership_id) ?? zeroPair(), Number(a.amount), a.currency),
    )
  }

  const porSaldo = new Map<string, MoneyPair>()
  for (const f of filas ?? []) {
    if (!f.membership_id || !f.currency) continue
    porSaldo.set(
      f.membership_id,
      addToPair(porSaldo.get(f.membership_id) ?? zeroPair(), Number(f.balance ?? 0), f.currency),
    )
  }

  return (membresias ?? [])
    .map((m) => ({
      membershipId: m.id,
      nombre: nombrePorUsuario.get(m.user_id) || 'Sin nombre',
      esYo: m.id === activa.membershipId,
      cargo: porCargo.get(m.id) ?? zeroPair(),
      abonado: porAbono.get(m.id) ?? zeroPair(),
      saldo: porSaldo.get(m.id) ?? zeroPair(),
      joined: m.joined_at,
    }))
    .sort((a, b) => a.joined.localeCompare(b.joined))
    .map(({ joined: _joined, ...resto }) => resto)
}

export type DetalleDeSaldo = {
  membershipId: string
  nombre: string
  esYo: boolean
  cargo: MoneyPair
  abonado: MoneyPair
  saldo: MoneyPair
  porMes: SaldoPorMes[]
  movimientos: Movimiento[]
}

export async function detalleDeSaldo(membershipId: string): Promise<DetalleDeSaldo | null> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const saldos = await saldosDeLaCasa()
  const base = saldos.find((s) => s.membershipId === membershipId)
  // Si RLS no lo devolvió, no le corresponde verlo.
  if (!base) return null

  const [{ data: porMesFilas }, { data: asientos }, { data: pagos }] = await Promise.all([
    supabase
      .from('period_balances')
      .select('period_id, month, status, currency, balance')
      .eq('membership_id', membershipId)
      .eq('house_id', activa.id),
    supabase
      .from('ledger_entries')
      .select('id, amount, currency, kind, description, created_at, created_by')
      .eq('membership_id', membershipId)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('id, amount, currency, kind, method, note, recorded_at, recorded_by')
      .eq('membership_id', membershipId)
      .order('recorded_at', { ascending: false }),
  ])

  const autores = [
    ...new Set([
      ...(asientos ?? []).flatMap((a) => (a.created_by ? [a.created_by] : [])),
      ...(pagos ?? []).map((p) => p.recorded_by),
    ]),
  ]

  const { data: perfilesAutores } = autores.length
    ? await supabase.from('profiles').select('id, display_name').in('id', autores)
    : { data: [] }

  const nombreAutor = new Map((perfilesAutores ?? []).map((p) => [p.id, p.display_name]))

  const porMesMapa = new Map<string, SaldoPorMes>()
  for (const f of porMesFilas ?? []) {
    if (!f.period_id || !f.currency || !f.month || !f.status) continue
    const previo = porMesMapa.get(f.period_id) ?? {
      periodoId: f.period_id,
      mes: f.month,
      estado: f.status,
      saldo: zeroPair(),
    }
    porMesMapa.set(f.period_id, {
      ...previo,
      saldo: addToPair(previo.saldo, Number(f.balance ?? 0), f.currency),
    })
  }

  const movimientos: Movimiento[] = [
    ...(asientos ?? []).map((a) => ({
      id: `l-${a.id}`,
      clase: (a.kind === 'charge' ? 'cargo' : 'ajuste') as Movimiento['clase'],
      fecha: a.created_at,
      titulo: a.description,
      detalle: a.created_by ? `registrado por ${nombreAutor.get(a.created_by) ?? '—'}` : '',
      monto: fromDecimal(a.amount, a.currency),
      reduce: false,
    })),
    ...(pagos ?? []).map((p) => ({
      id: `p-${p.id}`,
      clase: (p.kind === 'reversal'
        ? 'reverso'
        : p.kind === 'refund'
          ? 'devolucion'
          : 'abono') as Movimiento['clase'],
      fecha: p.recorded_at,
      titulo: p.kind === 'reversal'
        ? 'Reverso de abono'
        : p.kind === 'refund'
          ? 'Devolución'
          : `Abono${p.method ? ` · ${p.method}` : ''}`,
      // Invariante 4: el miembro siempre ve quién se lo registró.
      detalle: `registrado por ${nombreAutor.get(p.recorded_by) ?? '—'}`,
      monto: fromDecimal(p.amount, p.currency),
      reduce: p.kind !== 'refund',
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return {
    ...base,
    porMes: [...porMesMapa.values()]
      .filter((m) => m.saldo.CRC.minor !== 0 || m.saldo.USD.minor !== 0)
      .sort((a, b) => a.mes.localeCompare(b.mes)),
    movimientos,
  }
}
