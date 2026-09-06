'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'

import { agregarItem, type EstadoCompras } from './acciones'

/**
 * Alta rápida: un campo y listo. Cae en la tienda predeterminada y sin
 * etiquetas — la tienda, la cantidad y los tags se ponen entrando al
 * item. Pedir todo eso de entrada convierte "anotá el pan" en un
 * formulario, y entonces nadie anota nada.
 */
export function AgregarItem() {
  const [texto, setTexto] = useState('')

  const [estado, accion, pendiente] = useActionState<EstadoCompras, FormData>(
    async (previo, formData) => {
      const resultado = await agregarItem(previo, formData)
      if (!resultado.error) setTexto('')
      return resultado
    },
    {},
  )

  return (
    <div className="flex flex-col gap-2">
      <form action={accion} className="flex gap-2">
        <label htmlFor="nombre" className="sr-only">
          Qué hay que comprar
        </label>
        <input
          id="nombre"
          name="nombre"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Leche, pan, tomates…"
          autoComplete="off"
          maxLength={80}
          className="min-h-touch border-borde bg-superficie-alta text-tinta
                     placeholder:text-tinta-suave focus:border-crc min-w-0 flex-1
                     rounded-2xl border px-4 text-base outline-none"
        />
        <button
          type="submit"
          disabled={pendiente || texto.trim().length === 0}
          className="min-h-touch bg-crc flex shrink-0 items-center justify-center rounded-2xl
                     px-5 text-base font-semibold text-white disabled:opacity-60"
        >
          {pendiente ? 'Agregando…' : 'Agregar'}
        </button>
      </form>

      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}
    </div>
  )
}
