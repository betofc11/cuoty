import Link from 'next/link'

import { Logo } from '@/components/ui/logo'
import type { Casa } from '@/lib/auth/session'

import { SelectorCasa } from './selector-casa'

export function Navbar({
  activa,
  casas,
  inicial,
}: {
  activa: Casa
  casas: Casa[]
  inicial: string
}) {
  return (
    <header
      className="border-borde bg-superficie-alta sticky top-0 z-20 flex items-center
                 gap-2 border-b px-4 py-2"
    >
      <Link href="/" aria-label="Cuoty · ir al dashboard" className="min-h-touch flex items-center">
        <Logo size="chico" />
      </Link>

      <SelectorCasa activa={activa} casas={casas} />

      <Link
        href="/cuenta"
        aria-label="Mi cuenta"
        className="border-borde bg-superficie text-tinta flex size-10 shrink-0
                   items-center justify-center rounded-full border text-base font-semibold"
      >
        {inicial}
      </Link>
    </header>
  )
}
