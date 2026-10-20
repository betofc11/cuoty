'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Hoja } from '@/components/ui/hoja'
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
  const cerrar = () => setAbierto(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="min-h-touch border-marca text-marca flex items-center gap-2 rounded-full
                   border px-4 text-base font-semibold"
      >
        {nombreDeMes(actual.mes)}
        <span aria-hidden="true">▾</span>
      </button>

      <Hoja abierta={abierto} onCerrar={cerrar} titulo="Elegí el mes">
        <ul className="border-borde-suave divide-borde-suave divide-y border-t">
          {periodos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/gastos?mes=${claveDeMes(p.mes)}`}
                onClick={cerrar}
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
                  className={`text-sm ${p.estado === 'open' ? 'text-tinta font-medium' : 'text-tinta-suave'}`}
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
            onClick={cerrar}
            className="border-borde bg-marca-tenue/40 active:bg-marca-tenue flex min-h-touch
                       flex-col justify-center border-t px-4 py-3"
          >
            <span className="text-marca text-base font-semibold">
              Terminar {nombreDeMes(actual.mes, { conAnio: false }).toLowerCase()}
            </span>
            <span className="text-tinta-suave text-sm">Solo vos podés cerrarlo</span>
          </Link>
        ) : null}
      </Hoja>
    </div>
  )
}
