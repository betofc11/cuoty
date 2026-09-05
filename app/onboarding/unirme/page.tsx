import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'

import { UnirmeForm } from './unirme-form'

export default async function UnirmePage() {
  await requireUser()

  return (
    <>
      <BackLink href="/onboarding">Volver</BackLink>

      <header className="flex flex-col gap-2">
        <h1 className="text-tinta text-2xl font-semibold">Unirme con un código</h1>
        <p className="text-tinta-suave text-base">
          Pedíselo a quien administra la casa.
        </p>
      </header>

      <UnirmeForm />
    </>
  )
}
