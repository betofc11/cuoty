import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { esHoyCR } from '@/lib/fechas'

import { contiene } from './texto'
import { tonoPorPosicion } from './tonos'

export type Filtros = {
  tienda: string | null
  tag: string | null
  q: string
}

export type TiendaVista = { id: string; nombre: string; esPredeterminada: boolean }
/** `tono` es 1..TONOS y sale de la posición en la lista de la casa. */
export type TagVista = { id: string; nombre: string; tono: number }

export type ItemVista = {
  id: string
  producto: string
  cantidad: string | null
  nota: string | null
  comprado: boolean
  tienda: TiendaVista
  tags: TagVista[]
  agregadoPor: string
  compradoPor: string | null
  compradoEl: string | null
  fotos: number
}

/** La tienda con cuántos pendientes tiene: el chip de filtro lleva el número. */
export type TiendaConteo = TiendaVista & { pendientes: number }

export type VistaCompras = {
  /** Pendientes que pasaron el filtro. Lista plana: la tienda va en la fila. */
  items: ItemVista[]
  /** Marcados hoy. Quedan a la vista para poder deshacer el toque. */
  compradosHoy: ItemVista[]
  /** Marcados antes de hoy. Viven en el acordeón del pie. */
  compradosAntes: ItemVista[]
  /** Solo las tiendas con pendientes, más la que esté filtrada. */
  tiendas: TiendaConteo[]
  /** Solo las etiquetas que algún pendiente usa, más la que esté filtrada. */
  tags: TagVista[]
  /** Conteos de la casa entera: no los toca ningún filtro. */
  totalPendientes: number
  totalComprados: number
  /** Distingue "la casa no tiene nada" de "el filtro no encontró nada". */
  listaVacia: boolean
}

export function leerFiltros(params: { tienda?: string; tag?: string; q?: string }): Filtros {
  return {
    tienda: params.tienda || null,
    tag: params.tag || null,
    q: (params.q ?? '').trim(),
  }
}

/**
 * Todo lo que necesita la pantalla de Compras.
 *
 * En la lista de compras no hay roles: cualquier miembro agrega, marca y
 * borra. Lo único de admin son las tiendas, y eso lo decide RLS.
 */
export async function vistaDeCompras(filtros: Filtros): Promise<VistaCompras> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const [{ data: filasTiendas }, { data: filasTags }, { data: filasItems }] =
    await Promise.all([
      supabase
        .from('stores')
        .select('id, name, is_default')
        .eq('house_id', activa.id)
        .order('is_default', { ascending: false })
        .order('name'),
      supabase.from('tags').select('id, name').eq('house_id', activa.id).order('name'),
      // RLS deja ver los items de TODAS mis casas: sin el filtro por
      // house_id se mezclarían las listas de dos casas distintas.
      supabase
        .from('shopping_items')
        .select(
          'id, product_id, store_id, quantity, note, status, added_by, purchased_by, purchased_at, created_at',
        )
        .eq('house_id', activa.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false }),
    ])

  const tiendas: TiendaVista[] = (filasTiendas ?? []).map((t) => ({
    id: t.id,
    nombre: t.name,
    esPredeterminada: t.is_default,
  }))
  // El tono sale del orden alfabético de TODAS las etiquetas de la casa,
  // no de las que sobrevivan al filtro: si no, el color de una etiqueta
  // cambiaría según lo que estés filtrando.
  const tags: TagVista[] = (filasTags ?? []).map((t, i) => ({
    id: t.id,
    nombre: t.name,
    tono: tonoPorPosicion(i),
  }))

  const items = filasItems ?? []
  const ids = items.map((i) => i.id)
  const productIds = [...new Set(items.map((i) => i.product_id))]

  // Sin condicionales: `in` con un arreglo vacío es válido y devuelve
  // cero filas. Envolver esto en ternarios solo ensucia los tipos.
  const [{ data: filasProductos }, { data: filasItemTags }, { data: filasFotos }, { data: filasPerfiles }] =
    await Promise.all([
      supabase.from('products').select('id, name').in('id', productIds),
      supabase.from('item_tags').select('item_id, tag_id').in('item_id', ids),
      supabase.from('item_photos').select('item_id').in('item_id', ids),
      supabase.from('profiles').select('id, display_name'),
    ])

  const nombreProducto = new Map((filasProductos ?? []).map((p) => [p.id, p.name]))
  const tiendaPorId = new Map(tiendas.map((t) => [t.id, t]))
  const tagPorId = new Map(tags.map((t) => [t.id, t]))
  const nombrePersona = new Map((filasPerfiles ?? []).map((p) => [p.id, p.display_name]))

  const tagsPorItem = new Map<string, TagVista[]>()
  for (const fila of filasItemTags ?? []) {
    const tag = tagPorId.get(fila.tag_id)
    if (!tag) continue
    tagsPorItem.set(fila.item_id, [...(tagsPorItem.get(fila.item_id) ?? []), tag])
  }

  const fotosPorItem = new Map<string, number>()
  for (const fila of filasFotos ?? []) {
    fotosPorItem.set(fila.item_id, (fotosPorItem.get(fila.item_id) ?? 0) + 1)
  }

  const vistas: ItemVista[] = []
  let pendientes = 0
  let comprados = 0

  for (const i of items) {
    const tienda = tiendaPorId.get(i.store_id)
    if (!tienda) continue

    const comprado = i.status === 'purchased'
    if (comprado) comprados += 1
    else pendientes += 1

    vistas.push({
      id: i.id,
      producto: nombreProducto.get(i.product_id) ?? 'Sin nombre',
      cantidad: i.quantity,
      nota: i.note,
      comprado,
      tienda,
      tags: (tagsPorItem.get(i.id) ?? []).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      agregadoPor: (i.added_by && nombrePersona.get(i.added_by)) || 'Alguien',
      compradoPor: (i.purchased_by && nombrePersona.get(i.purchased_by)) || null,
      compradoEl: i.purchased_at,
      fotos: fotosPorItem.get(i.id) ?? 0,
    })
  }

  // Los tres filtros van sueltos: los chips de tienda se cuentan con el
  // resto puesto pero sin el suyo propio, o «Walmart 4» diría siempre 4
  // aunque estés viendo Automercado.
  const porTienda = (i: ItemVista) => !filtros.tienda || i.tienda.id === filtros.tienda
  const porTag = (i: ItemVista) => !filtros.tag || i.tags.some((t) => t.id === filtros.tag)
  const porTexto = (i: ItemVista) => {
    if (!filtros.q) return true
    return contiene(i.producto, filtros.q) || (i.nota ? contiene(i.nota, filtros.q) : false)
  }

  const pasaTodo = (i: ItemVista) => porTienda(i) && porTag(i) && porTexto(i)

  const sinComprar = vistas.filter((i) => !i.comprado)
  const yaComprados = vistas.filter((i) => i.comprado)

  const conteoTiendas: TiendaConteo[] = tiendas
    .map((t) => ({
      ...t,
      pendientes: sinComprar.filter(
        (i) => i.tienda.id === t.id && porTag(i) && porTexto(i),
      ).length,
    }))
    // Una tienda sin nada que comprar no es un filtro, es ruido. La
    // filtrada se queda aunque llegue a cero: si no, desaparece el único
    // chip que sirve para volver atrás.
    .filter((t) => t.pendientes > 0 || t.id === filtros.tienda)

  const usadas = new Set(
    sinComprar.filter((i) => porTienda(i) && porTexto(i)).flatMap((i) => i.tags.map((t) => t.id)),
  )
  const tagsEnUso = tags.filter((t) => usadas.has(t.id) || t.id === filtros.tag)

  // Lo marcado hoy no se va de la lista: si al tocar la casilla el item
  // desapareciera, deshacer un toque errado obligaría a abrir el acordeón.
  const compradosFiltrados = yaComprados.filter(pasaTodo)

  return {
    items: sinComprar.filter(pasaTodo),
    compradosHoy: compradosFiltrados.filter((i) => i.compradoEl && esHoyCR(i.compradoEl)),
    compradosAntes: compradosFiltrados.filter((i) => !i.compradoEl || !esHoyCR(i.compradoEl)),
    tiendas: conteoTiendas,
    tags: tagsEnUso,
    totalPendientes: pendientes,
    totalComprados: comprados,
    listaVacia: vistas.length === 0,
  }
}

export type DetalleItem = ItemVista & {
  fotosDetalle: { id: string; ruta: string; tipo: 'producto' | 'etiqueta' }[]
}

export async function detalleDeItem(itemId: string): Promise<DetalleItem | null> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: item } = await supabase
    .from('shopping_items')
    .select(
      'id, product_id, store_id, quantity, note, status, added_by, purchased_by, purchased_at',
    )
    .eq('id', itemId)
    .eq('house_id', activa.id)
    .maybeSingle()

  if (!item) return null

  const [{ data: producto }, { data: tienda }, { data: filasTags }, { data: fotos }, { data: perfiles }] =
    await Promise.all([
      supabase.from('products').select('name').eq('id', item.product_id).maybeSingle(),
      supabase
        .from('stores')
        .select('id, name, is_default')
        .eq('id', item.store_id)
        .maybeSingle(),
      supabase.from('item_tags').select('tag_id').eq('item_id', item.id),
      supabase
        .from('item_photos')
        .select('id, storage_path, kind')
        .eq('item_id', item.id)
        .order('created_at'),
      supabase.from('profiles').select('id, display_name'),
    ])

  if (!tienda) return null

  // Se piden TODAS las etiquetas de la casa y no solo las del item: el
  // tono depende de la posición en esa lista, así que recortarla antes
  // daría un color distinto acá que en la lista.
  const ids = new Set((filasTags ?? []).map((t) => t.tag_id))
  const { data: todas } = await supabase
    .from('tags')
    .select('id, name')
    .eq('house_id', activa.id)
    .order('name')

  const tags: TagVista[] = (todas ?? [])
    .map((t, i) => ({ id: t.id, nombre: t.name, tono: tonoPorPosicion(i) }))
    .filter((t) => ids.has(t.id))

  const nombrePersona = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))

  return {
    id: item.id,
    producto: producto?.name ?? 'Sin nombre',
    cantidad: item.quantity,
    nota: item.note,
    comprado: item.status === 'purchased',
    tienda: { id: tienda.id, nombre: tienda.name, esPredeterminada: tienda.is_default },
    tags,
    agregadoPor: (item.added_by && nombrePersona.get(item.added_by)) || 'Alguien',
    compradoPor: (item.purchased_by && nombrePersona.get(item.purchased_by)) || null,
    compradoEl: item.purchased_at,
    fotos: (fotos ?? []).length,
    fotosDetalle: (fotos ?? []).map((f) => ({
      id: f.id,
      ruta: f.storage_path,
      tipo: f.kind,
    })),
  }
}
