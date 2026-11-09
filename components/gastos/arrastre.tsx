import Link from 'next/link'

import { Monto } from '@/components/dinero/monto'
import { TraerALaVista } from '@/components/gastos/a-la-vista'
import { Saldo } from '@/components/dinero/saldo'
import { claveDeMes, nombreDeMes } from '@/lib/fechas'
import type { DeudaDeArrastre, VistaDeArrastres } from '@/lib/gastos/arrastres'
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

/** Quienes deben algo (no lo a favor). Al miembro RLS solo le deja ver lo suyo: no se nombra. */
function deudoresDe(deudas: DeudaDeArrastre[], esAdmin: boolean): string[] {
  if (!esAdmin) return []
  return [
    ...new Set(
      deudas
        .filter((d) => d.saldo.CRC.minor > 0 || d.saldo.USD.minor > 0)
        .map((d) => (d.esYo ? 'vos' : d.nombre)),
    ),
  ]
}

/**
 * El arrastre en Gastos: un desplegable al pie, cerrado. Plegado dice cuántos
 * meses siguen sin saldar, de quién y cuánto; abierto, un mes por fila, y cada
 * mes lleva a quién arrastró qué (`/gastos/arrastres/[mes]`).
 *
 * Antes era una tarjeta por mes ARRIBA de las listas: con cinco meses cerrados
 * debiendo, el mes en curso empezaba a la tercera pantalla.
 *
 * Están también los meses ya saldados, porque son el historial. `abierto` viene
 * de la URL (`?arrastre=abierto`), para que «Volver» desde un mes lo deje como
 * estaba.
 */
export function ArrastrePlegable({
  vista,
  esAdmin,
  abierto,
}: {
  vista: VistaDeArrastres
  esAdmin: boolean
  abierto: boolean
}) {
  const { meses, sinSaldar, porCobrar } = vista
  if (meses.length === 0) return null

  const deudores = deudoresDe(
    meses.flatMap((m) => m.deudas),
    esAdmin,
  )
  const resumen =
    sinSaldar === 0
      ? 'Todo saldado'
      : [`${sinSaldar} ${sinSaldar === 1 ? 'mes' : 'meses'} sin saldar`, enFrase(deudores)]
          .filter(Boolean)
          .join(' · ')

  return (
    <details
      id="arrastre"
      open={abierto}
      // El margen deja libre la barra de arriba, que es sticky: sin él, al
      // traerlo a la vista quedaba debajo de ella.
      className="border-borde bg-superficie group rounded-2xl border
                 scroll-mt-[calc(env(safe-area-inset-top)+6rem)]"
    >
      <summary
        className="min-h-touch flex cursor-pointer list-none items-center gap-3 p-4
                   [&::-webkit-details-marker]:hidden"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-tinta text-base font-semibold">Arrastre</span>
          <span className="text-tinta-suave text-sm">{resumen}</span>
        </span>
        <MontosQueHay par={porCobrar} />
        <span
          aria-hidden="true"
          className="text-tinta-suave shrink-0 text-base transition group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      {abierto ? <TraerALaVista /> : null}

      {/* El recorte va en la lista y no en el `<details>`: ahí cortaba el
          anillo de foco del `<summary>` (igual que en Compras). */}
      <ul className="border-borde-suave divide-borde-suave divide-y overflow-hidden rounded-b-2xl border-t">
        {meses.map((m) => {
          const nombres = enFrase(deudoresDe(m.deudas, esAdmin))
          return (
            <li key={m.periodoId}>
              <Link
                href={`/gastos/arrastres/${claveDeMes(m.mes)}`}
                className="active:bg-superficie-alta flex min-h-touch items-center gap-3 px-4 py-3"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-tinta text-base">{nombreDeMes(m.mes)}</span>
                  {nombres ? <span className="text-tinta-suave text-sm">{nombres}</span> : null}
                </span>
                {m.saldado ? (
                  <span className="text-ok shrink-0 text-base font-semibold">Saldado</span>
                ) : (
                  <MontosQueHay par={m.porCobrar} />
                )}
                <span aria-hidden="true" className="text-tinta-suave shrink-0 text-base">
                  ›
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
