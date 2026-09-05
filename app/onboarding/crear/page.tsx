import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'

import { CrearForm } from './crear-form'

export default async function CrearCasaPage() {
  await requireUser()

  return (
    <>
      <BackLink href="/onboarding">Volver</BackLink>

      <header className="flex flex-col gap-2">
        <h1 className="text-tinta text-2xl font-semibold">Crear una casa</h1>
        <p className="text-tinta-suave text-base">
          Después le pasás el código a los demás para que entren.
        </p>
      </header>

      <CrearForm />
    </>
  )
}
