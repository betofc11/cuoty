import { redirect } from 'next/navigation'

import { Logo } from '@/components/ui/logo'
import { misCasas, requireUser } from '@/lib/auth/session'

/**
 * Aterrizaje temporal de la fase 4. El shell real —navbar, selector de casa y
 * tabs— llega en la fase 5 y reemplaza esta pantalla.
 */
export default async function Page() {
  const { user } = await requireUser()
  const casas = await misCasas()

  if (casas.length === 0) redirect('/onboarding')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <Logo size="chico" />
        <p className="text-tinta-suave text-base">Sesión iniciada como {user.email}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h1 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
          {casas.length === 1 ? 'Mi casa' : 'Mis casas'}
        </h1>

        {casas.map((casa) => (
          <div
            key={casa.membershipId}
            className="border-borde bg-superficie flex items-center gap-3 rounded-2xl border p-4"
          >
            <span
              aria-hidden="true"
              className="bg-crc flex size-10 shrink-0 items-center justify-center
                         rounded-xl text-lg font-semibold text-white"
            >
              {casa.nombre.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-tinta truncate text-base font-semibold">
                {casa.nombre}
              </span>
              <span className="text-tinta-suave text-sm">
                {casa.rol === 'admin' ? 'Administrás esta casa' : 'Sos miembro'}
              </span>
            </span>
          </div>
        ))}
      </section>

      <p className="text-tinta-suave text-sm">
        El tablero, los gastos y la lista de compras llegan en las siguientes fases.
      </p>

      <footer className="border-borde mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <a href="/onboarding/unirme" className="min-h-touch text-crc flex items-center px-2 text-base font-semibold">
          Unirme a otra casa
        </a>
        <form action="/auth/signout" method="post">
          <button type="submit" className="min-h-touch text-tinta-suave px-2 text-base">
            Salir
          </button>
        </form>
      </footer>
    </main>
  )
}
