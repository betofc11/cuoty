'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * La búsqueda vive en la URL, igual que el mes en Gastos: se puede
 * compartir el enlace y el filtrado lo hace el servidor. El debounce
 * evita una vuelta al servidor por cada tecla.
 */
export function Buscador({ inicial }: { inicial: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [texto, setTexto] = useState(inicial)

  useEffect(() => {
    const id = setTimeout(() => {
      // Se lee de window y no de useSearchParams a propósito: ese hook
      // devuelve un objeto nuevo en cada replace, y como dependencia del
      // efecto lo dejaría girando en bucle.
      const params = new URLSearchParams(window.location.search)
      const actual = params.get('q') ?? ''
      const nuevo = texto.trim()

      // Sin esto el efecto dispara un replace al montar con la misma
      // búsqueda que ya estaba: una vuelta al servidor por cada carga.
      if (actual === nuevo) return

      if (nuevo) params.set('q', nuevo)
      else params.delete('q')

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }, 300)

    return () => clearTimeout(id)
  }, [texto, pathname, router])

  return (
    <div>
      <label htmlFor="buscar" className="sr-only">
        Buscar en la lista
      </label>
      <input
        id="buscar"
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar…"
        className="min-h-touch border-borde bg-superficie text-tinta
                   placeholder:text-tinta-suave focus:border-crc w-full rounded-2xl
                   border px-4 text-base outline-none"
      />
    </div>
  )
}
