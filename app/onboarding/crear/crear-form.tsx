'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { OfflineBanner } from '@/components/ui/offline-banner'

import { crearCasa, type EstadoCasa } from '../actions'

export function CrearForm() {
  const [estado, accion, pendiente] = useActionState<EstadoCasa, FormData>(crearCasa, {})

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <form action={accion} className="flex flex-col gap-4">
        <Field
          id="nombre"
          name="nombre"
          label="Nombre de la casa"
          placeholder="Casa Fonseca"
          maxLength={60}
          autoComplete="off"
          autoFocus
          required
          hint="Como le dicen entre ustedes. Lo podés cambiar después."
        />
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Creando…' : 'Crear la casa'}
        </Button>
      </form>

      <p className="text-tinta-suave text-sm">
        Vas a quedar como administrador: sos quien registra los abonos y cierra el mes.
      </p>
    </div>
  )
}
