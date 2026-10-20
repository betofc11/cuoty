import { formatMoney, type CurrencyCode, type MoneyAny } from '@/lib/money'

/**
 * Solo los dólares llevan chip. La moneda ya la dice el símbolo, y los colones
 * son casi todos los montos de la app: un «CRC» en cada fila era ruido, y
 * repetía con color lo que el ₡ ya decía. El chip queda para la moneda que hay
 * que ver venir.
 */
export function ChipMoneda({ moneda }: { moneda: CurrencyCode }) {
  if (moneda !== 'USD') return null

  return (
    <span className="bg-usd-tenue text-usd rounded-md px-1.5 py-0.5 text-xs font-semibold">
      USD
    </span>
  )
}

/** La plata va en tinta: el color se reserva para el estado (a favor, al día). */
export function Monto({
  monto,
  tamano = 'normal',
  chip = false,
}: {
  monto: MoneyAny
  tamano?: 'grande' | 'normal' | 'chico'
  chip?: boolean
}) {
  const tipografia =
    tamano === 'grande' ? 'text-3xl' : tamano === 'chico' ? 'text-sm' : 'text-base'

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`text-tinta ${tipografia} font-semibold`}>{formatMoney(monto)}</span>
      {chip ? <ChipMoneda moneda={monto.currency} /> : null}
    </span>
  )
}
