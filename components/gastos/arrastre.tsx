import Link from 'next/link'

import { Monto } from '@/components/dinero/monto'
import { Saldo } from '@/components/dinero/saldo'
import type { VistaDeArrastres } from '@/lib/gastos/arrastres'
import { isZero, type MoneyPair } from '@/lib/money'

/**
 * Las monedas que tienen algo, una debajo de la otra. No usa `ParDeMontos`
 * porque ese dice «Sin gastos en dólares», y un arrastre no son gastos.
 */
export function MontosQueHay({
  par,
  tamano = 'normal',
  alinear = 'derecha',
}: {
  par: MoneyPair
  tamano?: 'grande' | 'normal'
  alinear?: 'izquierda' | 'derecha'
}) {
  return (
    <span className={`flex flex-col gap-1 ${alinear === 'derecha' ? 'items-end' : 'items-start'}`}>
      {!isZero(par.CRC) ? <Monto monto={par.CRC} tamano={tamano} chip /> : null}
      {!isZero(par.USD) ? <Monto monto={par.USD} tamano={tamano} chip /> : null}
    </span>
  )
}

/**
 * Lo de una persona en un mes, sin el rótulo «Pendiente» en cada fila: la
 * pantalla entera es de lo que falta abonar. Lo a favor sí lo lleva, y en
 * verde, porque es lo contrario (invariante 9: nunca con signo menos).
 */
export function SaldoDelMes({ par }: { par: MoneyPair }) {
  return (
    <span className="flex flex-col items-end gap-1">
      {[par.CRC, par.USD]
        .filter((m) => !isZero(m))
        .map((m) =>
          m.minor < 0 ? (
            <Saldo key={m.currency} monto={m} />
          ) : (
            <Monto key={m.currency} monto={m} chip />
          ),
        )}
    </span>
  )
}

/** ['Marta', 'Luis', 'Ana'] → «Marta, Luis y Ana». */
export function enFrase(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? ''
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

/**
 * La puerta a `/gastos/arrastres`, al pie de Gastos: una fila y no una tarjeta
 * por mes. Con cinco meses cerrados debiendo, las tarjetas empujaban las listas
 * del mes fuera de la pantalla, y lo que se viene a ver a Gastos es el mes.
 *
 * Aparece mientras haya algún mes que cerró con saldo, aunque ya esté saldado:
 * así el historial sigue a mano.
 */
export function EntradaDeArrastre({
  vista,
  esAdmin,
}: {
  vista: VistaDeArrastres
  esAdmin: boolean
}) {
  const { pendientes, saldados, porCobrar } = vista
  if (pendientes.length === 0 && saldados.length === 0) return null

  // Al miembro RLS solo le deja ver lo suyo: nombrarlo sería decirle su nombre.
  const deudores = esAdmin
    ? [
        ...new Set(
          pendientes.flatMap((m) =>
            m.deudas
              .filter((d) => d.saldo.CRC.minor > 0 || d.saldo.USD.minor > 0)
              .map((d) => (d.esYo ? 'vos' : d.nombre)),
          ),
        ),
      ]
    : []

  const meses = pendientes.length
  const detalle =
    meses === 0
      ? 'Todo saldado'
      : [`${meses} ${meses === 1 ? 'mes' : 'meses'} sin saldar`, enFrase(deudores)]
          .filter(Boolean)
          .join(' · ')

  return (
    <Link
      href="/gastos/arrastres"
      className="border-borde bg-superficie active:bg-superficie-alta flex items-center gap-3
                 rounded-2xl border p-4"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-tinta text-base font-semibold">Arrastre</span>
        <span className="text-tinta-suave text-sm">{detalle}</span>
      </span>
      <MontosQueHay par={porCobrar} />
      <span aria-hidden="true" className="text-tinta-suave shrink-0 text-base">
        ›
      </span>
    </Link>
  )
}
