import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

import { borrarTag, crearTag } from '../acciones'
import { Gestor, type FilaGestor } from '../gestor'

export default async function EtiquetasPage() {
  const { activa } = await contextoDeCasa()
  const { supabase } = await requireUser()

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('house_id', activa.id)
    .order('name')

  const ids = (tags ?? []).map((t) => t.id)
  const { data: usos } = await supabase.from('item_tags').select('tag_id').in('tag_id', ids)

  const conteo = new Map<string, number>()
  for (const u of usos ?? []) conteo.set(u.tag_id, (conteo.get(u.tag_id) ?? 0) + 1)

  const filas: FilaGestor[] = (tags ?? []).map((t) => {
    const n = conteo.get(t.id) ?? 0
    return {
      id: t.id,
      nombre: t.name,
      detalle: n > 0 ? `En ${n} ${n === 1 ? 'item' : 'items'}` : undefined,
    }
  })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/compras">Volver a la lista</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Etiquetas</h1>
        <p className="text-tinta-suave text-base">
          Para filtrar la lista por tipo de cosa: frescos, limpieza, despensa. Acá no hay
          roles: cualquiera de la casa las maneja.
        </p>
      </header>

      <Gestor
        filas={filas}
        campoId="etiqueta"
        etiquetaCampo="Nombre de la etiqueta"
        placeholder="Frescos, Limpieza…"
        maxLength={30}
        crear={crearTag}
        borrar={borrarTag}
        nombreCampoBorrar="tagId"
        vacio="Todavía no hay etiquetas."
      />

      <p className="text-tinta-suave text-sm">
        Borrar una etiqueta no borra ningún item: solo se la quita a los que la tenían.
      </p>
    </div>
  )
}
