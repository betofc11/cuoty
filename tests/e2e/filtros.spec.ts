import { expect, test, titulo } from './apoyo'

/*
 * Fase 2 del rediseño de Compras: filtrar por la tienda donde estás.
 *
 * En `datos.mjs`: Walmart tiene leche y Pinol, Automercado el café, y en
 * «Cualquiera» está el pan. Leche lleva «Frescos» y Pinol «Limpieza».
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/compras')
  await expect(titulo(page)).toHaveText('Lista de compras')
})

function chips(page: import('@playwright/test').Page) {
  return page.getByRole('navigation', { name: 'Filtrar por tienda' })
}

function grupo(page: import('@playwright/test').Page, nombre: string) {
  return page.getByRole('region', { name: new RegExp(`^${nombre}`) })
}

/*
  El nombre accesible de un chip sale de su texto: «Walmart», el número (oculto
  al lector) y la frase para el lector, «, 2 pendientes». El navegador los une
  con un espacio, así que queda «Walmart , 2 pendientes».
*/
function chip(page: import('@playwright/test').Page, nombre: string, resto = '') {
  return chips(page).getByRole('link', { name: new RegExp(`^${nombre} ?,${resto}`) })
}

function otrasTiendas(page: import('@playwright/test').Page) {
  return page.locator('summary', { hasText: 'En otras tiendas' })
}

test('las tiendas están a la vista, sin embudo ni escoba', async ({ page }) => {
  await expect(chip(page, 'Todo', ' 4 pendientes')).toHaveAttribute('aria-current', 'true')
  await expect(chip(page, 'Walmart', ' 2 pendientes')).toBeVisible()
  await expect(chip(page, 'Automercado', ' 1 pendiente')).toBeVisible()
  // «Cualquiera» no es un filtro: su grupo sale con cualquier tienda.
  await expect(chips(page).getByRole('link', { name: /Cualquiera/ })).toHaveCount(0)

  await expect(page.getByRole('link', { name: /filtros/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Etiquetas' })).toBeVisible()
})

test('elegir Walmart muestra lo de Walmart y lo de cualquier tienda', async ({ page }) => {
  await chips(page).getByRole('link', { name: /^Walmart/ }).tap()

  await expect(page).toHaveURL(/tienda=/)
  // Walmart es el último chip: tiene que quedar entero a la vista, no tapado
  // contra el borde, o no se sabe qué tienda está elegida.
  // 0,95 y no 1: con la ×, el chip mide medio píxel más de lo que el scroll alcanza.
  await expect(chip(page, 'Walmart', ' quitar el filtro')).toBeInViewport({ ratio: 0.95 })
  await expect(grupo(page, 'Walmart').getByRole('checkbox')).toHaveCount(2)
  await expect(grupo(page, 'En cualquier tienda').getByRole('checkbox')).toHaveCount(1)
  await expect(grupo(page, 'Automercado')).toHaveCount(0)
  // «Todo» sigue diciendo cuánto falta en total.
  await expect(chip(page, 'Todo', ' 4 pendientes')).toBeVisible()

  // Lo de las otras tiendas no se esconde: queda plegado.
  await otrasTiendas(page).tap()
  await expect(grupo(page, 'Automercado').getByRole('checkbox', { name: /Café Britt/ })).toBeVisible()
})

test('tocar la tienda elegida, o «Todo», vuelve a la lista entera', async ({ page }) => {
  await chips(page).getByRole('link', { name: /^Walmart/ }).tap()
  await chip(page, 'Walmart', ' quitar el filtro').tap()
  await expect(page).toHaveURL(/\/compras$/)
  await expect(grupo(page, 'Automercado')).toBeVisible()

  await chips(page).getByRole('link', { name: /^Automercado/ }).tap()
  await expect(grupo(page, 'Walmart')).toHaveCount(0)
  await chips(page).getByRole('link', { name: /^Todo/ }).tap()
  await expect(page).toHaveURL(/\/compras$/)
  await expect(grupo(page, 'Walmart')).toBeVisible()
})

test('la etiqueta se elige en una hoja y se quita con su ×', async ({ page }) => {
  await page.getByRole('button', { name: 'Etiquetas' }).tap()
  const hoja = page.getByRole('dialog', { name: 'Filtrar por etiqueta' })
  await expect(hoja).toBeVisible()

  await hoja.getByRole('link', { name: /^Limpieza/ }).tap()

  await expect(hoja).toBeHidden()
  await expect(page).toHaveURL(/tag=/)
  // Solo Pinol: la etiqueta también filtra «Comprado», y el tomate no la lleva.
  await expect(page.getByRole('checkbox')).toHaveCount(1)
  await expect(page.getByRole('checkbox', { name: /Pinol/ })).toBeVisible()

  await page.getByRole('link', { name: /^Limpieza ?, quitar el filtro/ }).tap()
  await expect(page).toHaveURL(/\/compras$/)
  await expect(page.getByRole('button', { name: 'Etiquetas' })).toBeVisible()
})

test('si en la tienda elegida ya no queda nada, lo dice y deja ver lo de las otras', async ({
  page,
}) => {
  await chips(page).getByRole('link', { name: /^Walmart/ }).tap()

  for (const nombre of [/Leche Dos Pinos/, /Pinol/, /Pan cuadrado/]) {
    await grupo(page, nombre.source.startsWith('Pan') ? 'En cualquier tienda' : 'Walmart')
      .getByRole('checkbox', { name: nombre })
      .tap()
    await expect(page.getByRole('region', { name: /^Comprado/ }).getByRole('checkbox', { name: nombre })).toBeVisible()
  }

  await expect(page.getByRole('heading', { name: 'Nada pendiente en Walmart' })).toBeVisible()
  await expect(otrasTiendas(page)).toBeVisible()
  // No es «Ya está todo comprado»: en Automercado todavía falta el café.
  await expect(page.getByRole('heading', { name: 'Ya está todo comprado' })).toHaveCount(0)
})
