'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

export type EstadoCompras = {
  error?: string
  ok?: string
  /** El item recién creado: la tira «¿Dónde se compra?» lo mueve con un toque. */
  itemId?: string
  /** Dónde quedó el item recién creado: la elegida, la de la última vez o «Cualquiera». */
  tiendaId?: string
}

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
  // `producto`, no `nombre`: ver el comentario en `agregar.tsx`.
  const nombre = String(formData.get('producto') ?? '').trim()
  if (!nombre) return fallo('Escribí qué hay que comprar.')
  if (nombre.length > 80) return fallo('El nombre es muy largo (máximo 80).')

  const tiendaId = String(formData.get('tiendaId') ?? '') || null
  const cantidad = String(formData.get('cantidad') ?? '').trim() || null
  const nota = String(formData.get('nota') ?? '').trim() || null
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  // La tienda llega del cliente («Agregar a Walmart»): se confirma que sea de
  // esta casa. `add_shopping_item` no lo mira.
  if (tiendaId && !(await tiendaDeLaCasa(tiendaId))) return fallo('Esa tienda ya no existe.')

  const { data: itemId, error } = await supabase.rpc('add_shopping_item', {
    p_house_id: activa.id,
    p_name: nombre,
    p_store_id: tiendaId ?? undefined,
    p_quantity: cantidad ?? undefined,
    p_note: nota ?? undefined,
    p_tag_ids: tagIds,
  })

  if (error) return fallo(error.message)

  // Sin tienda elegida, la elige `add_shopping_item`: la de la última vez que
  // la casa anotó ese producto, o «Cualquiera». La tira de `agregar.tsx` dice
  // cuál fue, así que hay que preguntarlo: la función devuelve solo el id.
  let dondeQuedo = tiendaId
  if (!dondeQuedo && itemId) {
    const { data } = await supabase
      .from('shopping_items')
      .select('store_id')
      .eq('id', itemId)
      .maybeSingle()
    dondeQuedo = data?.store_id ?? null
  }

  refrescar()
  return {
    ok: `Se agregó ${nombre}.`,
    itemId: itemId ?? undefined,
    tiendaId: dondeQuedo ?? undefined,
  }
}

/**
 * Marca o desmarca un item. Recibe argumentos y devuelve el error, en vez de
 * recibir un formulario y tragárselo: la fila de la lista la llama dentro de
 * un try/catch, así un fallo se muestra en esa fila y la lista sigue en pie.
 */
export async function marcarComprado(
  itemId: string,
  comprar: boolean,
): Promise<EstadoCompras> {
  if (!itemId) return fallo('No encontramos ese item.')

  const { supabase, user } = await requireUser()

  // purchased_at y status van juntos o el CHECK del esquema rechaza la
  // fila: no hay forma de dejar un "comprado sin fecha".
  const { data, error } = await supabase
    .from('shopping_items')
    .update(
      comprar
        ? { status: 'purchased', purchased_at: new Date().toISOString(), purchased_by: user.id }
        : { status: 'pending', purchased_at: null, purchased_by: null },
    )
    .eq('id', itemId)
    // Archivado ya no está en la lista, y el CHECK `shopping_items_status_shape`
    // rechaza pending o purchased con archived_at puesto: sin este filtro, el
    // rechazo salía como «Probá de nuevo», que nunca iba a funcionar.
    .is('archived_at', null)
    .select('id')

  // También ante un error: si el item cambió por otro lado, la lista tiene
  // que mostrar cómo quedó de verdad.
  refrescar(itemId)

  if (error) {
    console.error('[cuoty] compras:', error.message)
    return fallo('No se pudo guardar. Probá de nuevo.')
  }

  // Sin error y sin filas: alguien lo borró o lo archivó mientras tanto.
  // RLS no avisa, simplemente no encuentra nada que actualizar.
  if (!data?.length) return fallo('Ese item ya no está en la lista.')

  return {}
}

// ────────────────────── edición desde la hoja, campo por campo ──────────────────────
//
// La hoja de `editor-de-item.tsx` guarda cada campo al tocarlo, sin «Guardar
// cambios». Todas se llaman como función, fuera de toda transición: ver
// «Una transición async congela las pestañas» en CLAUDE.md.

/** Los topes de la hoja. La base no tiene, pero una nota de tres párrafos no es una nota. */
const LARGO_CANTIDAD = 40
const LARGO_NOTA = 200

/** ¿La tienda es de la casa activa? Las de otras casas las ve RLS si sos miembro de las dos. */
async function tiendaDeLaCasa(tiendaId: string): Promise<boolean> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()
  const { data } = await supabase
    .from('stores')
    .select('id')
    .eq('id', tiendaId)
    .eq('house_id', activa.id)
    .maybeSingle()
  return Boolean(data)
}

/**
 * Un cambio a un item que sigue en la lista. Sin filas es que alguien lo borró
 * o lo archivó mientras tanto, y eso se dice así y no como «Probá de nuevo».
 */
async function actualizarItem(
  itemId: string,
  cambios: { store_id?: string; quantity?: string | null; note?: string | null },
): Promise<EstadoCompras> {
  if (!itemId) return fallo('No encontramos ese item.')

  const { supabase } = await requireUser()
  const { data, error } = await supabase
    .from('shopping_items')
    .update(cambios)
    .eq('id', itemId)
    .is('archived_at', null)
    .select('id')

  refrescar(itemId)

  if (error) {
    console.error('[cuoty] compras:', error.message)
    return fallo('No se pudo guardar. Probá de nuevo.')
  }
  if (!data?.length) return fallo('Ese item ya no está en la lista.')
  return {}
}

export async function moverDeTienda(itemId: string, tiendaId: string): Promise<EstadoCompras> {
  if (!(await tiendaDeLaCasa(tiendaId))) return fallo('Esa tienda ya no existe.')
  return actualizarItem(itemId, { store_id: tiendaId })
}

export async function cambiarCantidad(itemId: string, cantidad: string): Promise<EstadoCompras> {
  const limpia = cantidad.replace(/\s+/g, ' ').trim()
  if (limpia.length > LARGO_CANTIDAD) {
    return fallo(`La cantidad es muy larga (máximo ${LARGO_CANTIDAD}).`)
  }
  return actualizarItem(itemId, { quantity: limpia || null })
}

export async function cambiarNota(itemId: string, nota: string): Promise<EstadoCompras> {
  const limpia = nota.trim()
  if (limpia.length > LARGO_NOTA) return fallo(`La nota es muy larga (máximo ${LARGO_NOTA}).`)
  return actualizarItem(itemId, { note: limpia || null })
}

/**
 * Las etiquetas se reemplazan enteras: comparar cuáles entraron y cuáles
 * salieron cuesta más que rehacerlas, y son tres filas. Solo pasan las de la
 * casa activa.
 */
export async function cambiarEtiquetas(itemId: string, tagIds: string[]): Promise<EstadoCompras> {
  if (!itemId) return fallo('No encontramos ese item.')

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data: deLaCasa } = await supabase
    .from('tags')
    .select('id')
    .eq('house_id', activa.id)
    .in('id', tagIds)
  const validas = (deLaCasa ?? []).map((t) => t.id)

  const { error: errorBorrar } = await supabase.from('item_tags').delete().eq('item_id', itemId)
  const { error: errorPoner } = validas.length
    ? await supabase
        .from('item_tags')
        .insert(validas.map((tagId) => ({ item_id: itemId, tag_id: tagId })))
    : { error: null }

  refrescar(itemId)

  const error = errorBorrar ?? errorPoner
  if (error) {
    console.error('[cuoty] compras:', error.message)
    return fallo('No se pudieron guardar las etiquetas. Probá de nuevo.')
  }
  return {}
}

/**
 * Borrar desde la hoja. No redirige: la hoja se cierra y la lista se refresca
 * sola. El item no lleva contabilidad, así que acá sí se borra de verdad
 * (invariante 10).
 */
export async function borrarDeLaLista(itemId: string): Promise<EstadoCompras> {
  if (!itemId) return fallo('No encontramos ese item.')

  const { supabase } = await requireUser()
  const { error } = await supabase.from('shopping_items').delete().eq('id', itemId)

  refrescar()

  if (error) {
    console.error('[cuoty] compras:', error.message)
    return fallo('No se pudo borrar. Probá de nuevo.')
  }
  return {}
}

/**
 * Saca de la lista lo comprado que se está viendo, sin borrar el historial.
 * Los ids llegan de la sección «Comprado»: con un filtro puesto se archiva lo
 * que pasó el filtro y nada más, así el botón hace lo que muestra la sección.
 * Antes archivaba todo lo de la casa y el número del botón no coincidía con
 * el de la lista. Lo que alguien marque mientras tanto, que nadie vio, se queda.
 */
export async function archivarComprados(formData: FormData): Promise<void> {
  const ids = formData.getAll('itemId').map(String).filter(Boolean)
  if (ids.length === 0) return

  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  await supabase
    .from('shopping_items')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('house_id', activa.id)
    .eq('status', 'purchased')
    .in('id', ids)

  refrescar()
}

// ─────────────────────────────── tiendas ───────────────────────────────

export async function crearTienda(
  _prev: EstadoCompras,
  formData: FormData,
): Promise<EstadoCompras> {
  // `tienda`, no `nombre`: ver el comentario en `gestor.tsx`.
  const nombre = limpiar(formData.get('tienda'))
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
  // `etiqueta`, no `nombre`: ver el comentario en `gestor.tsx`.
  const nombre = limpiar(formData.get('etiqueta'))
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
