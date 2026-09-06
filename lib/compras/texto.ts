/**
 * Búsqueda sin tildes ni mayúsculas: quien escribe "cafe" en el super
 * tiene que encontrar "Café Britt".
 *
 * Se hace en TypeScript y no en Postgres a propósito. La casa tiene
 * decenas de items, no miles, y filtrar sobre un recurso embebido de
 * PostgREST es justo el tipo de consulta que se rompe callada cuando
 * cambian los metadatos de la relación.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    // NFD separa la tilde en un carácter propio; esto la borra.
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function contiene(texto: string, busqueda: string): boolean {
  return normalizar(texto).includes(normalizar(busqueda))
}
