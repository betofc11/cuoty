'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Ancho del difuminado de los bordes, en px. */
const DESVANECIDO = 24

/**
 * La máscara se arma según haya scroll para un lado, para el otro o para
 * los dos. Va como `mask-image` y no como un degradado encima: el carrusel
 * aparece sobre el fondo de la página y también sobre el panel de filtros,
 * que tienen colores distintos, y la máscara desvanece el CONTENIDO sin
 * que haya que saber contra qué fondo está.
 */
function mascara(izq: boolean, der: boolean): string | undefined {
  if (!izq && !der) return undefined

  const inicio = izq ? `transparent 0, #000 ${DESVANECIDO}px` : '#000 0'
  const fin = der ? `#000 calc(100% - ${DESVANECIDO}px), transparent 100%` : '#000 100%'

  return `linear-gradient(to right, ${inicio}, ${fin})`
}

/**
 * Fila de chips que scrollea en horizontal en vez de apilarse: apilados
 * crecen hacia abajo con cada etiqueta nueva y empujan la lista fuera de
 * la pantalla.
 *
 * El difuminado de los bordes es lo único que avisa de que hay más: sin
 * barra de scroll y sin sombra, una fila cortada justo en el borde parece
 * una fila que se acabó.
 */
export function Carrusel({
  etiqueta,
  sangra = false,
  className = '',
  children,
}: {
  etiqueta: string
  /** Estira el scroll hasta el borde del contenedor, salteando su padding. */
  sangra?: boolean
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const [lados, setLados] = useState({ izq: false, der: false })

  const medir = useCallback(() => {
    const el = ref.current
    if (!el) return

    const max = el.scrollWidth - el.clientWidth
    // 1px de tolerancia: con zoom o en pantallas de densidad fraccionaria,
    // `scrollLeft` nunca llega a ser exactamente igual al máximo.
    const izq = el.scrollLeft > 1
    const der = el.scrollLeft < max - 1

    // Devolver el MISMO objeto cuando no cambió nada no es un detalle: el
    // efecto de abajo corre en cada render, y un objeto nuevo — aunque
    // tenga los mismos valores — vuelve a renderizar y se realimenta.
    setLados((previo) =>
      previo.izq === izq && previo.der === der ? previo : { izq, der },
    )
  }, [])

  // Sin arreglo de dependencias, a propósito: los chips cambian cuando
  // cambian los filtros, y eso el ResizeObserver no lo ve — solo mira el
  // ancho de la caja, que no se mueve.
  useEffect(medir)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.addEventListener('scroll', medir, { passive: true })
    const observador = new ResizeObserver(medir)
    observador.observe(el)

    return () => {
      el.removeEventListener('scroll', medir)
      observador.disconnect()
    }
  }, [medir])

  const capa = mascara(lados.izq, lados.der)

  return (
    <nav
      ref={ref}
      aria-label={etiqueta}
      style={{ maskImage: capa, WebkitMaskImage: capa }}
      className={`flex gap-2 overflow-x-auto py-1.5 [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden ${sangra ? '-mx-4 px-4' : ''} ${className}`}
    >
      {children}
    </nav>
  )
}
