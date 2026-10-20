'use client'

import Link from 'next/link'
import { useOptimistic, useState, useTransition } from 'react'

import type { ItemVista } from '@/lib/compras/consultas'
import { fechaCorta } from '@/lib/fechas'

import { marcarComprado } from './acciones'

/**
 * Marcar es lo que más se hace en el súper, así que va optimista: la tilde
 * sale con el toque y no cuando vuelve el servidor, que con la señal de un
 * supermercado tarda segundos. Si falla, `useOptimistic` la quita solo al
 * terminar la transición, porque el `item` que manda el servidor no cambió, y
 * la fila dice por qué.
 *
 * Dos toques seguidos valen como dos intenciones: el segundo lee el valor
 * optimista y deshace el primero. Next corre las acciones en orden, así que
 * gana la última.
 */
function useMarcar(item: ItemVista) {
  const [comprado, setComprado] = useOptimistic(item.comprado)
  const [, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function alternar() {
    const comprar = !comprado
    setError(null)

    iniciar(async () => {
      setComprado(comprar)
      try {
        const resultado = await marcarComprado(item.id, comprar)
        if (resultado.error) setError(resultado.error)
      } catch {
        // Lo que llega acá es la red: la acción misma devuelve sus errores.
        setError(
          `No se pudo ${comprar ? 'marcar' : 'desmarcar'}. Parece que no hay señal: probá de nuevo.`,
        )
      }
    })
  }

  return { comprado, alternar, error }
}

/*
  El anillo va hacia adentro: la tarjeta del grupo lleva `overflow-hidden`
  para que el fondo al presionar respete las esquinas, y un anillo hacia
  afuera quedaría cortado.
*/
const FOCO = 'focus-visible:outline-marca focus-visible:outline-2 focus-visible:-outline-offset-2'

/**
 * El círculo es decorativo: el control es la fila entera. Va en
 * `borde-control` porque es lo único que dice «esto se marca» con la fila
 * vacía, y eso pide el 3:1 de los bordes de campo.
 */
function Circulo({ comprado }: { comprado: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        comprado ? 'border-ok bg-ok text-sobre-relleno' : 'border-borde-control'
      }`}
    >
      {comprado ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-4">
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}

function AvisoDeFila({ error }: { error: string | null }) {
  if (!error) return null
  // `alert` para que se anuncie: lo que la persona tocó no pasó y la tilde
  // se fue sola, que sin aviso parece un toque que no agarró.
  return (
    <p role="alert" className="text-peligro px-4 pb-3 text-sm">
      {error}
    </p>
  )
}

/** «Leche Dos Pinos 2L · 2»: la cantidad pegada al nombre, no contra el borde. */
function Nombre({ item }: { item: ItemVista }) {
  return (
    <>
      <span className="font-medium">{item.producto}</span>
      {item.cantidad ? <span className="text-tinta-suave"> · {item.cantidad}</span> : null}
    </>
  )
}

/**
 * Una fila de la lista. Tocarla entera marca el item: es lo que más se
 * repite, y antes ese toque grande abría el detalle, que es lo más raro.
 * Editar va al final y con su palabra.
 *
 * Una sola línea: nombre y cantidad. La segunda aparece solo con nota o
 * fotos, lo único que ayuda frente a la góndola. La tienda la dice el
 * encabezado del grupo; las etiquetas y quién lo anotó, el detalle.
 */
export function FilaItem({ item }: { item: ItemVista }) {
  const { comprado, alternar, error } = useMarcar(item)

  const fotos = item.fotos > 0 ? `${item.fotos} ${item.fotos === 1 ? 'foto' : 'fotos'}` : null
  const detalle = [item.nota, fotos].filter(Boolean).join(' · ')

  return (
    <li>
      <div className="flex items-stretch">
        <button
          type="button"
          role="checkbox"
          aria-checked={comprado}
          onClick={alternar}
          className={`min-h-touch active:bg-superficie flex min-w-0 flex-1 items-center gap-3 py-2 pl-3
                      text-left ${FOCO}`}
        >
          <Circulo comprado={comprado} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={`truncate text-base ${comprado ? 'text-tinta-suave line-through' : 'text-tinta'}`}
            >
              <Nombre item={item} />
            </span>
            {detalle ? <span className="text-tinta-suave truncate text-sm">{detalle}</span> : null}
          </span>
        </button>

        <Link
          href={`/compras/${item.id}`}
          className={`min-h-touch text-tinta-suave active:bg-superficie flex shrink-0 items-center px-4
                      text-base ${FOCO}`}
        >
          Editar<span className="sr-only"> {item.producto}</span>
        </Link>
      </div>
      <AvisoDeFila error={error} />
    </li>
  )
}

/**
 * Lo ya comprado: tachado y en una línea, sin «Editar». Se toca igual que una
 * fila pendiente, porque desmarcar algo que se tocó por error tiene que costar
 * un toque.
 *
 * A la derecha va quién lo marcó si fue hoy (con dos personas en el súper,
 * eso es lo que evita comprarlo dos veces) o el día, si fue antes.
 */
export function FilaComprada({ item, cuando }: { item: ItemVista; cuando: 'hoy' | 'antes' }) {
  const { comprado, alternar, error } = useMarcar(item)

  const marca =
    cuando === 'hoy'
      ? item.compradoPor && { previo: ', lo marcó ', texto: item.compradoPor }
      : item.compradoEl && { previo: ', comprado ', texto: fechaCorta(item.compradoEl) }

  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={comprado}
        onClick={alternar}
        className={`min-h-touch active:bg-superficie flex w-full items-center gap-3 py-2 pr-4 pl-3
                    text-left ${FOCO}`}
      >
        <Circulo comprado={comprado} />
        <span
          className={`min-w-0 flex-1 truncate text-base ${
            comprado ? 'text-tinta-suave line-through' : 'text-tinta'
          }`}
        >
          <Nombre item={item} />
        </span>
        {marca ? (
          <span className="text-tinta-suave shrink-0 text-sm">
            <span className="sr-only">{marca.previo}</span>
            {marca.texto}
          </span>
        ) : null}
      </button>
      <AvisoDeFila error={error} />
    </li>
  )
}
