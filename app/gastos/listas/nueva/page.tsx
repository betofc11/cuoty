import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/back-link'
import { contextoDeCasa } from '@/lib/casas/activa'

import { FormLista } from './form-lista'

export default async function NuevaListaPage() {
  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') notFound()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-5 p-4 py-5">
      <BackLink href="/gastos">Volver</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Nueva lista</h1>
        <p className="text-tinta-suave text-base">
          Una lista agrupa gastos que se reparten igual: Servicios, Casa, Suscripciones.
        </p>
      </header>

      <FormLista />
    </div>
  )
}
