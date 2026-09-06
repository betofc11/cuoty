'use client'

import { useActionState } from 'react'

import { terminarRecurrente, type EstadoGasto } from '@/app/gastos/acciones'

export function BotonTerminar({ plantillaId }: { plantillaId: string }) {
  const [estado, enviar, pendiente] = useActionState<EstadoGasto, FormData>(
    terminarRecurrente,
    {},
  )

  return (
    <form action={enviar} className="flex flex-col items-end gap-1">
      <input type="hidden" name="plantillaId" value={plantillaId} />
      <button
        type="submit"
        disabled={pendiente}
        className="min-h-touch text-crc px-2 text-base font-semibold disabled:opacity-60"
      >
        {pendiente ? 'Terminando…' : 'Terminar'}
      </button>
      {estado.error ? <span className="text-peligro text-sm">{estado.error}</span> : null}
    </form>
  )
}
