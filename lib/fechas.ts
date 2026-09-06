/**
 * Meses en español de Costa Rica. Ojo con el noveno: acá se escribe
 * «setiembre», no «septiembre».
 */
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'setiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * '2026-09-01' → 'Setiembre 2026'.
 *
 * Se parsea el string a mano a propósito: `new Date('2026-09-01')` da medianoche
 * UTC, que en Costa Rica es el 31 de agosto a las 18:00 — y el mes sale corrido.
 */
export function nombreDeMes(iso: string, opciones?: { conAnio?: boolean }): string {
  const partes = iso.split('-')
  const anio = partes[0] ?? ''
  const mes = Number(partes[1] ?? '1')
  const nombre = capitalizar(MESES[mes - 1] ?? '')
  return opciones?.conAnio === false ? nombre : `${nombre} ${anio}`
}

/** Primer día del mes en curso en Costa Rica: '2026-09-01'. */
export function mesActualCR(): string {
  const ym = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
  return `${ym}-01`
}

/** '2026-12-01' → '2027-01-01'. Aritmética de calendario, sin Date ni zonas. */
export function mesSiguiente(iso: string): string {
  const partes = iso.split('-')
  const anio = Number(partes[0] ?? '0')
  const mes = Number(partes[1] ?? '1')
  return mes === 12
    ? `${anio + 1}-01-01`
    : `${anio}-${String(mes + 1).padStart(2, '0')}-01`
}

/** '2026-09-01' → '2026-09', que es lo que viaja en la URL. */
export function claveDeMes(iso: string): string {
  return iso.slice(0, 7)
}

const ZONA = 'America/Costa_Rica'

/** El día calendario en Costa Rica, no en UTC. */
function diaCR(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha)
}

/**
 * Fecha de un movimiento: «Hoy», «Ayer» o «18 ago».
 * Todo se compara en hora de Costa Rica — con UTC, cualquier cosa después de
 * las 6 de la tarde ya contaría como mañana.
 */
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso)
  const hoy = new Date()

  const dia = diaCR(fecha)
  if (dia === diaCR(hoy)) return 'Hoy'

  const ayer = new Date(hoy.getTime() - 86_400_000)
  if (dia === diaCR(ayer)) return 'Ayer'

  return new Intl.DateTimeFormat('es-CR', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
  })
    .format(fecha)
    .replace('.', '')
}

/**
 * ¿Ese instante cae hoy en Costa Rica? Lo usa Compras para dejar a la vista
 * lo que se marcó hoy y mandar al acordeón lo de días anteriores.
 */
export function esHoyCR(iso: string): boolean {
  return diaCR(new Date(iso)) === diaCR(new Date())
}

/** '2026-08-28' → '28 de agosto'. */
export function diaYMes(iso: string): string {
  const partes = iso.split('-')
  const mes = Number(partes[1] ?? '1')
  const dia = Number(partes[2] ?? '1')
  return `${dia} de ${MESES[mes - 1] ?? ''}`
}
