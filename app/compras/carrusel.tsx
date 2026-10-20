'use client'

import { useEffect, useRef, useState } from 'react'

/** Ancho del difuminado de los bordes, en px. */
const DESVANECIDO = 24

/**
 * La máscara se arma según haya scroll para un lado, para el otro o para
 * los dos. Va como `mask-image` y no como un degradado encima: la máscara
 * desvanece el CONTENIDO sin que haya que saber contra qué fondo está, y el
 * fondo cambia con el tema.
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
  // Lo último que se le pidió a React que pinte.
  const pintado = useRef(lados)

  /*
    Se mide en un solo efecto y con observadores, NUNCA en un efecto sin
    dependencias. Antes era `useEffect(medir)`, que corre después de cada
    render, con un `setLados` que devolvía el mismo objeto si nada cambiaba.
    En algunas cargas eso entró en un bucle de ~3.800 renders por segundo que
    no cambiaba nada en pantalla, pero no dejaba a React terminar ninguna
    transición: tocar una pestaña no navegaba. `tests/e2e/navegacion.spec.ts`
    lo prueba desde Compras.

    Y la comparación va contra una ref, antes de llamar a `setLados`: sin
    cambio, no se le pide nada a React.
  */
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const medir = () => {
      const max = el.scrollWidth - el.clientWidth
      // 1px de tolerancia: con zoom o en pantallas de densidad fraccionaria,
      // `scrollLeft` nunca llega a ser exactamente igual al máximo.
      const izq = el.scrollLeft > 1
      const der = el.scrollLeft < max - 1

      if (pintado.current.izq === izq && pintado.current.der === der) return
      pintado.current = { izq, der }
      setLados(pintado.current)
    }

    // El chip elegido tiene que verse: con «Walmart» al final de la fila, la
    // tienda elegida quedaba tapada contra el borde y no se sabía cuál era.
    // Se trae a la vista, fuera del difuminado, sin mover la página.
    const mostrarElegido = () => {
      const elegido = el.querySelector<HTMLElement>('[aria-current="true"]')
      if (!elegido) return
      const caja = el.getBoundingClientRect()
      const chip = elegido.getBoundingClientRect()
      if (chip.right > caja.right - DESVANECIDO) {
        el.scrollLeft += chip.right - caja.right + DESVANECIDO
      } else if (chip.left < caja.left + DESVANECIDO) {
        el.scrollLeft -= caja.left + DESVANECIDO - chip.left
      }
    }

    mostrarElegido()
    medir()
    el.addEventListener('scroll', medir, { passive: true })
    // El ancho de la caja: girar el teléfono, cambiar el tamaño de letra.
    const caja = new ResizeObserver(medir)
    caja.observe(el)
    // Los chips cambian con los filtros, y eso el ResizeObserver no lo ve
    // porque la caja no cambia de ancho. De los atributos, solo
    // `aria-current`: la máscara es un atributo de la propia caja, y
    // observarla realimentaría.
    const chips = new MutationObserver(() => {
      mostrarElegido()
      medir()
    })
    chips.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: ['aria-current'],
    })

    return () => {
      el.removeEventListener('scroll', medir)
      caja.disconnect()
      chips.disconnect()
    }
  }, [])

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
