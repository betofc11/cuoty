import { formatBalance, isZero, type MoneyAny, type MoneyPair } from '@/lib/money'

const tonos = {
  debe: 'text-tinta',
  favor: 'text-ok',
  'al-dia': 'text-tinta-suave',
} as const

/**
 * Invariante 9 — un saldo negativo NUNCA se muestra en negativo: se lee
 * «A favor ₡10.000». El signo menos en una app de plata compartida se
 * interpreta como «me deben» tan seguido como «tengo a favor».
 */
export function Saldo({
  monto,
  tamano = 'normal',
}: {
  monto: MoneyAny
  tamano?: 'grande' | 'normal'
}) {
  const { tone, label, text } = formatBalance(monto)
  const color = monto.currency === 'CRC' ? 'text-crc' : 'text-usd'

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`text-sm ${tonos[tone]}`}>{label}</span>
      <span
        className={`font-semibold ${tamano === 'grande' ? 'text-3xl' : 'text-base'} ${
          tone === 'al-dia' ? 'text-tinta-suave' : color
        }`}
      >
        {text}
      </span>
    </span>
  )
}

/** Las dos monedas en paralelo. Si ambas están en cero, una sola línea: al día. */
export function SaldoPar({
  par,
  tamano = 'grande',
}: {
  par: MoneyPair
  tamano?: 'grande' | 'normal'
}) {
  const hayCrc = !isZero(par.CRC)
  const hayUsd = !isZero(par.USD)

  if (!hayCrc && !hayUsd) {
    return <span className="text-ok text-base font-semibold">Al día</span>
  }

  return (
    <div className="flex flex-col gap-1">
      {hayCrc ? <Saldo monto={par.CRC} tamano={tamano} /> : null}
      {hayUsd ? <Saldo monto={par.USD} tamano={tamano} /> : null}
    </div>
  )
}
