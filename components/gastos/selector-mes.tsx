'use client'

import Link from 'next/link'
import { useState } from 'react'

import { claveDeMes, nombreDeMes } from '@/lib/fechas'
import type { PeriodoVista } from '@/lib/gastos/consultas'

export function SelectorMes({
  actual,
  periodos,
  esAdmin = false,
}: {
  actual: PeriodoVista
  periodos: PeriodoVista[]
  esAdmin?: boolean
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="min-h-touch border-crc text-crc flex items-center gap-2 rounded-full
                   border px-4 text-base font-semibold"
      >
        {nombreDeMes(actual.mes)}
        <span aria-hidden="true">{abierto ? '▴' : '▾'}</span>
      </button>

      {abierto ? (
        <>
          <button
            type="button"
            aria-label="Cerrar el selector de meses"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            className="border-borde bg-superficie-alta absolute top-full left-0 z-20 mt-2
                       w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-lg"
          >
            <p className="text-tinta-suave px-4 pt-4 pb-2 text-xs font-semibold tracking-wide uppercase">
              Mes
            </p>
            <ul className="divide-borde-suave divide-y">
              {periodos.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/gastos?mes=${claveDeMes(p.mes)}`}
                    onClick={() => setAbierto(false)}
                    aria-current={p.id === actual.id ? 'true' : undefined}
                    className="min-h-touch active:bg-superficie flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span
                      className={`text-base ${
                        p.id === actual.id ? 'text-tinta font-semibold' : 'text-tinta'
                      }`}
                    >
                      {nombreDeMes(p.mes)}
                    </span>
                    <span
                      className={`text-sm ${p.estado === 'open' ? 'text-crc font-medium' : 'text-tinta-suave'}`}
                    >
                      {p.estado === 'open' ? 'Abierto' : 'Cerrado'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Invariante 10: cerrar el mes es manual y solo del admin.
                Al miembro no se le muestra apagado — no aparece. */}
            {esAdmin && actual.estado === 'open' ? (
              <Link
                href={`/gastos/cerrar?mes=${claveDeMes(actual.mes)}`}
                onClick={() => setAbierto(false)}
                className="border-borde bg-crc-tenue/40 active:bg-crc-tenue flex min-h-touch
                           flex-col justify-center border-t px-4 py-3"
              >
                <span className="text-crc text-base font-semibold">
                  Terminar {nombreDeMes(actual.mes, { conAnio: false }).toLowerCase()}
                </span>
                <span className="text-tinta-suave text-sm">Solo vos podés cerrarlo</span>
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
