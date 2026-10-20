import { IDS } from './falso/datos.mjs'

import { estadoDe, expect, falso, test, titulo } from './apoyo'

/*
 * La lista de compras de la fase 1 del rediseño: fila de una línea que se
 * marca entera, grupos por tienda y «Comprado hoy».
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
  await expect(grupos.nth(3)).toHaveAccessibleName(/^Comprado hoy/)

  await expect(grupos.nth(1).getByRole('checkbox')).toHaveCount(2)
})

test('la cantidad va pegada al nombre y la nota en la segunda línea', async ({ page }) => {
  await expect(page.getByRole('checkbox', { name: /^Leche Dos Pinos 2L\s·\s2$/ })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /Pan cuadrado.*El integral/ })).toBeVisible()
})

test('tocar la fila marca el item y lo pasa a «Comprado hoy»', async ({ page }) => {
  await page.getByRole('checkbox', { name: /Leche Dos Pinos/ }).tap()

  const hoy = page.getByRole('region', { name: /^Comprado hoy/ })
  await expect(hoy.getByRole('checkbox', { name: /Leche Dos Pinos/ })).toBeChecked()
  await expect(page.getByRole('region', { name: /^Walmart/ }).getByRole('checkbox')).toHaveCount(1)
  expect(await estadoDe(IDS.leche)).toBe('purchased')
})

test('la tilde sale con el toque, sin esperar al servidor', async ({ page }) => {
  await falso('/__demora?ms=4000')
  const fila = page.getByRole('checkbox', { name: /Pinol/ })

  await fila.tap()

  await expect(fila).toBeChecked({ timeout: 500 })
})

test('desmarcar desde «Comprado hoy» lo devuelve a su tienda', async ({ page }) => {
  const hoy = page.getByRole('region', { name: /^Comprado hoy/ })
  await hoy.getByRole('checkbox', { name: /Tomate/ }).tap()

  const cualquiera = page.getByRole('region', { name: /^En cualquier tienda/ })
  await expect(cualquiera.getByRole('checkbox', { name: /Tomate/ })).not.toBeChecked()
  await expect(hoy).toHaveCount(0)
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
