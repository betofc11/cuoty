import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ChipMoneda, Monto } from '@/components/dinero/monto'
import { Alert } from '@/components/ui/alert'
import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { diaYMes } from '@/lib/fechas'
import { fromDecimal } from '@/lib/money'

export default async function GastoPage({
  params,
}: {
  params: Promise<{ gastoId: string }>
}) {
  const { gastoId } = await params
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: gasto } = await supabase
    .from('expenses')
    .select('id, house_id, list_id, name, amount, currency, charge_date, voided_at')
    .eq('id', gastoId)
    .maybeSingle()

  if (!gasto || gasto.house_id !== activa.id) notFound()

  const [{ data: lista }, { data: asientos }] = await Promise.all([
    supabase.from('expense_lists').select('name').eq('id', gasto.list_id).maybeSingle(),
    supabase
      .from('ledger_entries')
      .select('membership_id, amount, percent_applied')
      .eq('expense_id', gasto.id),
  ])

  const { data: membresias } = await supabase
    .from('memberships')
    .select('id, user_id')
    .eq('house_id', activa.id)

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', (membresias ?? []).map((m) => m.user_id))

  const nombrePorUsuario = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))
  const usuarioPorMembresia = new Map((membresias ?? []).map((m) => [m.id, m.user_id]))

  const porMiembro = new Map<string, { total: number; percent: number | null }>()
  for (const a of asientos ?? []) {
    const previo = porMiembro.get(a.membership_id) ?? { total: 0, percent: null }
    porMiembro.set(a.membership_id, {
      total: previo.total + Number(a.amount),
      percent: a.percent_applied !== null ? Number(a.percent_applied) : previo.percent,
    })
  }

  const mio = porMiembro.get(activa.membershipId)
  const esAdmin = activa.rol === 'admin'
  const anulado = gasto.voided_at !== null

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/gastos">Volver</BackLink>

      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-tinta text-xl font-semibold">{gasto.name}</h1>
          {esAdmin && !anulado ? (
            <Link
              href={`/gastos/${gasto.id}/editar`}
              className="min-h-touch text-crc flex shrink-0 items-center px-2 text-base font-semibold"
            >
              Editar
            </Link>
          ) : null}
        </div>

        <span className="flex items-center gap-2">
          <Monto monto={fromDecimal(gasto.amount, gasto.currency)} tamano="grande" />
          <ChipMoneda moneda={gasto.currency} />
        </span>

        <p className="text-tinta-suave text-base">
          Lista {lista?.name ?? '—'}
          {gasto.charge_date && esAdmin ? ` · se cobra el ${diaYMes(gasto.charge_date)}` : ''}
        </p>
      </header>

      {anulado ? (
        <Alert tono="aviso">
          Este gasto está anulado. Sus cargos se revirtieron y quedaron anotados.
        </Alert>
      ) : null}

      <section className="border-borde bg-superficie flex flex-col gap-2 rounded-2xl border p-5">
        <span className="text-tinta-suave text-sm">
          Mi parte{mio?.percent !== null && mio?.percent !== undefined ? ` · ${mio.percent}%` : ''}
        </span>
        <Monto
          monto={fromDecimal(mio?.total ?? 0, gasto.currency)}
          tamano="grande"
        />
        <p className="text-tinta-suave text-sm">
          Este monto ya está sumado a tu cargo del mes. Los abonos se hacen contra el
          saldo, no contra un gasto suelto.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Cómo se reparte
        </h2>
        <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
          {(membresias ?? []).map((m) => {
            const dato = porMiembro.get(m.id)
            if (!dato || dato.total === 0) return null
            const usuario = usuarioPorMembresia.get(m.id)
            const nombre = usuario ? (nombrePorUsuario.get(usuario) ?? 'Sin nombre') : 'Sin nombre'

            return (
              <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                <span className="text-tinta text-base">
                  {nombre}
                  {m.id === activa.membershipId ? ' (vos)' : ''}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-tinta-suave text-sm">
                    {dato.percent !== null ? `${dato.percent}%` : ''}
                  </span>
                  <Monto monto={fromDecimal(dato.total, gasto.currency)} />
                </span>
              </li>
            )
          })}
        </ul>
        <p className="text-tinta-suave text-sm">
          Este gasto no se paga por separado: su monto ya está sumado al cargo del mes de
          cada quien.
        </p>
      </section>
    </div>
  )
}
