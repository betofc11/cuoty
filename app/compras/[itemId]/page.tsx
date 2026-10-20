import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { fotosDeItem } from '@/lib/compras/consultas'

import { Fotos } from './fotos'

/**
 * Las fotos de un item. Se llega desde la hoja de edición, con «Agregar una
 * foto» o «Ver las fotos». Hasta la fase 4 esta página tenía también el
 * formulario viejo, con «Guardar cambios»: repetía la hoja, y era la única
 * pantalla que guardaba de otra forma. Subir una foto es la cámara y Storage,
 * y eso no cabe en una hoja pensada para cambios de un toque.
 */
export default async function FotosPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = await params
  const { activa } = await contextoDeCasa()
  const item = await fotosDeItem(itemId)

  if (!item) notFound()

  const { supabase } = await requireUser()

  // El bucket es privado: la foto se sirve con URL firmada, que vence
  // sola. Nada de hacerlo público para ahorrarse esta línea.
  const rutas = item.fotos.map((f) => f.ruta)
  const { data: firmadas } = rutas.length
    ? await supabase.storage.from('item-photos').createSignedUrls(rutas, 60 * 60)
    : { data: [] }

  const urlPorRuta = new Map(
    (firmadas ?? []).flatMap((f) =>
      f.path && f.signedUrl ? [[f.path, f.signedUrl] as [string, string]] : [],
    ),
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-6 px-4 pt-5 pb-seguro">
      <BackLink href="/compras">Volver a la lista</BackLink>

      <h1 className="text-tinta text-xl font-semibold">{item.producto}</h1>

      <Fotos
        itemId={item.id}
        casaId={activa.id}
        fotos={item.fotos.map((f) => ({
          id: f.id,
          tipo: f.tipo,
          url: urlPorRuta.get(f.ruta) ?? null,
        }))}
      />
    </div>
  )
}
