import type { ItemVista, TiendaVista } from './consultas'

/** Un tramo de la lista: lo pendiente de una tienda, o de ninguna (`null`). */
export type GrupoTienda = {
  tienda: TiendaVista | null
  items: ItemVista[]
}

/**
 * Parte los pendientes por tienda. La tienda se dice una vez, en el
 * encabezado del grupo, en vez de un badge en cada fila: con «Cualquiera»
 * en seis de ocho filas, el badge repetía un dato que no decía nada.
 *
 * Antes la lista era plana a propósito, porque agrupar la partía en «tres
 * listas de dos líneas». Era cierto con filas de cuatro renglones; con filas
 * de uno, el encabezado cuesta media fila y reemplaza un badge por item.
 *
 * Las tiendas van por nombre, y lo que va en cualquier tienda al final. El orden no
 * depende de cuánto falte en cada una, así que la lista no se reacomoda bajo
 * el pulgar mientras se va marcando. Adentro de cada grupo se respeta el
 * orden en que vienen los items.
 */
export function agruparPorTienda(items: ItemVista[]): GrupoTienda[] {
  // La llave `null` es el grupo «en cualquier tienda».
  const grupos = new Map<string | null, GrupoTienda>()

  for (const item of items) {
    const llave = item.tienda?.id ?? null
    const grupo = grupos.get(llave)
    if (grupo) grupo.items.push(item)
    else grupos.set(llave, { tienda: item.tienda, items: [item] })
  }

  return [...grupos.values()].sort((a, b) => {
    if (!a.tienda || !b.tienda) return a.tienda ? -1 : b.tienda ? 1 : 0
    return a.tienda.nombre.localeCompare(b.tienda.nombre, 'es')
  })
}

/**
 * Lo pendiente con una tienda elegida («estoy en Walmart»): a la vista, lo de
 * esa tienda y después lo que no tiene tienda, que se consigue en cualquier
 * lado. Lo de las otras tiendas va aparte, para un acordeón plegado: no se
 * esconde, porque a veces lo que falta en Automercado también lo hay acá.
 *
 * Sin tienda elegida, todo va a la vista.
 */
export function partirPorTienda(
  items: ItemVista[],
  tiendaId: string | null,
): { aLaVista: GrupoTienda[]; otras: GrupoTienda[] } {
  const grupos = agruparPorTienda(items)
  if (!tiendaId) return { aLaVista: grupos, otras: [] }

  const seVe = (g: GrupoTienda) => g.tienda === null || g.tienda.id === tiendaId
  return { aLaVista: grupos.filter(seVe), otras: grupos.filter((g) => !seVe(g)) }
}
