'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Los íconos nunca van solos: cada uno lleva su etiqueta debajo. */
const TABS = [
  {
    href: '/',
    texto: 'Dashboard',
    d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  },
  {
    href: '/gastos',
    texto: 'Gastos',
    d: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 5h10M7 14h6',
  },
  {
    href: '/compras',
    texto: 'Compras',
    d: 'M4 5h2l2.2 10.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.8L20 8H7m2 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  },
] as const

export function Tabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Secciones"
      // El sticky y el safe-area viven en el contenedor del Shell, que
      // envuelve estas tabs y el pie de la página.
      className="border-borde bg-superficie-alta grid grid-cols-3 border-t"
    >
      {TABS.map((tab) => {
        const activo = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={activo ? 'page' : undefined}
            className={`min-h-touch flex flex-col items-center justify-center gap-1 py-2
                        text-xs font-medium ${activo ? 'text-crc' : 'text-tinta-suave'}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
            >
              <path d={tab.d} />
            </svg>
            {tab.texto}
          </Link>
        )
      })}
    </nav>
  )
}
