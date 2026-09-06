import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SaldoPar } from '@/components/dinero/saldo'
import { BackLink } from '@/components/ui/back-link'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import { fechaCorta, nombreDeMes } from '@/lib/fechas'
import { formatMoney, isZero } from '@/lib/money'
import { detalleDeSaldo } from '@/lib/saldos/consultas'

export default async function SaldoDeMiembroPage({
  params,
}: {
  params: Promise<{ membershipId: string }>
}) {
  const { membershipId } = await params
  const { activa } = await contextoDeCasa()
  const detalle = await detalleDeSaldo(membershipId)

  if (!detalle) notFound()

  const esAdmin = activa.rol === 'admin'
  const alDia = isZero(detalle.saldo.CRC) && isZero(detalle.saldo.USD)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/saldos">Volver</BackLink>
      <OfflineBanner />

      <header className="flex flex-col gap-3">
        <h1 className="text-tinta text-xl font-semibold">
          {detalle.esYo ? 'Mi saldo' : `Saldo de ${detalle.nombre}`}
        </h1>
        <span className="text-tinta-suave text-sm">
          {alDia ? 'Sin nada pendiente' : 'Le queda por abonar'}
        </span>
        <SaldoPar par={detalle.saldo} />

        <div className="flex flex-col gap-1">
          {!isZero(detalle.cargo.CRC) ? (
            <span className="text-tinta-suave text-sm">
              Colones · abonado {formatMoney(detalle.abonado.CRC)} de{' '}
              {formatMoney(detalle.cargo.CRC)}
            </span>
          ) : null}
          {!isZero(detalle.cargo.USD) ? (
            <span className="text-tinta-suave text-sm">
              Dólares · abonado {formatMoney(detalle.abonado.USD)} de{' '}
              {formatMoney(detalle.cargo.USD)}
            </span>
          ) : null}
        </div>
      </header>

      {detalle.porMes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
            Desglose por mes
          </h2>
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {detalle.porMes.map((m) => (
              <li key={m.periodoId} className="flex items-center justify-between gap-3 p-4">
                <span className="flex flex-col">
                  <span className="text-tinta text-base">{nombreDeMes(m.mes)}</span>
                  <span className="text-tinta-suave text-sm">
                    {m.estado === 'closed' ? 'Cerrado · arrastre' : 'Abierto'}
                  </span>
                </span>
                <SaldoPar par={m.saldo} tamano="normal" />
              </li>
            ))}
          </ul>
          <p className="text-tinta-suave text-sm">
            Los abonos se registran sobre el saldo total, no sobre un mes. Se aplican del
            mes más viejo al más nuevo.
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Movimientos
        </h2>

        {detalle.movimientos.length === 0 ? (
          <p className="border-borde-suave text-tinta-suave rounded-2xl border border-dashed p-5 text-base">
            Todavía no hay movimientos.
          </p>
        ) : (
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {detalle.movimientos.map((mov) => (
              <li key={mov.id} className="flex items-start justify-between gap-3 p-4">
                <span className="flex min-w-0 flex-col">
                  <span className="text-tinta text-base">{mov.titulo}</span>
                  <span className="text-tinta-suave text-sm">
                    {fechaCorta(mov.fecha)}
                    {mov.detalle ? ` · ${mov.detalle}` : ''}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-base font-semibold ${
                    mov.reduce ? 'text-ok' : mov.monto.currency === 'CRC' ? 'text-crc' : 'text-usd'
                  }`}
                >
                  {mov.reduce ? '+' : ''}
                  {formatMoney(mov.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-tinta-suave text-sm">
          El «+» marca lo que se te acreditó. Los cargos suman al saldo; los abonos lo
          bajan.
        </p>
      </section>

      {/* Invariante 3: el miembro no tiene ninguna acción de pago. */}
      {esAdmin && !alDia ? (
        <Link
          href={`/saldos/${detalle.membershipId}/abonar`}
          className="min-h-touch bg-crc flex items-center justify-center rounded-2xl px-5
                     text-base font-semibold text-white"
        >
          Registrar {detalle.movimientos.some((m) => m.clase === 'abono') ? 'otro ' : ''}abono
        </Link>
      ) : null}
    </div>
  )
}
