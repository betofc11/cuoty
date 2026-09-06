'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'

import { agregarItem, type EstadoCompras } from './acciones'

/**
 * Alta rápida: un campo y listo. Cae en la tienda predeterminada y sin
 * etiquetas — la tienda, la cantidad y los tags se ponen entrando al
 * item. Pedir todo eso de entrada convierte "anotá el pan" en un
 * formulario, y entonces nadie anota nada.
 *
 * Va anclada al pie, sobre la barra de tabs: es la acción que más se
 * repite y la única que se hace con una mano en el super. Arriba
 * empujaba la lista hacia abajo y quedaba fuera de alcance del pulgar.
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
    <div className="border-borde bg-superficie-alta flex flex-col gap-2 border-t px-4 py-3">
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <form action={accion} className="flex gap-2">
        <label htmlFor="producto" className="sr-only">
          Qué hay que comprar
        </label>
        {/*
          El campo se llama `producto` y no `nombre` a propósito. Safari ignora
          el `autoComplete="off"` y clasifica el campo por heurística sobre el
          `name` y el `id`: con `nombre` lo tomaba por el titular de una tarjeta
          y ofrecía rellenarlo con los datos de pago del iPhone. No lo renombres
          de vuelta — el atributo de abajo solo lo respetan Chrome y Firefox.
        */}
        <input
          id="producto"
          name="producto"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Agregar item…"
          autoComplete="off"
          maxLength={80}
          className="min-h-touch border-borde bg-superficie text-tinta
                     placeholder:text-tinta-suave focus:border-crc min-w-0 flex-1
                     rounded-2xl border px-4 text-base outline-none"
        />
        <button
          type="submit"
          disabled={pendiente || texto.trim().length === 0}
          aria-label={pendiente ? 'Agregando' : 'Agregar item'}
          className="min-h-touch bg-crc flex size-12 shrink-0 items-center justify-center
                     rounded-2xl text-2xl font-semibold text-white disabled:opacity-60"
        >
          <span aria-hidden="true">{pendiente ? '···' : '+'}</span>
        </button>
      </form>
    </div>
  )
}
