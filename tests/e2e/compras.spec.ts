import { IDS } from './falso/datos.mjs'

import { estadoDe, expect, falso, test, titulo } from './apoyo'

/*
 * La lista de compras del rediseño: fila de una línea que se marca entera,
 * grupos por tienda (fase 1) y una sola sección «Comprado» (fase 4).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/compras')
  await expect(titulo(page)).toHaveText('Lista de compras')
})

test('agrupa lo pendiente por tienda, con «En cualquier tienda» al final', async ({ page }) => {
  const grupos = page.getByRole('region')
  await expect(grupos).toHaveCount(4)
  await expect(grupos.nth(0)).toHaveAccessibleName(/^Automercado/)
  await expect(grupos.nth(1)).toHaveAccessibleName(/^Walmart/)
  await expect(grupos.nth(2)).toHaveAccessibleName(/^En cualquier tienda/)
  await expect(grupos.nth(3)).toHaveAccessibleName(/^Comprado/)

  await expect(grupos.nth(1).getByRole('checkbox')).toHaveCount(2)
})

test('la cantidad va pegada al nombre y la nota en la segunda línea', async ({ page }) => {
  await expect(page.getByRole('checkbox', { name: /^Leche Dos Pinos 2L\s·\s2$/ })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Pan cuadrado.*El integral/ })).toBeVisible()
})

function comprado(page: import('@playwright/test').Page) {
  return page.getByRole('region', { name: /^Comprado/ })
}

test('tocar la fila marca el item y lo pasa a «Comprado»', async ({ page }) => {
  await page.getByRole('checkbox', { name: /Leche Dos Pinos/ }).tap()

  await expect(comprado(page).getByRole('checkbox', { name: /Leche Dos Pinos/ })).toBeChecked()
  await expect(page.getByRole('region', { name: /^Walmart/ }).getByRole('checkbox')).toHaveCount(1)
  expect(await estadoDe(IDS.leche)).toBe('purchased')
})

test('la tilde sale con el toque, sin esperar al servidor', async ({ page }) => {
  await falso('/__demora?ms=4000')
  const fila = page.getByRole('checkbox', { name: /Pinol/ })

  await fila.tap()

  await expect(fila).toBeChecked({ timeout: 500 })
})

test('desmarcar desde «Comprado» lo devuelve a su tienda', async ({ page }) => {
  await comprado(page).getByRole('checkbox', { name: /Tomate/ }).tap()

  const cualquiera = page.getByRole('region', { name: /^En cualquier tienda/ })
  await expect(cualquiera.getByRole('checkbox', { name: /Tomate/ })).not.toBeChecked()
  await expect(comprado(page).getByRole('checkbox', { name: /Tomate/ })).toHaveCount(0)
  expect(await estadoDe(IDS.tomate)).toBe('pending')
})

// El aviso se busca dentro del grupo: Next tiene su propio `role="alert"`, el
// que anuncia las rutas, siempre en la página.
test('si el servidor falla, la tilde vuelve y la fila dice por qué', async ({ page }) => {
  await falso('/__fallar?tabla=shopping_items')
  const grupo = page.getByRole('region', { name: /^Automercado/ })
  const fila = grupo.getByRole('checkbox', { name: /Café Britt/ })

  await fila.tap()

  await expect(grupo.getByRole('alert')).toHaveText('No se pudo guardar. Probá de nuevo.')
  await expect(fila).not.toBeChecked()
  expect(await estadoDe(IDS.cafe)).toBe('pending')
})

test('sin señal, la fila avisa y la lista sigue en pie', async ({ page, context }) => {
  const grupo = page.getByRole('region', { name: /^Automercado/ })
  const fila = grupo.getByRole('checkbox', { name: /Café Britt/ })
  await context.setOffline(true)

  await fila.tap()

  await expect(grupo.getByRole('alert')).toContainText('no hay señal')
  await expect(fila).not.toBeChecked()
  await expect(titulo(page)).toHaveText('Lista de compras')
  await context.setOffline(false)
})

test('«Editar» abre la hoja del item sin marcarlo ni salir de la lista', async ({ page }) => {
  await page.getByRole('button', { name: 'Editar Leche Dos Pinos 2L' }).tap()

  await expect(page.getByRole('dialog', { name: 'Leche Dos Pinos 2L' })).toBeVisible()
  await expect(page).toHaveURL('/compras')
  expect(await estadoDe(IDS.leche)).toBe('pending')
})

test('lo que se agrega cae en «En cualquier tienda»', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Qué hay que comprar' }).fill('Arroz Tío Pelón')
  await page.getByRole('button', { name: 'Agregar item' }).tap()

  const cualquiera = page.getByRole('region', { name: /^En cualquier tienda/ })
  await expect(cualquiera.getByRole('checkbox', { name: /Arroz Tío Pelón/ })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Qué hay que comprar' })).toHaveValue('')
})

// ─────────── fase 4: encabezado, sin buscador, una sola sección «Comprado» ───────────

test('el encabezado es solo el título, sin buscador', async ({ page }) => {
  await expect(page.getByText(/^Faltan? \d/)).toHaveCount(0)
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  // El conteo vive en el chip «Todo».
  await expect(
    page.getByRole('navigation', { name: 'Filtrar por tienda' }).getByRole('link', { name: /^Todo ?, 4 pendientes/ }),
  ).toBeVisible()
})

test('un ?q= de un enlace viejo no esconde nada', async ({ page }) => {
  await page.goto('/compras?q=pan')

  await expect(page.getByRole('region', { name: /^Walmart/ }).getByRole('checkbox')).toHaveCount(2)
  await expect(page.getByRole('region', { name: /^Automercado/ })).toBeVisible()
})

test('lo comprado vive en una sola sección: hoy a la vista, antes plegado', async ({ page }) => {
  const seccion = comprado(page)
  await expect(seccion).toHaveAccessibleName(/^Comprado ?, 2 items/)
  // Hoy, con quién lo marcó.
  await expect(seccion.getByRole('checkbox', { name: /^Tomate.*lo marcó Marta/ })).toBeChecked()
  // Antes, plegado y con la fecha.
  const jabon = seccion.getByRole('checkbox', { name: /Jabón de platos/ })
  await expect(jabon).toBeHidden()

  await seccion.locator('summary', { hasText: 'Antes de hoy' }).tap()

  await expect(jabon).toBeVisible()
  await expect(jabon).toHaveAccessibleName(/comprado 1 set/)
  await expect(seccion.getByRole('button', { name: 'Editar Jabón de platos' })).toBeVisible()
  // Ni el acordeón de antes ni un número distinto en el botón.
  await expect(page.getByText(/Ver artículos comprados/)).toHaveCount(0)
  await expect(seccion.getByRole('button', { name: 'Quitar los comprados' })).toBeVisible()
})

test('«Quitar los comprados» archiva lo de la sección y la sección se va', async ({ page }) => {
  await comprado(page).getByRole('button', { name: 'Quitar los comprados' }).tap()

  await expect(comprado(page)).toHaveCount(0)
  expect(await estadoDe(IDS.tomate)).toBe('archived')
  expect(await estadoDe(IDS.jabon)).toBe('archived')
  // Lo pendiente no se toca.
  expect(await estadoDe(IDS.leche)).toBe('pending')
})

test('con una tienda elegida, «Quitar los comprados» deja lo que no se ve', async ({ page }) => {
  // En Automercado se ve el tomate (de cualquier tienda) y no el jabón (de Walmart).
  await page.getByRole('navigation', { name: 'Filtrar por tienda' }).getByRole('link', { name: /^Automercado/ }).tap()
  await expect(page).toHaveURL(/tienda=/)
  await expect(comprado(page)).toHaveAccessibleName(/^Comprado ?, 1 item/)

  await comprado(page).getByRole('button', { name: 'Quitar los comprados' }).tap()

  await expect(comprado(page)).toHaveCount(0)
  expect(await estadoDe(IDS.tomate)).toBe('archived')
  expect(await estadoDe(IDS.jabon)).toBe('purchased')
})
