import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Logo } from '@/components/ui/logo'
import { misCasas, requireUser } from '@/lib/auth/session'

export default async function OnboardingPage() {
  const { user } = await requireUser()
  const casas = await misCasas()

  // Ya tiene casa: acá no pinta nada.
  if (casas.length > 0) redirect('/')

  return (
    <>
      <header className="flex flex-col gap-3">
        <Logo />
        <h1 className="text-tinta text-2xl font-semibold">
          Todavía no estás en ninguna casa
        </h1>
        <p className="text-tinta-suave text-base">
          Una casa es donde se comparten los gastos fijos y la lista de compras. Creá la
          tuya o entrá a una con el código que te pasaron.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <Link
          href="/onboarding/crear"
          className="min-h-touch bg-crc flex items-center justify-center rounded-2xl
                     px-5 text-base font-semibold text-white"
        >
          Crear una casa
        </Link>
        <Link
          href="/onboarding/unirme"
          className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                     justify-center rounded-2xl border px-5 text-base font-semibold"
        >
          Unirme con un código
        </Link>
        <p className="text-tinta-suave text-center text-sm">
          El código se ve así: <span className="text-tinta font-medium">CASA-4F2X</span>
        </p>
      </div>

      <footer className="border-borde flex items-center justify-between gap-3 border-t pt-4">
        <span className="text-tinta-suave truncate text-sm">{user.email}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="min-h-touch text-crc px-2 text-base font-semibold">
            Salir
          </button>
        </form>
      </footer>
    </>
  )
}
