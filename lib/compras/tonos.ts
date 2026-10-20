/**
 * El color de una etiqueta.
 *
 * Hoy solo lo lleva el chip de la etiqueta puesta en los filtros de
 * Compras. Las filas de la lista no muestran etiquetas desde la fase 1 del
 * rediseño: la fila es de una línea, y las etiquetas sirven para filtrar,
 * no para leerse en cada item.
 *
 * El tono sale de la POSICIÓN de la etiqueta en la lista de la casa, no de
 * un hash del id. Con hash, dos etiquetas de la misma casa caen en el
 * mismo color demasiado seguido — con 4 etiquetas y 8 tonos, más de la
 * mitad de las veces. Por posición, una casa con 8 etiquetas o menos nunca
 * repite.
 *
 * El costo es que agregar una etiqueta que ordena antes corre los tonos de
 * las demás. Se paga: las etiquetas se arman una vez y el tono es
 * decoración, mientras que el choque se ve todos los días.
 */
export const TONOS = 8

/** De índice en la lista (0-based) a número de tono (1-based). */
export function tonoPorPosicion(indice: number): number {
  return (indice % TONOS) + 1
}

/** Devuelve la referencia a la variable CSS, no el hex: el tema la resuelve. */
export function tonoDeEtiqueta(tono: number): string {
  return `var(--etiqueta-${tono})`
}
