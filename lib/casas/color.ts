/**
 * Color de identidad de cada casa.
 *
 * El prototipo pide una franja de color por casa (variación ii del selector)
 * pero nunca definió de dónde sale. Se deriva del id: es estable, no necesita
 * columna ni que nadie elija nada, y una casa siempre se ve igual en todos los
 * teléfonos.
 *
 * Ojo: el color NUNCA es la única señal. El nombre y el rol van escritos al
 * lado — la variación "solo la inicial" se descartó justamente por eso.
 */
const PALETA = [
  '#b4552e', // terracota
  '#1f6f6a', // teal
  '#7a5ea7', // uva
  '#a8452f', // ladrillo
  '#3f6f3a', // olivo
  '#9c6b1f', // mostaza tostada
] as const

export function colorDeCasa(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100_000
  }
  return PALETA[hash % PALETA.length] ?? PALETA[0]
}

export function inicialDeCasa(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || '?'
}
