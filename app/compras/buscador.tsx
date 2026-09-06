'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * La búsqueda vive en la URL, igual que el mes en Gastos: se puede
 * compartir el enlace y el filtrado lo hace el servidor. El debounce
 * evita una vuelta al servidor por cada tecla.
 */
export function Buscador({ inicial }: { inicial: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [texto, setTexto] = useState(inicial)

  // La última búsqueda que empujamos NOSOTROS a la URL. Sirve para
  // distinguir "el servidor me devuelve lo que yo mismo escribí" de
  // "la URL cambió por otra cosa".
  const ultimaEnviada = useRef(inicial)

  useEffect(() => {
    // Si `inicial` no coincide con lo último que empujamos, el cambio
    // vino de afuera: «Quitar los filtros», un enlace, o el botón atrás.
    // Ahí sí hay que reflejarlo en el campo.
    //
    // Compararlo contra `texto` en vez de contra esto sería peor: entre
    // que se dispara el debounce y vuelve el render del servidor el
    // usuario pudo seguir escribiendo, y le borraríamos lo tecleado.
    if (inicial !== ultimaEnviada.current) {
      ultimaEnviada.current = inicial
      setTexto(inicial)
    }
  }, [inicial])

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const actual = params.get('q') ?? ''
      const nuevo = texto.trim()

      // Sin esto el efecto dispara un replace al montar con la misma
      // búsqueda que ya estaba: una vuelta al servidor por cada carga.
      if (actual === nuevo) return

      ultimaEnviada.current = nuevo
      if (nuevo) params.set('q', nuevo)
      else params.delete('q')

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }, 300)

    return () => clearTimeout(id)
  }, [texto, pathname, router])

  return (
    <div className="relative">
      <label htmlFor="buscar" className="sr-only">
        Buscar en la lista
      </label>

      {/* La lupa es lo que hace que el campo se lea como buscador y no como
          una tarjeta más: sin ella, buscador y filas de item comparten
          borde, radio y fondo, y parecen lo mismo. */}
      <span
        aria-hidden="true"
        className="text-tinta-suave pointer-events-none absolute inset-y-0 left-4 flex items-center"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="size-5"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
      </span>

      <input
        id="buscar"
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar en la lista"
        className="min-h-touch border-borde bg-superficie-alta text-tinta
                   placeholder:text-tinta-suave focus:border-crc w-full rounded-2xl
                   border pr-4 pl-12 text-base outline-none"
      />
    </div>
  )
}
