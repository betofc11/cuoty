'use client'

import { useActionState } from 'react'

import { guardarNombre, type EstadoNombre } from '@/app/acciones/perfil'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { LARGO_MAXIMO_NOMBRE } from '@/lib/perfil/nombre'

/**
 * El campo del nombre. Lo comparten /bienvenida —donde se pide por primera vez y
 * sigue de largo— y /cuenta, donde se corrige y se queda.
 */
export function FormNombre({
  valorInicial = '',
  textoBoton,
  seguir = false,
  enfocar = false,
  hint,
}: {
  valorInicial?: string
  textoBoton: string
  /** Al guardar, continuar al dashboard en vez de quedarse. */
  seguir?: boolean
  enfocar?: boolean
  hint?: string
}) {
  const [estado, accion, guardando] = useActionState<EstadoNombre, FormData>(
    guardarNombre,
    {},
  )

  return (
    <form action={accion} className="flex flex-col gap-4">
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}
      {estado.guardado ? <Alert tono="ok">Listo, se guardó.</Alert> : null}

      {seguir ? <input type="hidden" name="seguir" value="1" /> : null}

      <Field
        id="apodo"
        // `apodo` a propósito: ver el comentario en `app/acciones/perfil.ts`.
        name="apodo"
        label="Tu nombre"
        placeholder="Euge"
        autoComplete="nickname"
        maxLength={LARGO_MAXIMO_NOMBRE}
        required
        autoFocus={enfocar}
        defaultValue={valorInicial}
        hint={hint}
      />

      <Button type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : textoBoton}
      </Button>
    </form>
  )
}
