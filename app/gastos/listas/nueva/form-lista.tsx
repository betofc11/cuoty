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

      {/*
        `titulo` y no `nombre`: Safari ignora el `autoComplete="off"` y decide
        por heurística sobre el `name` y el `id`. Con «nombre» toma el campo por
        el titular de una tarjeta y ofrece los datos de pago del iPhone.
      */}
      <Field
        id="titulo"
        name="titulo"
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
