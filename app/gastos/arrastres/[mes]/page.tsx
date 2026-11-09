import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MontosQueHay, SaldoDelMes } from '@/components/gastos/arrastre'
import { Avatar } from '@/components/ui/avatar'
import { BackLink } from '@/components/ui/back-link'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { claveDeMes, fechaCorta, nombreDeMes } from '@/lib/fechas'
import { detalleDeArrastre, hayPlata } from '@/lib/gastos/arrastres'
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
 * Quién arrastró qué de un mes cerrado: se llega tocando el mes en el
 * desplegable «Arrastre» de Gastos.
 *
 * Por persona, lo que le quedaba al cerrar (la foto de `period_carryovers`, que
 * no cambia) y lo que le falta hoy (`period_balances`): un mes cerrado sigue
 * recibiendo abonos. La fila lleva a su saldo, que es donde se abona.
 */
export default async function ArrastreDelMesPage({
  params,
}: {
  params: Promise<{ mes: string }>
}) {
  const { mes } = await params
  const detalle = await detalleDeArrastre(mes)
  if (!detalle) notFound()

  const corto = nombreDeMes(detalle.mes, { conAnio: false }).toLowerCase()
  const anio = detalle.mes.slice(0, 4)
  const saldado = !hayPlata(detalle.porCobrar)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-6 px-4 pt-5 pb-seguro">
      {/* Vuelve con el desplegable abierto y a la vista, como se dejó. */}
      <BackLink href="/gastos?arrastre=abierto#arrastre">Volver</BackLink>
      <OfflineBanner />

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">
          Arrastre de {corto} de {anio}
        </h1>
        {detalle.cerradoEl ? (
          <span className="text-tinta-suave text-sm">
            Cerrado{detalle.cerradoPor ? ` por ${detalle.cerradoPor}` : ''} ·{' '}
            {fechaCorta(detalle.cerradoEl)}
          </span>
        ) : null}
      </header>

      <section className="flex flex-col gap-1">
        <h2 className="text-tinta text-base font-semibold">Falta abonar</h2>
        {saldado ? (
          <span className="text-ok text-xl font-semibold">Nada: ya está saldado</span>
        ) : (
          <span>
            <MontosQueHay par={detalle.porCobrar} tamano="grande" alinear="izquierda" />
          </span>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-tinta text-base font-semibold">Quién arrastró qué</h2>

        {detalle.personas.length === 0 ? (
          <p className="border-borde-suave text-tinta-suave rounded-2xl border border-dashed p-5 text-base">
            {corto.charAt(0).toUpperCase() + corto.slice(1)} cerró sin nada pendiente.
          </p>
        ) : (
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {detalle.personas.map((p) => (
              <li key={p.membershipId}>
                <Link
                  href={`/saldos/${p.membershipId}`}
                  className="active:bg-superficie-alta flex items-center gap-3 p-4"
                >
                  <span className="self-start">
                    <Avatar inicial={p.inicial} tono={p.tono} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-tinta text-base">
                      {p.nombre}
                      {p.esYo ? ' (vos)' : ''}
                    </span>
                    {hayPlata(p.alCerrar) ? (
                      <span className="text-tinta-suave text-sm">
                        Al cerrar quedaban {enTexto(p.alCerrar)}
                      </span>
                    ) : null}
                  </span>
                  {hayPlata(p.hoy) ? (
                    <SaldoDelMes par={p.hoy} />
                  ) : (
                    <span className="text-ok shrink-0 text-base font-semibold">Saldado</span>
                  )}
                  <span aria-hidden="true" className="text-tinta-suave shrink-0 text-base">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!saldado ? (
          <p className="text-tinta-suave text-sm">
            Se cobra junto con el mes abierto, y cada abono baja primero el mes más viejo.
          </p>
        ) : null}
      </section>

      {/* El «qué» en detalle: los gastos de los que salió el arrastre. */}
      <Link
        href={`/gastos?mes=${claveDeMes(detalle.mes)}`}
        className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                   justify-center rounded-2xl border px-4 text-base font-semibold"
      >
        Ver los gastos de {corto}
      </Link>
    </div>
  )
}
