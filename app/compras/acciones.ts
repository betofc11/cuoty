'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

export type EstadoCompras = { error?: string; ok?: string }

/** Un solo lugar donde se decide qué se le muestra al usuario ante un fallo. */
function fallo(mensaje: string): EstadoCompras {
  return { error: mensaje }
}

/**
 * Recorta las puntas y colapsa los espacios de adentro, igual que hace
 * `add_shopping_item` con el nombre del producto. Sin esto, "Café  Britt"
 * y "Café Britt" son dos cosas distintas para el índice único.
 */
function limpiar(valor: FormDataEntryValue | null): string {
  return String(valor ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function refrescar(itemId?: string) {
  revalidatePath('/compras')
  if (itemId) revalidatePath(`/compras/${itemId}`)
}

// ─────────────────────────────── items ───────────────────────────────

export async function agregarItem(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) return fallo('Escribí qué hay que comprar.')
  if (nombre.length > 80) return fallo('El nombre es muy largo (máximo 80).')

  const tiendaId = String(formData.get('tiendaId') ?? '') || null
  const cantidad = String(formData.get('cantidad') ?? '').trim() || null
  const nota = String(formData.get('nota') ?? '').trim() || null
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { error } = await supabase.rpc('add_shopping_item', {
    p_house_id: activa.id,
    p_name: nombre,
    p_store_id: tiendaId ?? undefined,
    p_quantity: cantidad ?? undefined,
    p_note: nota ?? undefined,
    p_tag_ids: tagIds,
  })

  if (error) return fallo(error.message)

  refrescar()
  return { ok: `Se agregó ${nombre}.` }
}

export async function alternarComprado(formData: FormData): Promise<void> {
  const itemId = String(formData.get('itemId') ?? '')
  const comprar = String(formData.get('comprar') ?? '') === 'si'
  if (!itemId) return

  const { supabase, user } = await requireUser()

  // purchased_at y status van juntos o el CHECK del esquema rechaza la
  // fila: no hay forma de dejar un "comprado sin fecha".
  await supabase
    .from('shopping_items')
    .update(
      comprar
        ? { status: 'purchased', purchased_at: new Date().toISOString(), purchased_by: user.id }
        : { status: 'pending', purchased_at: null, purchased_by: null },
    )
    .eq('id', itemId)

  refrescar(itemId)
}

export async function editarItem(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  const itemId = String(formData.get('itemId') ?? '')
  if (!itemId) return fallo('No encontramos ese item.')

  const tiendaId = String(formData.get('tiendaId') ?? '')
  if (!tiendaId) return fallo('Elegí una tienda.')

  const cantidad = String(formData.get('cantidad') ?? '').trim() || null
  const nota = String(formData.get('nota') ?? '').trim() || null
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)

  const { supabase } = await requireUser()

  const { error } = await supabase
    .from('shopping_items')
    .update({ store_id: tiendaId, quantity: cantidad, note: nota })
    .eq('id', itemId)

  if (error) return fallo(error.message)

  // Los tags se reemplazan enteros: comparar cuáles entraron y cuáles
  // salieron cuesta más que rehacerlos, y son tres filas.
  await supabase.from('item_tags').delete().eq('item_id', itemId)
  if (tagIds.length > 0) {
    const { error: errorTags } = await supabase
      .from('item_tags')
      .insert(tagIds.map((tagId) => ({ item_id: itemId, tag_id: tagId })))
    if (errorTags) return fallo(errorTags.message)
  }

  refrescar(itemId)
  return { ok: 'Guardado.' }
}

export async function borrarItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get('itemId') ?? '')
  if (!itemId) return

  const { supabase } = await requireUser()

  // El item no lleva contabilidad, así que acá sí se borra de verdad.
  // El ledger es lo que nunca se toca; esto es una lista de mandados.
  await supabase.from('shopping_items').delete().eq('id', itemId)

  refrescar()

  // Se borra desde el detalle del item. Sin esto la página se vuelve a
  // renderizar, no encuentra el item que acaba de desaparecer y tira un
  // 404: el usuario ve un error después de una operación exitosa.
  // `redirect` lanza, así que va al final.
  redirect('/compras')
}

/** Saca de la vista todo lo ya comprado, sin borrar el historial. */
export async function archivarComprados(): Promise<void> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  await supabase
    .from('shopping_items')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('house_id', activa.id)
    .eq('status', 'purchased')

  refrescar()
}

// ─────────────────────────────── tiendas ───────────────────────────────

export async function crearTienda(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  const nombre = limpiar(formData.get('nombre'))
  if (!nombre) return fallo('Escribí el nombre de la tienda.')
  if (nombre.length > 40) return fallo('El nombre es muy largo (máximo 40).')

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { error } = await supabase
    .from('stores')
    .insert({ house_id: activa.id, name: nombre })

  if (error) {
    if (error.code === '23505') return fallo(`Ya existe una tienda llamada ${nombre}.`)
    if (error.code === '42501') return fallo('Solo el admin de la casa agrega tiendas.')
    return fallo(error.message)
  }

  revalidatePath('/compras/tiendas')
  refrescar()
  return { ok: `Se agregó ${nombre}.` }
}

export async function borrarTienda(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  const tiendaId = String(formData.get('tiendaId') ?? '')
  if (!tiendaId) return fallo('No encontramos esa tienda.')

  const { supabase } = await requireUser()
  const { error } = await supabase.from('stores').delete().eq('id', tiendaId)

  if (error) {
    // La FK es RESTRICT: una tienda con items no se borra, porque esos
    // items quedarían sin dónde comprarse.
    if (error.code === '23503') {
      return fallo('Esa tienda tiene items en la lista. Movelos o borralos primero.')
    }
    // El trigger guard_default_store protege a "Cualquiera".
    if (error.code === '2BP01' || error.message.includes('Cualquiera')) {
      return fallo('«Cualquiera» no se puede borrar: es la tienda por defecto.')
    }
    return fallo(error.message)
  }

  revalidatePath('/compras/tiendas')
  refrescar()
  return { ok: 'Tienda borrada.' }
}

// ─────────────────────────────── etiquetas ───────────────────────────────

export async function crearTag(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  const nombre = limpiar(formData.get('nombre'))
  if (!nombre) return fallo('Escribí el nombre de la etiqueta.')
  if (nombre.length > 30) return fallo('El nombre es muy largo (máximo 30).')

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { error } = await supabase.from('tags').insert({ house_id: activa.id, name: nombre })

  if (error) {
    if (error.code === '23505') return fallo(`Ya existe una etiqueta llamada ${nombre}.`)
    return fallo(error.message)
  }

  revalidatePath('/compras/etiquetas')
  refrescar()
  return { ok: `Se agregó ${nombre}.` }
}

export async function borrarTag(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  const tagId = String(formData.get('tagId') ?? '')
  if (!tagId) return fallo('No encontramos esa etiqueta.')

  const { supabase } = await requireUser()

  // A diferencia de las tiendas, acá el CASCADE de item_tags hace lo
  // correcto: borrar la etiqueta la despega de sus items y ya.
  const { error } = await supabase.from('tags').delete().eq('id', tagId)
  if (error) return fallo(error.message)

  revalidatePath('/compras/etiquetas')
  refrescar()
  return { ok: 'Etiqueta borrada.' }
}

// ─────────────────────────────── fotos ───────────────────────────────

/**
 * La foto sube del navegador directo a Storage: un Server Action tiene
 * un límite de body de 1 MB y las fotos de un teléfono lo pasan siempre.
 * Acá solo se registra la fila una vez que el archivo ya está arriba.
 */
export async function registrarFoto(
  itemId: string,
  ruta: string,
  tipo: 'producto' | 'etiqueta',
): Promise<EstadoCompras> {
  const { supabase, user } = await requireUser()

  const { error } = await supabase
    .from('item_photos')
    .insert({ item_id: itemId, storage_path: ruta, kind: tipo, uploaded_by: user.id })

  if (error) return fallo(error.message)

  refrescar(itemId)
  return {}
}

export async function borrarFoto(formData: FormData): Promise<void> {
  const fotoId = String(formData.get('fotoId') ?? '')
  const itemId = String(formData.get('itemId') ?? '')
  if (!fotoId) return

  const { supabase } = await requireUser()

  const { data: foto } = await supabase
    .from('item_photos')
    .select('storage_path')
    .eq('id', fotoId)
    .maybeSingle()

  await supabase.from('item_photos').delete().eq('id', fotoId)

  // El archivo va después de la fila: si esto falla queda un huérfano en
  // Storage, que es mucho más barato que una fila apuntando a la nada.
  if (foto) await supabase.storage.from('item-photos').remove([foto.storage_path])

  refrescar(itemId)
}
