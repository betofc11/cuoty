'use client'

import { useEffect, useRef } from 'react'

/**
 * Trae a la vista el `<details>` que lo contiene, una vez, al montarse.
 *
 * Existe por «Volver» desde un mes del arrastre, que regresa a
 * `/gastos?arrastre=abierto#arrastre`. El salto al `#arrastre` de Next no
 * alcanza: la pestaña muestra primero su `loading.tsx`, Next busca el id
 * mientras está el esqueleto, no lo encuentra y queda arriba de todo, con el
 * desplegable abierto pero al pie y fuera de la pantalla.
 *
 * Sin estado y con dependencias vacías: corre una sola vez y no puede entrar en
 * un bucle de renders (ver la trampa del `Carrusel` en CLAUDE.md).
 */
export function TraerALaVista() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    ref.current?.closest('details')?.scrollIntoView({ block: 'start' })
  }, [])

  return <span ref={ref} hidden />
}
