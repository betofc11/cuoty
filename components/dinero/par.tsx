import { isZero, type MoneyPair } from '@/lib/money'

import { Monto } from './monto'

/**
 * Invariante 7 — nunca hay un total único: siempre dos cifras paralelas.
 *
 * Si una moneda está en cero no se dibuja un `$0,00` que no significa nada; se
 * dice con palabras, como en el prototipo: «sin gastos en dólares».
 */
export function ParDeMontos({
  par,
  tamano = 'grande',
}: {
  par: MoneyPair
  tamano?: 'grande' | 'normal'
}) {
  const hayCrc = !isZero(par.CRC)
  const hayUsd = !isZero(par.USD)

  if (!hayCrc && !hayUsd) {
    return <Monto monto={par.CRC} tamano={tamano} chip />
  }

  return (
    <div className="flex flex-col gap-1">
      {hayCrc ? <Monto monto={par.CRC} tamano={tamano} chip /> : null}
      {hayUsd ? <Monto monto={par.USD} tamano={tamano} chip /> : null}

      {hayCrc && !hayUsd ? (
        <span className="text-tinta-suave text-sm">Sin gastos en dólares</span>
      ) : null}
      {!hayCrc && hayUsd ? (
        <span className="text-tinta-suave text-sm">Sin gastos en colones</span>
      ) : null}
    </div>
  )
}
