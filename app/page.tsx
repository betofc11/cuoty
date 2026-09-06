import Link from 'next/link'

import { SaldoPar } from '@/components/dinero/saldo'
import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import { formatMoney, isZero } from '@/lib/money'
import { saldosDeLaCasa } from '@/lib/saldos/consultas'

export default async function DashboardPage() {
  const { activa } = await contextoDeCasa()
  const saldos = await saldosDeLaCasa()

  const esAdmin = activa.rol === 'admin'
  const mio = saldos.find((s) => s.esYo)
  // Todos, no solo los que deben: bajo «La casa», esconder a quien tiene saldo
  // a favor sería mentir por omisión — y ese crédito es justo lo que el admin
  // necesita ver antes de cerrar el mes.
  const otros = saldos
    .filter((s) => !s.esYo)
    .sort((a, b) => b.saldo.CRC.minor - a.saldo.CRC.minor)

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <OfflineBanner />

        <section className="border-borde bg-superficie flex flex-col gap-3 rounded-2xl border p-5">
          <h1 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
            {mio && (isZero(mio.saldo.CRC) && isZero(mio.saldo.USD))
              ? 'Al día'
              : 'Mi saldo pendiente'}
          </h1>

          {mio ? (
            <>
              <SaldoPar par={mio.saldo} />

              {!isZero(mio.cargo.CRC) ? (
                <p className="text-tinta-suave text-base">
                  Ya abonado {formatMoney(mio.abonado.CRC)} de {formatMoney(mio.cargo.CRC)}
                  {!isZero(mio.cargo.USD)
                    ? ` · ${formatMoney(mio.abonado.USD)} de ${formatMoney(mio.cargo.USD)}`
                    : ''}
                </p>
              ) : (
                <p className="text-tinta-suave text-base">
                  Todavía no hay gastos que te toquen este mes.
                </p>
              )}

              <Link
                href={`/saldos/${mio.membershipId}`}
                className="min-h-touch text-crc flex items-center text-base font-semibold"
              >
                Ver mis movimientos
              </Link>
            </>
          ) : (
            <p className="text-tinta-suave text-base">No pudimos leer tu saldo.</p>
          )}

          {!esAdmin ? (
            <p className="text-tinta-suave border-borde-suave border-t pt-3 text-sm">
              Quien administra la casa registra los abonos cuando le pasás la plata.
            </p>
          ) : null}
        </section>

        {/* Solo el admin ve lo que deben los demás. */}
        {esAdmin ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
              La casa
            </h2>

            {otros.length === 0 ? (
              <p className="border-borde-suave text-tinta-suave rounded-2xl border border-dashed p-5 text-base">
                Todavía sos la única persona en esta casa.
              </p>
            ) : (
              <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
                {otros.map((s) => (
                  <li key={s.membershipId}>
                    <Link
                      href={`/saldos/${s.membershipId}`}
                      className="active:bg-superficie-alta flex items-center justify-between gap-3 p-4"
                    >
                      <span className="text-tinta text-base">{s.nombre}</span>
                      <SaldoPar par={s.saldo} tamano="normal" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/saldos"
              className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                         justify-center rounded-2xl border px-5 text-base font-semibold"
            >
              Registrar un abono
            </Link>
          </section>
        ) : null}
      </div>
    </Shell>
  )
}
