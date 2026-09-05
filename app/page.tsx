import {
  formatBalance,
  formatMoney,
  fromDecimal,
  money,
  splitByPercents,
  subtract,
} from '@/lib/money'

/**
 * Página de humo de la fase 1. No es UI de producto: existe para probar que el
 * scaffold, los tokens y las invariantes de moneda están vivos. La reemplaza el
 * shell en la fase 5.
 */
export default function Page() {
  // Electricidad ICE, con los porcentajes de la lista Servicios (40/30/30).
  const electricidad = fromDecimal('38400.00', 'CRC')
  const reparto = splitByPercents(
    electricidad,
    [
      { memberId: 'luis', percent: 40 },
      { memberId: 'marta', percent: 30 },
      { memberId: 'rodrigo', percent: 30 },
    ],
    'luis',
  )

  // Saldo de Marta en agosto: cargo ₡107.140 − abonos ₡55.000.
  const cargoMarta = fromDecimal('107140.00', 'CRC')
  const abonadoMarta = fromDecimal('55000.00', 'CRC')
  const saldoMarta = subtract(cargoMarta, abonadoMarta)

  const saldoAFavor = money(-1_000_000, 'CRC')
  const saldoDolares = fromDecimal('3.00', 'USD')

  const marta = formatBalance(saldoMarta)
  const favor = formatBalance(saldoAFavor)
  const dolares = formatBalance(saldoDolares)

  return (
    <main className="mx-auto flex max-w-[390px] flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl text-crc">cuoty</h1>
        <p className="text-tinta-suave text-base">Fase 1 · scaffold</p>
      </header>

      <section className="border-borde bg-superficie rounded-2xl border p-5">
        <h2 className="text-tinta-suave mb-3 text-sm font-semibold tracking-wide uppercase">
          Reparto de un gasto
        </h2>
        <p className="mb-4 text-base">
          Electricidad ICE{' '}
          <span className="text-crc font-semibold">{formatMoney(electricidad)}</span>
        </p>
        <ul className="flex flex-col gap-2">
          {reparto.map((alloc) => (
            <li key={alloc.memberId} className="flex items-center justify-between text-base">
              <span className="capitalize">{alloc.memberId}</span>
              <span className="text-crc font-semibold">{formatMoney(alloc.amount)}</span>
            </li>
          ))}
        </ul>
        <p className="text-tinta-suave mt-4 text-sm">
          El residuo del redondeo lo absorbe el admin. La suma da exactamente el monto del
          gasto.
        </p>
      </section>

      <section className="border-borde bg-superficie rounded-2xl border p-5">
        <h2 className="text-tinta-suave mb-3 text-sm font-semibold tracking-wide uppercase">
          Saldos · dos cifras paralelas
        </h2>
        <dl className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <dt className="text-base">Marta · {marta.label}</dt>
            <dd className="text-crc text-xl font-semibold">{marta.text}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-base">Marta · {dolares.label}</dt>
            <dd className="text-usd text-xl font-semibold">{dolares.text}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-base">Rodrigo · {favor.label}</dt>
            <dd className="text-crc text-xl font-semibold">{favor.text}</dd>
          </div>
        </dl>
        <p className="text-tinta-suave mt-4 text-sm">
          Un saldo negativo nunca se muestra en negativo: se lee «A favor».
        </p>
      </section>
    </main>
  )
}
