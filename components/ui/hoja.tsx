'use client'

import { useEffect, useId, useRef } from 'react'

/**
 * Hoja inferior, como las de iOS: sube desde el borde de abajo, donde llega el
 * pulgar. Los menús que se abrían bajo el disparador de arriba quedaban en la
 * zona más difícil de alcanzar con una mano en un teléfono grande.
 *
 * Es un `<dialog>` modal de verdad: trae el fondo oscurecido, atrapa el foco y
 * se cierra con Esc sin código propio. Se cierra también tocando el fondo o
 * «Cerrar», que va con su palabra: un ícono solo no cabe en las cuatro
 * excepciones de CLAUDE.md.
 *
 * Ojo: el `<dialog>` NO lleva clases de display (`flex`, `grid`). Pisarían el
 * `display: none` con el que el navegador lo esconde cerrado, y la hoja
 * quedaría siempre a la vista. El layout va en el `div` de adentro.
 */
export function Hoja({
  abierta,
  onCerrar,
  titulo,
  children,
}: {
  abierta: boolean
  onCerrar: () => void
  titulo: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierta && !dialogo.open) {
      dialogo.showModal()
      // `showModal` enfoca el primer botón («Cerrar») y lo marca con el anillo
      // de foco. Con el foco en la hoja, el lector de pantalla anuncia su
      // título y no queda un botón resaltado sin que nadie lo haya tocado.
      dialogo.focus()
    }
    if (!abierta && dialogo.open) dialogo.close()
  }, [abierta])

  // Con la hoja abierta, el dedo que arrastra no tiene que mover la página de
  // atrás.
  useEffect(() => {
    if (!abierta) return
    const raiz = document.documentElement
    const previo = raiz.style.overflow
    raiz.style.overflow = 'hidden'
    return () => {
      raiz.style.overflow = previo
    }
  }, [abierta])

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby={idTitulo}
      // Esc, o el `close()` del efecto: el estado del padre tiene que enterarse.
      onClose={onCerrar}
      // Un toque en el fondo oscuro llega con el propio `<dialog>` como
      // destino; uno adentro, con el elemento que se tocó.
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
      className="border-borde bg-superficie-alta text-tinta max-w-app motion-safe:animate-hoja fixed inset-x-0
                 top-auto bottom-0 mx-auto my-0 max-h-[85dvh] w-full overflow-y-auto overscroll-contain
                 rounded-t-3xl border-t p-0 outline-none backdrop:bg-black/40"
    >
      <div className="flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4">
          <h2 id={idTitulo} className="text-tinta text-base font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-touch text-marca px-3 text-base font-semibold"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
