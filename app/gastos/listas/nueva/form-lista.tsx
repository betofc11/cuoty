'use client'

import { useActionState } from 'react'

import { crearLista, type EstadoGasto } from '@/app/gastos/acciones'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { OfflineBanner } from '@/components/ui/offline-banner'

export function FormLista() {
  const [estado, enviar, pendiente] = useActionState<EstadoGasto, FormData>(crearLista, {})

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <Field
        id="nombre"
        name="nombre"
        label="Nombre de la lista"
        placeholder="Servicios"
        maxLength={40}
        autoComplete="off"
        autoFocus
        required
        hint="Nace repartida en partes iguales entre todos. Después la ajustás."
      />

      <Button type="submit" disabled={pendiente}>
        {pendiente ? 'Creando…' : 'Crear la lista'}
      </Button>
    </form>
  )
}
