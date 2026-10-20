'use client'

import { usePathname } from 'next/navigation'

import { AgregarItem } from '@/app/compras/agregar'

/**
 * La acción anclada sobre las tabs, según la sección. Hoy solo Compras tiene
 * una: el alta rápida, que se hace con una mano en el súper.
 *
 * Decide por la ruta y no con un slot paralelo (`@pie`) a propósito: en una
 * navegación del lado del cliente, un slot sin página para la ruta nueva se
 * queda mostrando la anterior, y el alta de Compras aparecería en Gastos.
 */
export function PieDeSeccion() {
  const pathname = usePathname()

  if (pathname !== '/compras') return null

  return (
    <div className="border-borde border-b">
      <div className="max-w-app mx-auto">
        <AgregarItem />
      </div>
    </div>
  )
}
