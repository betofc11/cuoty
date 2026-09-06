'use client'

import { useActionState, useMemo, useState } from 'react'

import { registrarAbono, type EstadoAbono } from '@/app/saldos/acciones'
import { Alert } from '@/components/ui/alert'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { nombreDeMes } from '@/lib/fechas'
import {
  formatMoney,
  fromInput,
  isZero,
  money,
  type CurrencyCode,
  type MoneyPair,
} from '@/lib/money'

export type MesConSaldo = { periodoId: string; mes: string; saldo: MoneyPair }

const METODOS = ['SINPE', 'efectivo', 'transferencia'] as const

export function FormAbono({
  membershipId,
  nombre,
  saldo,
  porMes,
}: {
  membershipId: string
  nombre: string
  saldo: MoneyPair
  porMes: MesConSaldo[]
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoAbono, FormData>(
    registrarAbono,
    {},
  )
  const [moneda, setMoneda] = useState<CurrencyCode>(
    isZero(saldo.CRC) && !isZero(saldo.USD) ? 'USD' : 'CRC',
  )
  const [texto, setTexto] = useState('')
  const [metodo, setMetodo] = useState<string>('SINPE')

  const debe = moneda === 'CRC' ? saldo.CRC : saldo.USD
  const monto = useMemo(() => fromInput(texto, moneda), [texto, moneda])

  /**
   * Espejo de `allocate_payment` en la base: del mes más viejo al más nuevo.
   * Se calcula acá solo para mostrarlo antes de confirmar — el reparto que vale
   * es el que hace la base.
   */
  const reparto = useMemo(() => {
    if (!monto || monto.minor <= 0) return { filas: [], sobrante: 0 }

    let restante = monto.minor
    const filas: { mes: string; toma: number; queda: number }[] = []

    for (const m of porMes) {
      if (restante <= 0) break
      const saldoMes = (moneda === 'CRC' ? m.saldo.CRC : m.saldo.USD).minor
      if (saldoMes <= 0) continue
      const toma = Math.min(saldoMes, restante)
      filas.push({ mes: m.mes, toma, queda: saldoMes - toma })
      restante -= toma
    }

    return { filas, sobrante: restante }
  }, [monto, moneda, porMes])

  const preset = (minor: number) => setTexto(formatMoney(money(minor, moneda)).slice(1))

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="moneda" value={moneda} />
      <input type="hidden" name="metodo" value={metodo} />

      {/* Cambiar de moneda cambia el monto Y el saldo de referencia.
          Nunca se suman: son dos cuentas separadas. */}
      <div className="flex gap-2">
        {(['CRC', 'USD'] as const).map((m) => {
          const suSaldo = m === 'CRC' ? saldo.CRC : saldo.USD
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMoneda(m)
                setTexto('')
              }}
              className={`min-h-touch flex flex-1 flex-col items-center justify-center
                          rounded-2xl border py-2 ${
                            moneda === m
                              ? m === 'CRC'
                                ? 'border-crc bg-crc-tenue'
                                : 'border-usd bg-usd-tenue'
                              : 'border-borde'
                          }`}
            >
              <span
                className={`text-base font-semibold ${
                  moneda === m ? (m === 'CRC' ? 'text-crc' : 'text-usd') : 'text-tinta-suave'
                }`}
              >
                {m === 'CRC' ? 'Colones' : 'Dólares'}
              </span>
              <span className="text-tinta-suave text-sm">
                {suSaldo.minor > 0 ? `debe ${formatMoney(suSaldo)}` : 'al día'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="monto" className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Monto del abono
        </label>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`text-3xl font-semibold ${moneda === 'CRC' ? 'text-crc' : 'text-usd'}`}
          >
            {moneda === 'CRC' ? '₡' : '$'}
          </span>
          <input
            id="monto"
            name="monto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            inputMode="decimal"
            placeholder={moneda === 'CRC' ? '20.000' : '5,00'}
            autoFocus
            required
            className="min-h-touch border-borde bg-superficie-alta text-tinta
                       placeholder:text-tinta-suave focus:border-crc w-full rounded-2xl border
                       px-4 text-2xl font-semibold outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {moneda === 'CRC' ? (
            <>
              <Atajo onClick={() => preset(2_000_000)} texto="₡20.000" />
              <Atajo onClick={() => preset(5_000_000)} texto="₡50.000" />
            </>
          ) : (
            <>
              <Atajo onClick={() => preset(500)} texto="$5,00" />
              <Atajo onClick={() => preset(1000)} texto="$10,00" />
            </>
          )}
          {debe.minor > 0 ? (
            <Atajo onClick={() => preset(debe.minor)} texto="Todo" />
          ) : null}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Cómo lo recibiste
        </legend>
        <div className="flex flex-wrap gap-2">
          {METODOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetodo(m)}
              className={`min-h-touch rounded-full border px-4 text-base font-medium ${
                metodo === m ? 'border-crc bg-crc-tenue text-crc' : 'border-borde text-tinta-suave'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Invariante 8: el reparto es visible antes de confirmar. */}
      {monto && monto.minor > 0 ? (
        <section className="border-borde bg-superficie rounded-2xl border">
          <h2 className="text-tinta-suave border-borde-suave border-b px-4 py-3 text-xs font-semibold tracking-wide uppercase">
            Se aplica así, del mes más viejo al más nuevo
          </h2>
          <ul className="divide-borde-suave divide-y">
            {reparto.filas.map((f) => (
              <li key={f.mes} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-tinta text-base">{nombreDeMes(f.mes)}</span>
                <span className="flex flex-col items-end">
                  <span className={`text-base font-semibold ${moneda === 'CRC' ? 'text-crc' : 'text-usd'}`}>
                    −{formatMoney(money(f.toma, moneda))}
                  </span>
                  <span className="text-tinta-suave text-sm">
                    {f.queda === 0 ? 'queda al día' : `queda ${formatMoney(money(f.queda, moneda))}`}
                  </span>
                </span>
              </li>
            ))}

            {reparto.sobrante > 0 ? (
              <li className="px-4 py-3">
                <span className="text-ok text-base font-semibold">
                  Le sobran {formatMoney(money(reparto.sobrante, moneda))}
                </span>
                <p className="text-tinta-suave text-sm">
                  Se le acreditan como saldo a favor y se arrastran al mes siguiente.
                </p>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <button
        type="submit"
        disabled={pendiente || !monto || monto.minor <= 0}
        className="min-h-touch bg-crc w-full rounded-2xl px-5 text-base font-semibold
                   text-white disabled:opacity-50"
      >
        {pendiente
          ? 'Registrando…'
          : monto && monto.minor > 0
            ? `Acreditar ${formatMoney(monto)} a ${nombre}`
            : 'Escribí el monto'}
      </button>
    </form>
  )
}

function Atajo({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-touch border-borde bg-superficie-alta text-tinta rounded-full border
                 px-4 text-base font-medium"
    >
      {texto}
    </button>
  )
}
