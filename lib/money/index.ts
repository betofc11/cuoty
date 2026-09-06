/**
 * Dinero en Cuoty.
 *
 * Invariante 7 — CRC y USD nunca se suman ni se convierten.
 * Acá eso no es disciplina del que escribe: es el sistema de tipos. `add` y
 * `subtract` marcan el segundo operando con `NoInfer`, así que la moneda se
 * infiere solo del primero y `add(colones, dolares)` NO COMPILA. El guard en
 * runtime existe igual, porque los datos entran desde la base y el frontend es
 * manipulable.
 *
 * No existe —y no debe existir— una función que devuelva "el total". Cuando hay
 * que mostrar las dos monedas, se usa `MoneyPair`: dos cifras paralelas.
 *
 * Representación: entero exacto en unidades menores (céntimos). La base guarda
 * numeric(14,2) y nunca float. En céntimos el máximo es ~1e14, cómodamente por
 * debajo de Number.MAX_SAFE_INTEGER (~9.007e15), así que la aritmética entera en
 * JS es exacta. Los repartos usan BigInt internamente para no arriesgar overflow
 * en el producto intermedio.
 */

export const CURRENCIES = ['CRC', 'USD'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

const SYMBOL: Record<CurrencyCode, string> = { CRC: '₡', USD: '$' }

/** Decimales que se MUESTRAN. CRC se presenta redondeado al colón. */
const DISPLAY_DECIMALS: Record<CurrencyCode, 0 | 2> = { CRC: 0, USD: 2 }

export type Money<C extends CurrencyCode = CurrencyCode> = {
  readonly minor: number
  readonly currency: C
}

/**
 * Unión explícita de las dos monedas. `Money` a secas no se puede estrechar
 * mirando `.currency` porque el genérico no es un discriminante; esto sí:
 * dentro de `if (m.currency === 'CRC')`, `m` es `Money<'CRC'>`.
 */
export type MoneyAny = Money<'CRC'> | Money<'USD'>

/** Dos cifras paralelas. Es lo más cerca de un "total" que existe en Cuoty. */
export type MoneyPair = {
  readonly CRC: Money<'CRC'>
  readonly USD: Money<'USD'>
}

// ── Construcción ────────────────────────────────────────────────────────────

export function money<C extends CurrencyCode>(minor: number, currency: C): Money<C> {
  if (!Number.isSafeInteger(minor)) {
    throw new Error(`Monto no entero o fuera de rango: ${minor}`)
  }
  return { minor, currency }
}

export function zero<C extends CurrencyCode>(currency: C): Money<C> {
  return { minor: 0, currency }
}

export function zeroPair(): MoneyPair {
  return { CRC: zero('CRC'), USD: zero('USD') }
}

/**
 * Suma un monto al lado que le toca del par. Es la única forma de acumular
 * filas de la base que vienen mezcladas por moneda sin cruzarlas nunca.
 */
export function addToPair(
  par: MoneyPair,
  amount: number | string,
  currency: CurrencyCode,
): MoneyPair {
  return currency === 'CRC'
    ? { ...par, CRC: add(par.CRC, fromDecimal(amount, 'CRC')) }
    : { ...par, USD: add(par.USD, fromDecimal(amount, 'USD')) }
}

/**
 * Parsea el decimal que devuelve Postgres ("38400.00"). Trabaja sobre el string
 * para no pasar nunca por un float.
 */
export function fromDecimal<C extends CurrencyCode>(
  value: string | number,
  currency: C,
): Money<C> {
  const raw = (typeof value === 'number' ? value.toString() : value).trim()
  const match = /^(-)?(\d+)(?:\.(\d*))?$/.exec(raw)
  if (!match) throw new Error(`Monto inválido: "${raw}"`)

  const negative = match[1] === '-'
  const whole = match[2] ?? '0'
  const frac = (match[3] ?? '').padEnd(2, '0').slice(0, 2)

  if (whole.length > 12) throw new Error(`Monto fuera de rango: "${raw}"`)

  const magnitude = Number(whole) * 100 + Number(frac)
  return money(negative ? -magnitude : magnitude, currency)
}

/**
 * Lee lo que una persona escribió en un campo. En Costa Rica el punto separa
 * miles y la coma decimales, pero la gente mezcla: «38.400», «38400», «15,99»,
 * «1.234,56» y «15.99» tienen que caer todos donde corresponde.
 *
 * Regla: se mira el ÚLTIMO separador. Si le siguen exactamente tres dígitos es
 * de miles; si no, es decimal. Los anteriores siempre son de miles.
 *
 * Devuelve null si no hay un número reconocible.
 */
export function fromInput<C extends CurrencyCode>(
  texto: string,
  currency: C,
): Money<C> | null {
  const limpio = texto.replace(/[^\d.,]/g, '')
  if (!/\d/.test(limpio)) return null

  const corte = Math.max(limpio.lastIndexOf('.'), limpio.lastIndexOf(','))

  if (corte === -1) return fromDecimal(limpio, currency)

  const cola = limpio.slice(corte + 1)
  const cabeza = limpio.slice(0, corte).replace(/[.,]/g, '')

  // Tres dígitos después del último separador: era de miles.
  if (/^\d{3}$/.test(cola)) return fromDecimal(`${cabeza}${cola}`, currency)

  const decimales = cola.replace(/\D/g, '').slice(0, 2).padEnd(2, '0')
  return fromDecimal(`${cabeza || '0'}.${decimales}`, currency)
}

/** Serializa para escribir en un numeric(14,2). */
export function toDecimal(value: Money): string {
  const negative = value.minor < 0
  const abs = Math.abs(value.minor)
  const whole = Math.trunc(abs / 100)
  const cents = (abs % 100).toString().padStart(2, '0')
  return `${negative ? '-' : ''}${whole}.${cents}`
}

// ── Aritmética (siempre dentro de una misma moneda) ─────────────────────────

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(
      `Se intentó operar ${a.currency} con ${b.currency}. Las monedas nunca se mezclan.`,
    )
  }
}

export function add<C extends CurrencyCode>(a: Money<C>, b: Money<NoInfer<C>>): Money<C> {
  assertSameCurrency(a, b)
  return money(a.minor + b.minor, a.currency)
}

export function subtract<C extends CurrencyCode>(
  a: Money<C>,
  b: Money<NoInfer<C>>,
): Money<C> {
  assertSameCurrency(a, b)
  return money(a.minor - b.minor, a.currency)
}

export function negate<C extends CurrencyCode>(value: Money<C>): Money<C> {
  return money(-value.minor, value.currency)
}

export function abs<C extends CurrencyCode>(value: Money<C>): Money<C> {
  return money(Math.abs(value.minor), value.currency)
}

/** La moneda es obligatoria: una lista vacía igual tiene que saber de qué es. */
export function sum<C extends CurrencyCode>(
  values: readonly Money<C>[],
  currency: C,
): Money<C> {
  return values.reduce<Money<C>>((acc, v) => add(acc, v), zero(currency))
}

export function isZero(value: Money): boolean {
  return value.minor === 0
}

/** Saldo negativo = saldo a favor (invariante 9). */
export function isCredit(value: Money): boolean {
  return value.minor < 0
}

export function compare(a: Money, b: Money): number {
  assertSameCurrency(a, b)
  return a.minor === b.minor ? 0 : a.minor < b.minor ? -1 : 1
}

// ── Reparto por porcentajes ─────────────────────────────────────────────────

export const TOTAL_BASIS_POINTS = 10_000

export type Share = {
  readonly memberId: string
  /** Porcentaje, ej. 33.33. Suma exactamente 100 entre todos (invariante 13). */
  readonly percent: string | number
}

export type Allocation<C extends CurrencyCode> = {
  readonly memberId: string
  readonly amount: Money<C>
}

function toBasisPoints(percent: string | number): number {
  const raw = (typeof percent === 'number' ? percent.toString() : percent).trim()
  const match = /^(\d+)(?:\.(\d*))?$/.exec(raw)
  if (!match) throw new Error(`Porcentaje inválido: "${raw}"`)
  const whole = match[1] ?? '0'
  const frac = (match[2] ?? '').padEnd(2, '0').slice(0, 2)
  return Number(whole) * 100 + Number(frac)
}

function scaleRoundHalfUp(totalMinor: number, basisPoints: number): number {
  const negative = totalMinor < 0
  const numerator = BigInt(Math.abs(totalMinor)) * BigInt(basisPoints)
  const divisor = BigInt(TOTAL_BASIS_POINTS)
  let quotient = numerator / divisor
  if ((numerator % divisor) * 2n >= divisor) quotient += 1n
  const result = Number(quotient)
  return negative ? -result : result
}

/**
 * Reparte un gasto entre los miembros según los porcentajes de la lista.
 *
 * Decisión de producto: **el residuo lo absorbe siempre el admin.** Es
 * determinista, no se mueve cuando cambian los porcentajes, y se explica en una
 * frase — el que cobra pone los colones sueltos.
 *
 * Invariante que garantiza esta función: la suma de los cargos da EXACTAMENTE el
 * monto del gasto. La base valida lo mismo por su lado.
 */
export function splitByPercents<C extends CurrencyCode>(
  total: Money<C>,
  shares: readonly Share[],
  adminMemberId: string,
): Allocation<C>[] {
  if (shares.length === 0) throw new Error('No hay porcentajes que repartir.')

  const basisPoints = shares.map((s) => toBasisPoints(s.percent))
  const totalBasisPoints = basisPoints.reduce((acc, bp) => acc + bp, 0)
  if (totalBasisPoints !== TOTAL_BASIS_POINTS) {
    throw new Error(
      `Los porcentajes suman ${totalBasisPoints / 100}%, tienen que sumar exactamente 100%.`,
    )
  }

  const adminIndex = shares.findIndex((s) => s.memberId === adminMemberId)
  if (adminIndex === -1) {
    throw new Error(
      `El admin ${adminMemberId} no tiene fila de porcentaje: no hay quién absorba el residuo.`,
    )
  }

  const result: Allocation<C>[] = shares.map((share, i) => ({
    memberId: share.memberId,
    amount: money(scaleRoundHalfUp(total.minor, basisPoints[i] ?? 0), total.currency),
  }))

  const nonAdminTotal = result.reduce(
    (acc, alloc, i) => (i === adminIndex ? acc : acc + alloc.amount.minor),
    0,
  )
  result[adminIndex] = {
    memberId: adminMemberId,
    amount: money(total.minor - nonAdminTotal, total.currency),
  }

  return result
}

// ── Presentación (es-CR) ────────────────────────────────────────────────────

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Formatea en convención de Costa Rica: punto para miles, coma para decimales.
 * ₡52.140 · $3,00
 */
export function formatMoney(value: Money, options?: { decimals?: 0 | 2 }): string {
  const decimals = options?.decimals ?? DISPLAY_DECIMALS[value.currency]
  const symbol = SYMBOL[value.currency]

  const rounded = decimals === 0 ? Math.round(value.minor / 100) * 100 : value.minor
  const negative = rounded < 0
  const magnitude = Math.abs(rounded)

  const whole = groupThousands(Math.trunc(magnitude / 100).toString())
  const cents = (magnitude % 100).toString().padStart(2, '0')

  const body = decimals === 0 ? whole : `${whole},${cents}`
  return `${negative ? '−' : ''}${symbol}${body}`
}

export type BalanceTone = 'debe' | 'favor' | 'al-dia'

export type FormattedBalance = {
  readonly tone: BalanceTone
  readonly label: string
  readonly text: string
}

/**
 * Invariante 9 — un saldo negativo NUNCA se muestra como número negativo.
 * Se muestra como "A favor ₡10.000".
 */
export function formatBalance(value: Money): FormattedBalance {
  if (value.minor === 0) {
    return { tone: 'al-dia', label: 'Al día', text: formatMoney(value) }
  }
  if (value.minor < 0) {
    return { tone: 'favor', label: 'A favor', text: formatMoney(abs(value)) }
  }
  return { tone: 'debe', label: 'Pendiente', text: formatMoney(value) }
}
