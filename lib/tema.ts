import { cookies } from 'next/headers'

export type Tema = 'sistema' | 'claro' | 'oscuro'

export const COOKIE_TEMA = 'cuoty_tema'

/**
 * El tema vive en una cookie y no en localStorage a propósito.
 *
 * Con localStorage el servidor no sabe qué tema pintar, así que el HTML sale
 * con el del sistema y un script tiene que corregirlo al cargar: eso es el
 * parpadeo blanco clásico al abrir una app en modo oscuro. Leyéndolo de la
 * cookie, el `<html>` ya sale con la clase correcta en el primer pintado.
 */
export async function temaActual(): Promise<Tema> {
  const store = await cookies()
  const valor = store.get(COOKIE_TEMA)?.value
  return valor === 'claro' || valor === 'oscuro' ? valor : 'sistema'
}

/**
 * `globals.css` define `.dark` y `:root:not(.light)` dentro del media query.
 * Sin clase se sigue al sistema; con clase se fuerza.
 */
export function claseDeTema(tema: Tema): string {
  if (tema === 'claro') return 'light'
  if (tema === 'oscuro') return 'dark'
  return ''
}

/** Los mismos hex de `globals.css`. Si cambian allá, cambian acá. */
export const FONDO_CLARO = '#efe9e1'
export const FONDO_OSCURO = '#1a1613'
