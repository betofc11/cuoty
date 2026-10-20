import { IDS } from './falso/datos.mjs'

import { estadoDe, expect, falso, filas, pestana, test, titulo } from './apoyo'

/*
 * La barra de pestañas de abajo (`components/shell/tabs.tsx`). Se rompió una
 * vez sin que el código de la barra cambiara: marcar un item corría en una
 * transición async de React, y mientras esa transición esperaba al servidor,
 * React no aplicaba ninguna otra, tampoco la navegación. Con la señal de un
 * súper, las pestañas quedaban muertas. Por eso acá se prueba la barra con
 * acciones en vuelo, y no solo en reposo.
 */

const PANTALLAS = [
  { pestana: 'Inicio', ruta: '/', titulo: 'Mi saldo' },
  { pestana: 'Gastos', ruta: '/gastos', titulo: 'Gastos' },
  { pestana: 'Compras', ruta: '/compras', titulo: 'Lista de compras' },
] as const

/** Lo que tiene que esperar un toque como máximo. Con 8 s de demora en el servidor, sobra. */
const AL_TOQUE = 3_000

/** Lo que tarda en llegar una escritura demorada 8 s, con margen. */
const DEMORA_Y_MARGEN = 12_000

for (const desde of PANTALLAS) {
  for (const hacia of PANTALLAS) {
    test(`desde ${desde.pestana}, la pestaña ${hacia.pestana} lleva a su pantalla`, async ({
      page,
    }) => {
      await page.goto(desde.ruta)
      await expect(titulo(page)).toHaveText(desde.titulo)

      await pestana(page, hacia.pestana).tap()

      await expect(page).toHaveURL(hacia.ruta)
      await expect(titulo(page)).toHaveText(hacia.titulo)
      await expect(pestana(page, hacia.pestana)).toHaveAttribute('aria-current', 'page')
    })
  }
}

test('se puede recorrer la barra entera de ida y vuelta', async ({ page }) => {
  await page.goto('/')
  for (const p of [...PANTALLAS.slice(1), ...PANTALLAS.slice().reverse()]) {
    await pestana(page, p.pestana).tap()
    await expect(titulo(page)).toHaveText(p.titulo)
  }
})

test('las pestañas responden aunque marcar un item siga esperando al servidor', async ({
  page,
}) => {
  await page.goto('/compras')
  await falso('/__demora?ms=8000')

  await page.getByRole('checkbox', { name: /Leche Dos Pinos/ }).tap()
  await pestana(page, 'Gastos').tap()

  await expect(titulo(page)).toHaveText('Gastos', { timeout: AL_TOQUE })
  // Irse no cancela el marcado: Next descarta la respuesta, pero el pedido ya
  // salió y el servidor lo termina.
  await expect
    .poll(() => estadoDe(IDS.leche), { timeout: DEMORA_Y_MARGEN })
    .toBe('purchased')
})

test('las pestañas responden aunque agregar un item siga esperando al servidor', async ({
  page,
}) => {
  await page.goto('/compras')
  await falso('/__demora?ms=8000')

  await page.getByRole('textbox', { name: 'Qué hay que comprar' }).fill('Arroz')
  await page.getByRole('button', { name: 'Agregar item' }).tap()
  await pestana(page, 'Inicio').tap()

  await expect(titulo(page)).toHaveText('Mi saldo', { timeout: AL_TOQUE })
  await expect
    .poll(
      async () => (await filas<{ name: string }>('products')).some((p) => p.name === 'Arroz'),
      { timeout: DEMORA_Y_MARGEN },
    )
    .toBe(true)
})

test('las pestañas responden con una búsqueda escrita en Compras', async ({ page }) => {
  await page.goto('/compras')
  await page.getByRole('searchbox', { name: 'Buscar en la lista' }).fill('pan')
  await expect(page).toHaveURL(/q=pan/)

  await pestana(page, 'Gastos').tap()

  await expect(titulo(page)).toHaveText('Gastos')
})
