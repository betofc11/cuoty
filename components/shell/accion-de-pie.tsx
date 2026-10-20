'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** El `id` del lugar vacío que el `Shell` deja sobre las tabs. */
export const ID_ACCION_DE_PIE = 'accion-de-pie'

/**
 * Una acción anclada sobre las tabs, donde llega el pulgar: el alta de Compras,
 * «Agregar gasto». La pone la página y no el layout, porque es la página la que
 * sabe si corresponde: Gastos solo la muestra al admin y con el mes abierto.
 *
 * Es un portal hacia el lugar que deja el `Shell`, y no un `sticky` dentro de la
 * página, porque las tabs ya ocupan el `bottom-0` y dos `sticky` en el mismo
 * borde se tapan en vez de apilarse. Tampoco es un slot paralelo (`@pie`): en
 * una navegación del lado del cliente, un slot sin página para la ruta nueva se
 * queda mostrando la anterior, y el alta de Compras aparecería en Gastos.
 *
 * El costo: aparece al hidratar y no en el HTML del servidor. Lo que va acá
 * igual necesita JavaScript para funcionar.
 */
export function AccionDePie({ children }: { children: React.ReactNode }) {
  const [destino, setDestino] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setDestino(document.getElementById(ID_ACCION_DE_PIE))
  }, [])

  if (!destino) return null

  return createPortal(
    <div className="border-borde border-b">
      <div className="max-w-app mx-auto">{children}</div>
    </div>,
    destino,
  )
}
