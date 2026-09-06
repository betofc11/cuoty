import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { addToPair as sumarEnPar, zeroPair, type MoneyPair } from '@/lib/money'

export type MiembroReparto = {
  membershipId: string
  nombre: string
  esAdminDelResiduo: boolean
  percent: number
  /** Lo que ya se le cargó de esta lista en los meses abiertos. */
  cargoActual: MoneyPair
}

export type VistaPorcentajes = {
  lista: { id: string; nombre: string }
  miembros: MiembroReparto[]
  /** Suma de los gastos de la lista en los meses abiertos, por moneda. */
  totalAbierto: MoneyPair
  mesesAbiertos: string[]
}

export async function vistaDePorcentajes(listaId: string): Promise<VistaPorcentajes | null> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: lista } = await supabase
    .from('expense_lists')
    .select('id, name, house_id')
    .eq('id', listaId)
    .maybeSingle()

  // RLS ya lo taparía, pero no dejamos que una lista de otra casa se cuele.
  if (!lista || lista.house_id !== activa.id) return null

  const [{ data: membresias }, { data: repartos }, { data: periodosAbiertos }] =
    await Promise.all([
      supabase
        .from('memberships')
        .select('id, user_id, role, joined_at')
        .eq('house_id', activa.id)
        .is('left_at', null)
        .order('joined_at'),
      supabase.from('list_shares').select('membership_id, percent').eq('list_id', listaId),
      supabase
        .from('periods')
        .select('id, month')
        .eq('house_id', activa.id)
        .eq('status', 'open')
        .order('month'),
    ])

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', (membresias ?? []).map((m) => m.user_id))

  const nombrePorUsuario = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))
  const porcentajePorMiembro = new Map(
    (repartos ?? []).map((r) => [r.membership_id, Number(r.percent)]),
  )

  const idsAbiertos = (periodosAbiertos ?? []).map((p) => p.id)

  let totalAbierto = zeroPair()
  const cargoPorMiembro = new Map<string, MoneyPair>()

  if (idsAbiertos.length > 0) {
    const [{ data: gastos }, { data: asientos }] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, amount, currency')
        .eq('list_id', listaId)
        .is('voided_at', null)
        .in('period_id', idsAbiertos),
      supabase
        .from('ledger_entries')
        .select('membership_id, amount, currency')
        .eq('list_id', listaId)
        .in('period_id', idsAbiertos),
    ])

    for (const g of gastos ?? []) {
      totalAbierto = sumarEnPar(totalAbierto, Number(g.amount), g.currency)
    }

    for (const a of asientos ?? []) {
      cargoPorMiembro.set(
        a.membership_id,
        sumarEnPar(cargoPorMiembro.get(a.membership_id) ?? zeroPair(), Number(a.amount), a.currency),
      )
    }
  }

  // Determinista: el residuo del redondeo lo absorbe el admin activo más antiguo.
  const adminResiduo = (membresias ?? []).find((m) => m.role === 'admin')?.id ?? null

  const miembros: MiembroReparto[] = (membresias ?? []).map((m) => ({
    membershipId: m.id,
    nombre: nombrePorUsuario.get(m.user_id) || 'Sin nombre',
    esAdminDelResiduo: m.id === adminResiduo,
    percent: porcentajePorMiembro.get(m.id) ?? 0,
    cargoActual: cargoPorMiembro.get(m.id) ?? zeroPair(),
  }))

  return {
    lista: { id: lista.id, nombre: lista.name },
    miembros,
    totalAbierto,
    mesesAbiertos: (periodosAbiertos ?? []).map((p) => p.month),
  }
}
