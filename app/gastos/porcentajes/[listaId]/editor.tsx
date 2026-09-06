'use client'

import { useActionState, useMemo, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { nombreDeMes } from '@/lib/fechas'
import type { VistaPorcentajes } from '@/lib/gastos/porcentajes'
import {
  formatMoney,
  isZero,
  money,
  splitByPercents,
  subtract,
  type MoneyAny,
  type MoneyPair,
} from '@/lib/money'

import { guardarPorcentajes, type EstadoGuardado } from './actions'

const TOTAL = 10_000 // puntos base: 100.00%
const PASO = 500 // los ± mueven de 5 en 5

const fmtPct = (bp: number) => (bp % 100 === 0 ? `${bp / 100}` : (bp / 100).toFixed(2))

/** Proporción simple para la línea en vivo, sin residuo: eso es del guardado. */
function parteDe(total: MoneyAny, bp: number): MoneyAny {
  return money(Math.round((total.minor * bp) / TOTAL), total.currency)
}

function repartoExacto(total: MoneyAny, bps: Record<string, number>, admin: string) {
  return splitByPercents(
    total,
    Object.entries(bps).map(([memberId, bp]) => ({ memberId, percent: bp / 100 })),
    admin,
  )
}

export function EditorPorcentajes({ vista }: { vista: VistaPorcentajes }) {
  const admin =
    vista.miembros.find((m) => m.esAdminDelResiduo)?.membershipId ??
    vista.miembros[0]?.membershipId ??
    ''

  const [bps, setBps] = useState<Record<string, number>>(() =>
    Object.fromEntries(vista.miembros.map((m) => [m.membershipId, Math.round(m.percent * 100)])),
  )
  const [confirmando, setConfirmando] = useState(false)
  const [estado, accion, pendiente] = useActionState<EstadoGuardado, FormData>(
    guardarPorcentajes,
    {},
  )

  const suma = useMemo(() => Object.values(bps).reduce((a, b) => a + b, 0), [bps])
  const restante = TOTAL - suma
  const cuadra = restante === 0
  const hayPlata = !isZero(vista.totalAbierto.CRC) || !isZero(vista.totalAbierto.USD)

  const ajustar = (id: string, delta: number) =>
    setBps((p) => ({ ...p, [id]: Math.min(TOTAL, Math.max(0, (p[id] ?? 0) + delta)) }))

  const escribir = (id: string, texto: string) => {
    const n = Number(texto.replace(',', '.'))
    if (Number.isNaN(n)) return
    setBps((p) => ({ ...p, [id]: Math.min(TOTAL, Math.max(0, Math.round(n * 100))) }))
  }

  const partesIguales = () => {
    const n = vista.miembros.length
    const base = Math.floor(TOTAL / n)
    const sobra = TOTAL - base * n
    setBps(
      Object.fromEntries(
        vista.miembros.map((m) => [m.membershipId, base + (m.membershipId === admin ? sobra : 0)]),
      ),
    )
  }

  const preset503020 = () => {
    const valores = [5000, 3000, 2000]
    setBps(
      Object.fromEntries(vista.miembros.map((m, i) => [m.membershipId, valores[i] ?? 0])),
    )
  }

  // ── Qué se mueve si se guarda ────────────────────────────────────────────
  const impacto = useMemo(() => {
    if (!cuadra || !hayPlata) return []

    const nuevoCrc = repartoExacto(vista.totalAbierto.CRC, bps, admin)
    const nuevoUsd = repartoExacto(vista.totalAbierto.USD, bps, admin)

    return vista.miembros.map((m) => {
      const crc = nuevoCrc.find((a) => a.memberId === m.membershipId)?.amount
      const usd = nuevoUsd.find((a) => a.memberId === m.membershipId)?.amount
      return {
        miembro: m,
        antes: Math.round(m.percent * 100),
        ahora: bps[m.membershipId] ?? 0,
        deltaCrc: crc ? subtract(crc, m.cargoActual.CRC) : money(0, 'CRC'),
        deltaUsd: usd ? subtract(usd, m.cargoActual.USD) : money(0, 'USD'),
      }
    })
  }, [bps, cuadra, hayPlata, vista, admin])

  const hayMovimiento = impacto.some((i) => i.deltaCrc.minor !== 0 || i.deltaUsd.minor !== 0)

  // ══════════════════════════ Confirmación ══════════════════════════
  if (confirmando) {
    return (
      <div className="flex flex-col gap-5">
        <OfflineBanner />
        {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

        <header className="flex flex-col gap-2">
          <h1 className="text-tinta text-xl font-semibold">Antes de guardar</h1>
          <p className="text-tinta-suave text-base">
            Cambiar los porcentajes mueve plata que ya estaba cargada en{' '}
            {vista.mesesAbiertos.length === 1
              ? nombreDeMes(vista.mesesAbiertos[0] ?? '', { conAnio: false }).toLowerCase()
              : 'los meses abiertos'}
            . Queda anotado en el saldo de cada quien, a tu nombre.
          </p>
        </header>

        <section className="border-borde bg-superficie rounded-2xl border">
          <h2 className="text-tinta-suave border-borde-suave border-b px-4 py-3 text-xs font-semibold tracking-wide uppercase">
            Qué se mueve · {vista.lista.nombre}
          </h2>
          <ul className="divide-borde-suave divide-y">
            {impacto.map((i) => {
              const quieto = i.deltaCrc.minor === 0 && i.deltaUsd.minor === 0
              return (
                <li key={i.miembro.membershipId} className="flex flex-col gap-1 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-tinta text-base font-medium">
                      {i.miembro.nombre}
                    </span>
                    <span className="text-tinta-suave text-sm">
                      {fmtPct(i.antes)}% → <span className="text-tinta font-semibold">{fmtPct(i.ahora)}%</span>
                    </span>
                  </div>

                  {quieto ? (
                    <span className="text-tinta-suave text-sm">No le cambia nada</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {[i.deltaCrc, i.deltaUsd]
                        .filter((d) => d.minor !== 0)
                        .map((d) => (
                          <span key={d.currency} className="text-sm">
                            <span className="text-tinta-suave">
                              {d.minor > 0 ? 'Le suma ' : 'Le baja '}
                            </span>
                            <span
                              className={`font-semibold ${d.currency === 'CRC' ? 'text-crc' : 'text-usd'}`}
                            >
                              {formatMoney(money(Math.abs(d.minor), d.currency))}
                            </span>
                          </span>
                        ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <p className="text-tinta-suave text-sm">
          Los abonos ya registrados no se tocan. Lo que cambia es el cargo, así que a
          quien le baja le puede quedar saldo a favor.
        </p>

        <form action={accion} className="flex flex-col gap-3">
          <input type="hidden" name="listaId" value={vista.lista.id} />
          <input
            type="hidden"
            name="reparto"
            value={JSON.stringify(
              vista.miembros.map((m) => ({
                membershipId: m.membershipId,
                percent: (bps[m.membershipId] ?? 0) / 100,
              })),
            )}
          />
          <button
            type="submit"
            disabled={pendiente}
            className="min-h-touch bg-crc w-full rounded-2xl px-5 text-base font-semibold
                       text-white disabled:opacity-60"
          >
            {pendiente ? 'Guardando…' : 'Guardar y anotar los movimientos'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="min-h-touch border-borde bg-superficie-alta text-tinta w-full rounded-2xl
                     border px-5 text-base font-semibold"
        >
          Volver a los porcentajes
        </button>
      </div>
    )
  }

  // ══════════════════════════ Editor ══════════════════════════
  return (
    <div className="flex flex-col gap-5">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <h1 className="text-tinta text-xl font-semibold">
        Porcentajes · {vista.lista.nombre}
      </h1>

      <div
        className={`rounded-2xl border p-4 ${
          cuadra ? 'border-ok/40 bg-ok/10' : 'border-crc/40 bg-crc-tenue/40'
        }`}
      >
        <p className={`text-lg font-semibold ${cuadra ? 'text-ok' : 'text-crc'}`}>
          {cuadra ? 'Cuadra: 100%' : `${fmtPct(Math.abs(restante))}%`}
        </p>
        <p className="text-tinta-suave text-sm">
          {cuadra
            ? 'Ya podés guardar.'
            : restante > 0
              ? `Faltan ${fmtPct(restante)}% por repartir. La suma tiene que dar exactamente 100%.`
              : `Te pasaste por ${fmtPct(-restante)}%. La suma tiene que dar exactamente 100%.`}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Repartos rápidos
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={partesIguales}
            className="min-h-touch border-borde bg-superficie-alta text-tinta rounded-full
                       border px-4 text-base font-medium"
          >
            Partes iguales
          </button>
          {vista.miembros.length === 3 ? (
            <button
              type="button"
              onClick={preset503020}
              className="min-h-touch border-borde bg-superficie-alta text-tinta rounded-full
                         border px-4 text-base font-medium"
            >
              50/30/20
            </button>
          ) : null}
        </div>
      </section>

      <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
        {vista.miembros.map((m) => {
          const bp = bps[m.membershipId] ?? 0
          const parteCrc = parteDe(vista.totalAbierto.CRC, bp)
          const parteUsd = parteDe(vista.totalAbierto.USD, bp)

          return (
            <li key={m.membershipId} className="flex items-center gap-3 p-4">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-tinta truncate text-base font-medium">{m.nombre}</span>
                {hayPlata ? (
                  <span className="text-tinta-suave text-sm">
                    {!isZero(vista.totalAbierto.CRC)
                      ? `${formatMoney(parteCrc)} de ${formatMoney(vista.totalAbierto.CRC)}`
                      : null}
                    {!isZero(vista.totalAbierto.CRC) && !isZero(vista.totalAbierto.USD)
                      ? ' · '
                      : null}
                    {!isZero(vista.totalAbierto.USD)
                      ? `${formatMoney(parteUsd)} de ${formatMoney(vista.totalAbierto.USD)}`
                      : null}
                  </span>
                ) : (
                  <span className="text-tinta-suave text-sm">Sin gastos todavía</span>
                )}
              </span>

              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => ajustar(m.membershipId, -PASO)}
                  aria-label={`Bajar 5% a ${m.nombre}`}
                  className="min-h-touch border-borde text-tinta size-12 rounded-xl border text-xl"
                >
                  −
                </button>
                <input
                  aria-label={`Porcentaje de ${m.nombre}`}
                  inputMode="decimal"
                  value={fmtPct(bp)}
                  onChange={(e) => escribir(m.membershipId, e.target.value)}
                  className="border-borde bg-superficie-alta text-tinta h-12 w-16 rounded-xl
                             border text-center text-base font-semibold"
                />
                <button
                  type="button"
                  onClick={() => ajustar(m.membershipId, PASO)}
                  aria-label={`Subir 5% a ${m.nombre}`}
                  className="min-h-touch border-borde text-tinta size-12 rounded-xl border text-xl"
                >
                  +
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <span className="text-tinta-suave text-sm">
          Tocá el número para escribirlo con teclado. Los ± mueven de 5 en 5.
        </span>
        <span className={`shrink-0 text-base font-semibold ${cuadra ? 'text-ok' : 'text-crc'}`}>
          Suma {fmtPct(suma)}%
        </span>
      </div>

      {cuadra ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="min-h-touch bg-crc w-full rounded-2xl px-5 text-base font-semibold text-white"
        >
          {hayMovimiento ? 'Revisar qué se mueve' : 'Guardar porcentajes'}
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-touch bg-crc w-full rounded-2xl px-5 text-base font-semibold
                     text-white opacity-50"
        >
          Guardar · {restante > 0 ? `faltan ${fmtPct(restante)}%` : `sobran ${fmtPct(-restante)}%`}
        </button>
      )}
    </div>
  )
}
