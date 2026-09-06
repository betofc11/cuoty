import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/back-link'
import { contextoDeCasa } from '@/lib/casas/activa'
import { vistaDePorcentajes } from '@/lib/gastos/porcentajes'

import { EditorPorcentajes } from './editor'

export default async function PorcentajesPage({
  params,
}: {
  params: Promise<{ listaId: string }>
}) {
  const { listaId } = await params
  const { activa } = await contextoDeCasa()

  // Repartir es del admin. Al miembro no se le muestra bloqueado: no existe.
  if (activa.rol !== 'admin') notFound()

  const vista = await vistaDePorcentajes(listaId)
  if (!vista) notFound()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-5 p-4 py-5">
      <BackLink href="/gastos">Volver</BackLink>
      <EditorPorcentajes vista={vista} />
    </div>
  )
}
