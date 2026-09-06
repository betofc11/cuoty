/**
 * El color de una etiqueta.
 *
 * En el prototipo cada etiqueta tiene tono propio («Frescos» verde,
 * «Limpieza» teal) y la tienda va siempre en neutro: así, dentro de la
 * fila, se leen como dos cosas distintas sin necesidad de rótulo.
 *
 * El tono sale de la POSICIÓN de la etiqueta en la lista de la casa, no de
 * un hash del id. Con hash, dos etiquetas de la misma casa caen en el
 * mismo color demasiado seguido — con 4 etiquetas y 8 tonos, más de la
 * mitad de las veces — y dos badges idénticos en la misma fila son justo
 * lo que el color venía a evitar. Por posición, una casa con 8 etiquetas o
 * menos nunca repite.
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

/**
 * El fondo tenue del mismo tono. Se mezcla contra la superficie en vez de
 * fijar un segundo hex por tono, así el tenue sigue solo al tema: en claro
 * aclara y en oscuro oscurece, sin duplicar la paleta.
 */
export function fondoDeTono(tono: string): string {
  return `color-mix(in oklab, ${tono} 15%, var(--superficie-alta))`
}
