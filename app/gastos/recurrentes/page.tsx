import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ChipMoneda, Monto } from '@/components/dinero/monto'
import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { mesActualCR, nombreDeMes } from '@/lib/fechas'
import { fromDecimal } from '@/lib/money'

import { BotonTerminar } from './terminar'

export default async function RecurrentesPage() {
  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') notFound()

  const { supabase } = await requireUser()

  const [{ data: plantillas }, { data: listas }] = await Promise.all([
    supabase
      .from('recurring_templates')
      .select('id, list_id, name, amount, currency, first_charge_month, last_charge_month')
      .eq('house_id', activa.id)
      .order('name'),
    supabase.from('expense_lists').select('id, name').eq('house_id', activa.id),
  ])

  const nombreLista = new Map((listas ?? []).map((l) => [l.id, l.name]))
  const mesActual = mesActualCR()

  const vigentes = (plantillas ?? []).filter(
    (t) => t.last_charge_month === null || t.last_charge_month >= mesActual,
  )
  const terminados = (plantillas ?? []).filter(
    (t) => t.last_charge_month !== null && t.last_charge_month < mesActual,
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/gastos">Volver</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Gastos recurrentes</h1>
        <p className="text-tinta-suave text-base">
          Se cargan solos al abrir cada mes. Terminar uno lo cobra este mes y después deja
          de aparecer.
        </p>
      </header>

      {(plantillas ?? []).length === 0 ? (
        <section className="border-borde-suave flex flex-col gap-4 rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta text-base font-semibold">Todavía no hay ninguno</h2>
          <p className="text-tinta-suave text-base">
            Cuando agregues un gasto, marcá «Es recurrente» y se va a cobrar todos los
            meses.
          </p>
          <Link
            href="/gastos/nuevo"
            className="min-h-touch bg-crc flex items-center justify-center rounded-2xl px-5
                       text-base font-semibold text-white"
          >
            Agregar gasto
          </Link>
        </section>
      ) : null}

      {vigentes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
            Vigentes
          </h2>
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {vigentes.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 p-4">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-tinta text-base font-medium">{t.name}</span>
                  <span className="flex items-center gap-2">
                    <Monto monto={fromDecimal(t.amount, t.currency)} />
                    <ChipMoneda moneda={t.currency} />
                  </span>
                  <span className="text-tinta-suave text-sm">
                    {nombreLista.get(t.list_id) ?? '—'} ·{' '}
                    {t.last_charge_month
                      ? `último cobro ${nombreDeMes(t.last_charge_month)}`
                      : 'sin fecha final'}
                  </span>
                </span>
                <BotonTerminar plantillaId={t.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {terminados.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
            Ya terminados
          </h2>
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {terminados.map((t) => (
              <li key={t.id} className="flex flex-col gap-1 p-4">
                <span className="text-tinta-suave text-base">{t.name}</span>
                <span className="text-tinta-suave text-sm">
                  Se cobró por última vez en{' '}
                  {t.last_charge_month ? nombreDeMes(t.last_charge_month) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
