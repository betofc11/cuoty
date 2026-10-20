'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Hoja } from '@/components/ui/hoja'

import { CHIP, CHIP_APAGADO } from './chips'

export type OpcionEtiqueta = { id: string; nombre: string; pendientes: number; href: string }

/**
 * Filtrar por etiqueta. Va en una `<Hoja>` y no en una fila de chips a la
 * vista: la tienda es lo que se elige en el súper, y las etiquetas, que usa uno
 * de cada cuatro items, no merecen el mismo lugar. Elegir de una lista va en
 * una hoja (CLAUDE.md, «El marco»).
 *
 * Con una etiqueta puesta este botón no aparece: en su lugar la página pone el
 * chip de esa etiqueta con su ×.
 */
export function FiltroEtiquetas({ opciones }: { opciones: OpcionEtiqueta[] }) {
  const [abierta, setAbierta] = useState(false)
  // Cada opción es un enlace a la misma página: la hoja es estado del cliente
  // y sobrevive a la navegación, así que hay que cerrarla a mano.
  const cerrar = () => setAbierta(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        className={`${CHIP} ${CHIP_APAGADO}`}
      >
        Etiquetas
      </button>

      <Hoja abierta={abierta} onCerrar={cerrar} titulo="Filtrar por etiqueta">
        <ul className="border-borde-suave divide-borde-suave divide-y border-t">
          {opciones.map((o) => (
            <li key={o.id}>
              <Link
                href={o.href}
                scroll={false}
                onClick={cerrar}
                className="min-h-touch active:bg-superficie flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-tinta text-base">{o.nombre}</span>
                <span className="text-tinta-suave text-sm">
                  {o.pendientes} {o.pendientes === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Hoja>
    </>
  )
}
