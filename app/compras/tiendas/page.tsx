import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

import { borrarTienda, crearTienda } from '../acciones'
import { Gestor, type FilaGestor } from '../gestor'

export default async function TiendasPage() {
  const { activa } = await contextoDeCasa()
  // Las tiendas son del admin: la política `stores_write` ya lo exige,
  // así que la pantalla ni existe para el resto.
  if (activa.rol !== 'admin') notFound()

  const { supabase } = await requireUser()

  const [{ data: tiendas }, { data: items }] = await Promise.all([
    supabase
      .from('stores')
      .select('id, name, is_default')
      .eq('house_id', activa.id)
      .order('is_default', { ascending: false })
      .order('name'),
    supabase
      .from('shopping_items')
      .select('store_id')
      .eq('house_id', activa.id)
      .is('archived_at', null),
  ])

  const conteo = new Map<string, number>()
  for (const i of items ?? []) {
    conteo.set(i.store_id, (conteo.get(i.store_id) ?? 0) + 1)
  }

  const filas: FilaGestor[] = (tiendas ?? []).map((t) => {
    const usos = conteo.get(t.id) ?? 0
    return {
      id: t.id,
      nombre: t.name,
      fijo: t.is_default ? 'Por defecto' : undefined,
      detalle:
        usos > 0 ? `${usos} ${usos === 1 ? 'item en la lista' : 'items en la lista'}` : undefined,
    }
  })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/compras">Volver a la lista</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Tiendas</h1>
        <p className="text-tinta-suave text-base">
          Sirven para agrupar la lista: en el super uno ve solo lo de ese super. Cuando no
          importa dónde, el item queda en «Cualquiera».
        </p>
      </header>

      <Gestor
        filas={filas}
        campoId="tienda"
        etiquetaCampo="Nombre de la tienda"
        placeholder="Walmart, PriceSmart…"
        maxLength={40}
        crear={crearTienda}
        borrar={borrarTienda}
        nombreCampoBorrar="tiendaId"
        vacio="Todavía no hay tiendas."
      />
    </div>
  )
}
