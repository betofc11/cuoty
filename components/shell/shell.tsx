import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

import { Navbar } from './navbar'
import { Tabs } from './tabs'

/**
 * El shell es un componente, no un layout de grupo de rutas: `app/page.tsx` ya
 * ocupa "/" y no puedo borrarlo desde acá. Cada página lo envuelve. Cuando se
 * pueda mover el archivo, esto pasa a ser `app/(app)/layout.tsx` sin cambiar
 * nada más.
 */
export async function Shell({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser()
  const { activa, casas } = await contextoDeCasa()

  const meta = user.user_metadata as { full_name?: string } | undefined
  const inicial = (meta?.full_name ?? user.email ?? '?').trim().charAt(0).toUpperCase()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col">
      <Navbar activa={activa} casas={casas} inicial={inicial || '?'} />
      <main className="flex-1 px-4 py-5">{children}</main>
      <Tabs />
    </div>
  )
}
