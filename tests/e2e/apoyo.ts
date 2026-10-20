import { test as base, expect, type Page } from '@playwright/test'

import { TOKEN, USUARIO } from './falso/datos.mjs'

export const SUPABASE = 'http://localhost:54399'

/*
 * La cookie de sesión que pone `@supabase/ssr`, armada a mano para el usuario
 * de prueba. El nombre sale del host de la URL de Supabase
 * (`sb-<primera parte del host>-auth-token`), y el valor es la sesión en JSON,
 * en base64url y con el prefijo `base64-`. Cabe en una sola cookie: el corte
 * en pedazos empieza recién arriba de 3180 caracteres.
 */
function cookieDeSesion() {
  const anio = 60 * 60 * 24 * 365
  const sesion = {
    access_token: TOKEN,
    refresh_token: 'refresh-de-prueba',
    token_type: 'bearer',
    expires_in: anio,
    expires_at: Math.floor(Date.now() / 1000) + anio,
    user: {
      id: USUARIO.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: USUARIO.email,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: '2026-09-01T12:00:00Z',
    },
  }

  return {
    name: `sb-${new URL(SUPABASE).hostname.split('.')[0]}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(sesion)).toString('base64url')}`,
    domain: 'localhost',
    path: '/',
  }
}

/** Le habla al Supabase falso: reiniciar, demorar, fallar, leer una tabla. */
export async function falso(ruta: string): Promise<Response> {
  const respuesta = await fetch(`${SUPABASE}${ruta}`, {
    method: ruta.startsWith('/__tabla/') ? 'GET' : 'POST',
  })
  if (!respuesta.ok) throw new Error(`El Supabase falso respondió ${respuesta.status} a ${ruta}`)
  return respuesta
}

/** Cómo quedó una tabla en el Supabase falso. */
export async function filas<T = Record<string, unknown>>(tabla: string): Promise<T[]> {
  return (await (await falso(`/__tabla/${tabla}`)).json()) as T[]
}

/** El `status` de un item de la lista: 'pending', 'purchased' o 'archived'. */
export async function estadoDe(id: string): Promise<string | undefined> {
  const items = await filas<{ id: string; status: string }>('shopping_items')
  return items.find((i) => i.id === id)?.status
}

/** Cada prueba arranca con la casa de `datos.mjs` y la sesión de Luis. */
export const test = base.extend({
  context: async ({ context }, usar) => {
    await falso('/__reiniciar')
    await context.addCookies([cookieDeSesion()])
    await usar(context)
  },
})

export { expect }

/** La barra de abajo: `components/shell/tabs.tsx`. */
export function pestana(page: Page, nombre: 'Inicio' | 'Gastos' | 'Compras') {
  return page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: nombre })
}

export function titulo(page: Page) {
  return page.getByRole('heading', { level: 1 })
}
