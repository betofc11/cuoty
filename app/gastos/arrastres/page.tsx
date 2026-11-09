import Link from 'next/link'

import { MontosQueHay, SaldoDelMes } from '@/components/gastos/arrastre'
import { Avatar } from '@/components/ui/avatar'
import { BackLink } from '@/components/ui/back-link'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { nombreDeMes } from '@/lib/fechas'
import { vistaDeArrastres } from '@/lib/gastos/arrastres'
import { abs, formatMoney, isZero, type MoneyPair } from '@/lib/money'

/**
 * «₡107.050», o «₡107.050 y $7,75». Lo negativo se dice «a favor», nunca con
 * signo (invariante 9 de `lib/money`).
 */
function enTexto(par: MoneyPair): string {
  return [par.CRC, par.USD]
    .filter((m) => !isZero(m))
    .map((m) => (m.minor < 0 ? `${formatMoney(abs(m))} a favor` : formatMoney(m)))
    .join(' y ')
}

/**
 * Lo que sigue vivo de los meses cerrados, fuera de la pestaña de Gastos.
 *
 * Antes era una tarjeta por mes arriba de las listas, y en una casa con cinco
 * meses debiendo había que pasar cinco tarjetas para llegar al mes en curso.
 * Acá cada mes es una fila, y cada persona lleva a su saldo, que es donde se
 * registra el abono.
 */
export default async function ArrastresPage() {
  const vista = await vistaDeArrastres()
  const { pendientes, saldados, porCobrar } = vista
  const hayAlgo = pendientes.length > 0 || saldados.length > 0

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-6 px-4 pt-5 pb-seguro">
      <BackLink href="/gastos">Volver</BackLink>
      <OfflineBanner />

      <header className="flex flex-col gap-2">
        <h1 className="text-tinta text-xl font-semibold">Arrastre de meses cerrados</h1>
        {/* Se queda porque evita un error: sin esto, parece que cada mes se paga
            aparte, y el abono va siempre al más viejo. */}
        {pendientes.length > 0 ? (
          <p className="text-tinta-suave text-base">
            Lo que quedó sin abonar al cerrar cada mes. Se cobra junto con el mes abierto, y
            cada abono baja primero el mes más viejo.
          </p>
        ) : null}
      </header>

      {!hayAlgo ? (
        <p className="border-borde-suave text-tinta-suave rounded-2xl border border-dashed p-5 text-base">
          Ningún mes cerró con saldo pendiente.
        </p>
      ) : null}

      {hayAlgo && pendientes.length === 0 ? (
        <p className="text-ok text-base font-semibold">
          Todo lo de los meses cerrados ya está abonado.
        </p>
      ) : null}

      {pendientes.length > 0 ? (
        <>
          <section className="flex flex-col gap-1">
            <h2 className="text-tinta text-base font-semibold">Falta abonar</h2>
            <span>
              <MontosQueHay par={porCobrar} tamano="grande" alinear="izquierda" />
            </span>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-tinta text-base font-semibold">Por mes</h2>
            <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
              {pendientes.map((m) => (
                <li key={m.periodoId} className="flex flex-col gap-1 px-4 pt-3 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-tinta text-base font-semibold">{nombreDeMes(m.mes)}</h3>
                    {/* Con una sola persona, el monto ya va en su fila. */}
                    {m.deudas.length > 1 ? <MontosQueHay par={m.porCobrar} /> : null}
                  </div>

                  {/* La foto del cierre, solo si ya abonaron algo: sin esto el
                      monto parece contradecir lo que se vio al cerrar el mes. */}
                  {m.alCerrar ? (
                    <p className="text-tinta-suave text-sm">
                      Al cerrarlo quedaban {enTexto(m.alCerrar)}
                    </p>
                  ) : null}

                  <ul className="flex flex-col">
                    {m.deudas.map((d) => (
                      <li key={d.membershipId}>
                        <Link
                          href={`/saldos/${d.membershipId}`}
                          className="min-h-touch active:bg-superficie-alta -mx-2 flex items-center gap-3
                                     rounded-xl px-2 py-1"
                        >
                          <Avatar inicial={d.inicial} tono={d.tono} />
                          <span className="text-tinta min-w-0 flex-1 text-base">
                            {d.nombre}
                            {d.esYo ? ' (vos)' : ''}
                          </span>
                          <SaldoDelMes par={d.saldo} />
                          <span aria-hidden="true" className="text-tinta-suave shrink-0 text-base">
                            ›
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {saldados.length > 0 ? (
        // Abierto cuando ya no queda nada pendiente: es lo único que hay para ver.
        <details
          open={pendientes.length === 0}
          className="border-borde bg-superficie-alta group rounded-2xl border"
        >
          <summary
            className="min-h-touch text-tinta flex cursor-pointer items-center justify-between gap-3
                       px-4 text-base font-semibold"
          >
            Ya saldados
            <span className="text-tinta-suave flex items-center gap-3 font-normal">
              <span aria-hidden="true" className="text-sm">
                {saldados.length}
              </span>
              <span className="sr-only">
                , {saldados.length} {saldados.length === 1 ? 'mes' : 'meses'}
              </span>
              <span aria-hidden="true" className="transition group-open:rotate-180">
                ▾
              </span>
            </span>
          </summary>
          <ul className="border-borde-suave divide-borde-suave divide-y overflow-hidden rounded-b-2xl border-t">
            {saldados.map((m) => (
              <li key={m.periodoId} className="flex items-center justify-between gap-3 p-4">
                <span className="flex min-w-0 flex-col">
                  <span className="text-tinta text-base">{nombreDeMes(m.mes)}</span>
                  <span className="text-tinta-suave text-sm">
                    Al cerrarlo quedaban {enTexto(m.alCerrar)}
                  </span>
                </span>
                <span className="text-ok shrink-0 text-base font-semibold">Saldado</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
