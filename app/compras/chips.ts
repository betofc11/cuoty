/*
  Los chips de filtro de Compras. Viven acá porque los usan la página (servidor)
  y el botón de etiquetas (cliente).

  El chip mide 36 de alto pero se toca en 48: el ::after estira el área
  sensible sin estirar el fondo. Bajarle el alto a secas rompía el mínimo
  táctil, y con muchas etiquetas la fila de filtros ocupaba más pantalla
  que la lista que filtra.
*/
export const CHIP =
  "relative flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold " +
  "after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']"

export const CHIP_APAGADO = 'border-borde bg-superficie-alta text-tinta'

/** Seleccionado va en tinta, no en la marca: la marca es para las acciones. */
export const CHIP_ELEGIDO = 'border-tinta bg-tinta text-fondo'
