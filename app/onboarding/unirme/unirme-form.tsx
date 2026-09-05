'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { OfflineBanner } from '@/components/ui/offline-banner'

import { unirseACasa, type EstadoCasa } from '../actions'

export function UnirmeForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCasa, FormData>(
    unirseACasa,
    {},
  )

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <form action={accion} className="flex flex-col gap-4">
        <Field
          id="codigo"
          name="codigo"
          label="Código de la casa"
          placeholder="CASA-4F2X"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={12}
          autoFocus
          required
          className="min-h-touch border-borde bg-superficie-alta text-tinta
                     placeholder:text-tinta-suave focus:border-crc rounded-2xl border px-4
                     text-lg tracking-widest uppercase outline-none"
          hint="No importan mayúsculas ni el guion: «4f2x» también sirve."
        />
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Entrando…' : 'Entrar a la casa'}
        </Button>
      </form>

      <p className="text-tinta-suave text-sm">
        Vas a entrar como miembro: podés ver los gastos y editar la lista de compras.
      </p>
    </div>
  )
}
