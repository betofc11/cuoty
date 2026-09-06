import { formatMoney, type CurrencyCode, type MoneyAny } from '@/lib/money'

/** Terracota para colones, teal para dólares. El color nunca va solo. */
export function ChipMoneda({ moneda }: { moneda: CurrencyCode }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
        moneda === 'CRC' ? 'bg-crc-tenue text-crc' : 'bg-usd-tenue text-usd'
      }`}
    >
      {moneda}
    </span>
  )
}

export function Monto({
  monto,
  tamano = 'normal',
  chip = false,
}: {
  monto: MoneyAny
  tamano?: 'grande' | 'normal' | 'chico'
  chip?: boolean
}) {
  const color = monto.currency === 'CRC' ? 'text-crc' : 'text-usd'
  const tipografia =
    tamano === 'grande' ? 'text-3xl' : tamano === 'chico' ? 'text-sm' : 'text-base'

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`${color} ${tipografia} font-semibold`}>{formatMoney(monto)}</span>
      {chip ? <ChipMoneda moneda={monto.currency} /> : null}
    </span>
  )
}
