'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/alert'

import { agregarItem } from './acciones'
import { avisoDeFallo, type Aviso } from './fallo'

/**
 * Alta rápida: un campo y listo. Cae en la tienda predeterminada y sin
 * etiquetas — la tienda, la cantidad y los tags se ponen entrando al
 * item. Pedir todo eso de entrada convierte "anotá el pan" en un
 * formulario, y entonces nadie anota nada.
 *
 * Va anclada al pie, sobre la barra de tabs: es la acción que más se
 * repite y la única que se hace con una mano en el super. Arriba
 * empujaba la lista hacia abajo y quedaba fuera de alcance del pulgar.
 *
 * El envío va con `onSubmit` y estado propio, no con `useActionState`: esa
 * corre la acción en una transición async, y mientras dura, React no aplica
 * ninguna otra, tampoco la navegación de las tabs que están justo abajo. Ver
 * `useMarcar` en `fila-item.tsx`. De paso, un fallo de red ya no tumba la
 * pantalla al `error.tsx`: se muestra acá.
 */
export function AgregarItem() {
  const [texto, setTexto] = useState('')
  const [pendiente, setPendiente] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (pendiente) return

    const formData = new FormData(evento.currentTarget)
    setPendiente(true)
    setAviso(null)
    try {
      const resultado = await agregarItem({}, formData)
      if (resultado.error) setAviso({ texto: resultado.error })
      else setTexto('')
    } catch (e) {
      setAviso(avisoDeFallo(e, 'agregar'))
    } finally {
      setPendiente(false)
    }
  }

  return (
    // Sin fondo ni borde propios: los pone `AccionDePie`, a todo el ancho.
    <div className="flex flex-col gap-2 px-4 py-3">
      {aviso ? (
        // «Recargar» va al lado y no adentro: sobre el tinte rojo de la alerta,
        // el terracota no tiene par verificado en `npm run contraste`.
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Alert tono="error">{aviso.texto}</Alert>
          </div>
          {aviso.recargar ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-touch text-marca shrink-0 text-base font-semibold"
            >
              Recargar
            </button>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={enviar} className="flex gap-2">
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
          className="min-h-touch border-borde-control bg-superficie text-tinta
                     placeholder:text-tinta-suave focus:border-marca focus:ring-marca focus:ring-1 min-w-0 flex-1
                     rounded-2xl border px-4 text-base outline-none"
        />
        <button
          type="submit"
          disabled={pendiente || texto.trim().length === 0}
          aria-label={pendiente ? 'Agregando' : 'Agregar item'}
          className="min-h-touch bg-marca flex size-12 shrink-0 items-center justify-center
                     rounded-2xl text-2xl font-semibold text-sobre-relleno disabled:opacity-60"
        >
          <span aria-hidden="true">{pendiente ? '···' : '+'}</span>
        </button>
      </form>
    </div>
  )
}
