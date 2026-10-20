import type { ItemVista, TiendaVista } from './consultas'

/** Un tramo de la lista: lo pendiente de una tienda. */
export type GrupoTienda = {
  tienda: TiendaVista
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
 * Las tiendas van por nombre y la predeterminada al final. El orden no
 * depende de cuánto falte en cada una, así que la lista no se reacomoda bajo
 * el pulgar mientras se va marcando. Adentro de cada grupo se respeta el
 * orden en que vienen los items.
 */
export function agruparPorTienda(items: ItemVista[]): GrupoTienda[] {
  const grupos = new Map<string, GrupoTienda>()

  for (const item of items) {
    const grupo = grupos.get(item.tienda.id)
    if (grupo) grupo.items.push(item)
    else grupos.set(item.tienda.id, { tienda: item.tienda, items: [item] })
  }

  return [...grupos.values()].sort((a, b) => {
    if (a.tienda.esPredeterminada !== b.tienda.esPredeterminada) {
      return a.tienda.esPredeterminada ? 1 : -1
    }
    return a.tienda.nombre.localeCompare(b.tienda.nombre, 'es')
  })
}
