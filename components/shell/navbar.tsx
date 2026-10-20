import Link from 'next/link'

import { Avatar } from '@/components/ui/avatar'
import { Logo } from '@/components/ui/logo'
import type { Casa } from '@/lib/auth/session'

import { SelectorCasa } from './selector-casa'

export function Navbar({
  activa,
  casas,
  inicial,
  tono,
}: {
  activa: Casa
  casas: Casa[]
  inicial: string
  /** Mi tono en la casa activa: el mismo con el que me ven en los saldos. */
  tono: number
}) {
  return (
    // Del color del fondo y no de la superficie: es lo que queda justo bajo la
    // barra de estado, que iOS pinta con el `theme-color` (el fondo). Las
    // pantallas de detalle arrancan con el fondo también, así no hay costura.
    <header
      className="border-borde bg-fondo sticky top-0 z-20 border-b pt-[calc(env(safe-area-inset-top)+0.5rem)]
                 pb-2"
    >
      <div className="max-w-app mx-auto flex items-center gap-2 px-4">
        <Link href="/" aria-label="Cuoty · ir al inicio" className="min-h-touch flex items-center">
          <Logo size="chico" />
        </Link>

        <SelectorCasa activa={activa} casas={casas} />

        {/* El círculo mide 40 pero se toca en 48, como todo target de la app. */}
        <Link
          href="/cuenta"
          aria-label="Mi cuenta"
          className="flex size-12 shrink-0 items-center justify-center"
        >
          <Avatar inicial={inicial} tono={tono} tamano="grande" />
        </Link>
      </div>
    </header>
  )
}
