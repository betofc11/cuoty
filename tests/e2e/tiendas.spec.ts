import { IDS } from './falso/datos.mjs'

import { expect, filas, test, titulo } from './apoyo'

/*
 * «Cualquiera» dejó de ser una tienda: un item sin tienda tiene `store_id: null`
 * y el nombre lo pone la interfaz. En `datos.mjs`, Walmart tiene la leche y el
 * Pinol pendientes, y el jabón de platos comprado antes de hoy.
 */

type Item = { id: string; store_id: string | null }

async function tiendaDe(id: string): Promise<string | null | undefined> {
  return (await filas<Item>('shopping_items')).find((i) => i.id === id)?.store_id
}

test.beforeEach(async ({ page }) => {
  await page.goto('/compras/tiendas')
  await expect(titulo(page)).toHaveText('Tiendas')
})

test('la lista de tiendas tiene solo tiendas de verdad', async ({ page }) => {
  const lista = page.getByRole('listitem')
  await expect(lista).toHaveCount(2)
  await expect(lista.nth(0)).toContainText('Automercado')
  await expect(lista.nth(1)).toContainText('Walmart')
  await expect(page.getByText('Por defecto')).toHaveCount(0)
})

test('borrar una tienda con items los pasa a «Cualquiera»', async ({ page }) => {
  await page.getByRole('button', { name: 'Borrar Walmart' }).tap()

  // Cuenta lo que está en la lista, lo comprado incluido: el jabón también.
  await expect(page.getByText('Tienda borrada. Sus 3 items pasaron a «Cualquiera».')).toBeVisible()
  expect(await tiendaDe(IDS.leche)).toBeNull()
  expect(await tiendaDe(IDS.jabon)).toBeNull()

  await page.goto('/compras')
  await expect(page.getByRole('region', { name: /^Walmart/ })).toHaveCount(0)
  const cualquiera = page.getByRole('region', { name: /^En cualquier tienda/ })
  await expect(cualquiera.getByRole('checkbox', { name: /Leche Dos Pinos/ })).toBeVisible()
  await expect(cualquiera.getByRole('checkbox', { name: /Pinol/ })).toBeVisible()
})

test('«Cualquiera» no se puede usar como nombre de tienda', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Nombre de la tienda' }).fill(' cualquiera ')
  await page.getByRole('button', { name: 'Agregar' }).tap()

  await expect(page.getByText('«Cualquiera» ya está: es lo que no tiene tienda.')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(2)
})
