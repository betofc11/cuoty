'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { cerrarMes, type EstadoGasto } from '@/app/gastos/acciones'
import { Alert } from '@/components/ui/alert'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { claveDeMes, nombreDeMes } from '@/lib/fechas'

export function Confirmar({
  periodoId,
  mes,
  siguiente,
}: {
  periodoId: string
  mes: string
  siguiente: string
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoGasto, FormData>(cerrarMes, {})

  return (
    <div className="flex flex-col gap-3">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <form action={enviar}>
        <input type="hidden" name="periodoId" value={periodoId} />
        <input type="hidden" name="mesSiguiente" value={siguiente} />
        <button
          type="submit"
          disabled={pendiente}
          className="min-h-touch bg-crc w-full rounded-2xl px-5 text-base font-semibold
                     text-white disabled:opacity-60"
        >
          {pendiente
            ? 'Cerrando…'
            : `Cerrar ${nombreDeMes(mes, { conAnio: false }).toLowerCase()} y abrir ${nombreDeMes(siguiente, { conAnio: false }).toLowerCase()}`}
        </button>
      </form>

      <Link
        href={`/gastos?mes=${claveDeMes(mes)}`}
        className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                   justify-center rounded-2xl border px-5 text-base font-semibold"
      >
        Todavía no
      </Link>
    </div>
  )
}
