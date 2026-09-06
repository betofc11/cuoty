import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { mesSiguiente } from '@/lib/fechas'
import { addToPair, zeroPair, type MoneyPair } from '@/lib/money'

export type RemanenteMiembro = {
  membershipId: string
  nombre: string
  saldo: MoneyPair
}

export type VistaCierre = {
  periodoId: string
  mes: string
  mesSiguiente: string
  /** Solo quienes NO están en cero. Los demás quedan al día. */
  remanentes: RemanenteMiembro[]
  alDia: string[]
  gastosDelMes: MoneyPair
  abonosDelMes: MoneyPair
  recurrentesVigentes: number
  recurrentesTotales: number
}

export async function vistaDeCierre(mesPedido: string): Promise<VistaCierre | null> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: periodo } = await supabase
    .from('periods')
    .select('id, month, status')
    .eq('house_id', activa.id)
    .eq('status', 'open')
    // `month` es date y siempre cae en día 1: comparación exacta, no LIKE
    // —que sobre una fecha no matchea nada.
    .eq('month', `${mesPedido}-01`)
    .maybeSingle()

  if (!periodo) return null

  const siguiente = mesSiguiente(periodo.month)

  const [{ data: balances }, { data: gastos }, { data: abonos }, { data: plantillas }] =
    await Promise.all([
      supabase
        .from('period_balances')
        .select('membership_id, currency, balance')
        .eq('period_id', periodo.id),
      supabase
        .from('expenses')
        .select('amount, currency')
        .eq('period_id', periodo.id)
        .is('voided_at', null),
      supabase
        .from('payment_allocations')
        .select('amount, currency')
        .eq('period_id', periodo.id),
      supabase
        .from('recurring_templates')
        .select('id, first_charge_month, last_charge_month')
        .eq('house_id', activa.id),
    ])

  const porMiembro = new Map<string, MoneyPair>()
  for (const b of balances ?? []) {
    if (!b.membership_id || !b.currency) continue
    porMiembro.set(
      b.membership_id,
      addToPair(porMiembro.get(b.membership_id) ?? zeroPair(), Number(b.balance ?? 0), b.currency),
    )
  }

  const ids = [...porMiembro.keys()]
  const { data: membresias } = ids.length
    ? await supabase.from('memberships').select('id, user_id, joined_at').in('id', ids)
    : { data: [] }

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', (membresias ?? []).map((m) => m.user_id))

  const nombrePorUsuario = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))

  const remanentes: RemanenteMiembro[] = []
  const alDia: string[] = []

  for (const m of (membresias ?? []).sort((a, b) => a.joined_at.localeCompare(b.joined_at))) {
    const saldo = porMiembro.get(m.id) ?? zeroPair()
    const nombre = nombrePorUsuario.get(m.user_id) || 'Sin nombre'
    if (saldo.CRC.minor === 0 && saldo.USD.minor === 0) alDia.push(nombre)
    else remanentes.push({ membershipId: m.id, nombre, saldo })
  }

  let gastosDelMes = zeroPair()
  for (const g of gastos ?? []) gastosDelMes = addToPair(gastosDelMes, Number(g.amount), g.currency)

  let abonosDelMes = zeroPair()
  for (const a of abonos ?? []) abonosDelMes = addToPair(abonosDelMes, Number(a.amount), a.currency)

  const vigentes = (plantillas ?? []).filter(
    (t) =>
      t.first_charge_month <= siguiente &&
      (t.last_charge_month === null || t.last_charge_month >= siguiente),
  ).length

  return {
    periodoId: periodo.id,
    mes: periodo.month,
    mesSiguiente: siguiente,
    remanentes,
    alDia,
    gastosDelMes,
    abonosDelMes,
    recurrentesVigentes: vigentes,
    recurrentesTotales: (plantillas ?? []).length,
  }
}
