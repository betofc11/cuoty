'use client'

import { useActionState, useState } from 'react'

import { anularGasto, type EstadoGasto } from '@/app/gastos/acciones'
import { Alert } from '@/components/ui/alert'

export function BotonAnular({ gastoId, nombre }: { gastoId: string; nombre: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [estado, enviar, pendiente] = useActionState<EstadoGasto, FormData>(anularGasto, {})

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="min-h-touch border-borde bg-superficie-alta text-peligro w-full rounded-2xl
                   border px-5 text-base font-semibold"
      >
        Anular este gasto
      </button>
    )
  }

  return (
    <div className="border-peligro/40 bg-peligro/10 flex flex-col gap-4 rounded-2xl border p-4">
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <div className="flex flex-col gap-2">
        <p className="text-tinta text-base font-semibold">¿Anular «{nombre}»?</p>
        <p className="text-tinta-suave text-sm">
          Se le resta a cada quien lo que este gasto le había cargado, y queda anotado en
          sus movimientos. El gasto no se borra: el rastro tiene que poder auditarse.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-2">
        <input type="hidden" name="gastoId" value={gastoId} />
        <button
          type="submit"
          disabled={pendiente}
          className="min-h-touch bg-peligro w-full rounded-2xl px-5 text-base font-semibold
                     text-white disabled:opacity-60"
        >
          {pendiente ? 'Anulando…' : 'Sí, anular y revertir los cargos'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="min-h-touch text-tinta w-full text-base font-semibold"
      >
        Mejor no
      </button>
    </div>
  )
}
