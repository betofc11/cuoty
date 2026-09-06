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
