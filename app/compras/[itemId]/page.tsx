import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { detalleDeItem } from '@/lib/compras/consultas'
import { tonoPorPosicion } from '@/lib/compras/tonos'
import { fechaCorta } from '@/lib/fechas'

import { EditorItem } from './editor'
import { Fotos } from './fotos'

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = await params
  const { activa } = await contextoDeCasa()
  const item = await detalleDeItem(itemId)

  if (!item) notFound()

  const { supabase } = await requireUser()

  const [{ data: tiendas }, { data: tags }] = await Promise.all([
    supabase
      .from('stores')
      .select('id, name, is_default')
      .eq('house_id', activa.id)
      .order('is_default', { ascending: false })
      .order('name'),
    supabase.from('tags').select('id, name').eq('house_id', activa.id).order('name'),
  ])

  // El bucket es privado: la foto se sirve con URL firmada, que vence
  // sola. Nada de hacerlo público para ahorrarse esta línea.
  const rutas = item.fotosDetalle.map((f) => f.ruta)
  const { data: firmadas } = rutas.length
    ? await supabase.storage.from('item-photos').createSignedUrls(rutas, 60 * 60)
    : { data: [] }

  const urlPorRuta = new Map(
    (firmadas ?? []).flatMap((f) =>
      f.path && f.signedUrl ? [[f.path, f.signedUrl] as [string, string]] : [],
    ),
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/compras">Volver a la lista</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">{item.producto}</h1>
        <p className="text-tinta-suave text-base">
          Lo anotó {item.agregadoPor}.
          {item.comprado && item.compradoPor && item.compradoEl
            ? ` Lo compró ${item.compradoPor} el ${fechaCorta(item.compradoEl)}.`
            : ''}
        </p>
      </header>

      <EditorItem
        item={item}
        tiendas={(tiendas ?? []).map((t) => ({
          id: t.id,
          nombre: t.name,
          esPredeterminada: t.is_default,
        }))}
        // `tags` viene ordenado por nombre, que es de donde sale el tono.
        tags={(tags ?? []).map((t, i) => ({
          id: t.id,
          nombre: t.name,
          tono: tonoPorPosicion(i),
        }))}
      />

      <Fotos
        itemId={item.id}
        casaId={activa.id}
        fotos={item.fotosDetalle.map((f) => ({
          id: f.id,
          tipo: f.tipo,
          url: urlPorRuta.get(f.ruta) ?? null,
        }))}
      />
    </div>
  )
}
