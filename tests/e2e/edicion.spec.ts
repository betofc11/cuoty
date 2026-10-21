import { IDS } from './falso/datos.mjs'

import { expect, falso, filas, pestana, test, titulo } from './apoyo'

/*
 * Fases 3 y 5 del rediseño de Compras: editar sin salir de la lista, y la
 * tienda al anotar. En `datos.mjs` la leche está en Walmart, con cantidad «2» y la
 * etiqueta «Frescos»; Walmart tiene además Pinol, y Automercado el café.
 */

type Item = { id: string; store_id: string | null; quantity: string | null; note: string | null }

const WALMART = '00000000-0000-4000-8000-0000000000d1'
const AUTOMERCADO = '00000000-0000-4000-8000-0000000000d2'
const FRESCOS = '00000000-0000-4000-8000-0000000000e1'
const LIMPIEZA = '00000000-0000-4000-8000-0000000000e2'

async function leche(): Promise<Item | undefined> {
  return (await filas<Item>('shopping_items')).find((i) => i.id === IDS.leche)
}

function grupo(page: import('@playwright/test').Page, nombre: string) {
  return page.getByRole('region', { name: new RegExp(`^${nombre}`) })
}

async function abrirLeche(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Editar Leche Dos Pinos 2L' }).tap()
  const hoja = page.getByRole('dialog', { name: 'Leche Dos Pinos 2L' })
  await expect(hoja).toBeVisible()
  return hoja
}

test.beforeEach(async ({ page }) => {
  await page.goto('/compras')
  await expect(titulo(page)).toHaveText('Lista de compras')
})

test('la tienda se cambia con un toque y se guarda sola', async ({ page }) => {
  const hoja = await abrirLeche(page)
  await expect(hoja.getByRole('button', { name: 'Walmart' })).toHaveAttribute('aria-pressed', 'true')

  await hoja.getByRole('button', { name: 'Automercado' }).tap()

  await expect(hoja.getByText('Guardado')).toBeVisible()
  expect((await leche())?.store_id).toBe(AUTOMERCADO)
  await hoja.getByRole('button', { name: 'Cerrar' }).tap()
  await expect(grupo(page, 'Automercado').getByRole('checkbox', { name: /Leche/ })).toBeVisible()
})

test('«Cualquiera» deja el item sin tienda', async ({ page }) => {
  const hoja = await abrirLeche(page)
  // Va primero: no es una tienda de la casa, es no tener ninguna.
  const tiendas = hoja.getByRole('group', { name: /^Dónde se compra/ }).getByRole('button')
  await expect(tiendas).toHaveText(['Cualquiera', 'Automercado', 'Walmart'])

  await hoja.getByRole('button', { name: 'Cualquiera' }).tap()

  await expect(hoja.getByText('Guardado')).toBeVisible()
  expect((await leche())?.store_id).toBeNull()
  await hoja.getByRole('button', { name: 'Cerrar' }).tap()
  await expect(grupo(page, 'En cualquier tienda').getByRole('checkbox', { name: /Leche/ })).toBeVisible()
})

test('la cantidad se guarda al salir del campo', async ({ page }) => {
  const hoja = await abrirLeche(page)
  const cantidad = hoja.getByRole('textbox', { name: /^Cantidad/ })

  await cantidad.fill('3 cajas')
  await cantidad.press('Enter')

  await expect(hoja.getByText('Guardado')).toBeVisible()
  expect((await leche())?.quantity).toBe('3 cajas')
  await hoja.getByRole('button', { name: 'Cerrar' }).tap()
  await expect(page.getByRole('checkbox', { name: /Leche Dos Pinos 2L\s·\s3 cajas/ })).toBeVisible()
})

test('una nota escrita no se pierde si la hoja se cierra con Esc', async ({ page }) => {
  const hoja = await abrirLeche(page)

  await hoja.getByRole('textbox', { name: /^Nota/ }).fill('La deslactosada')
  await page.keyboard.press('Escape')

  await expect(hoja).toBeHidden()
  await expect.poll(async () => (await leche())?.note).toBe('La deslactosada')
})

test('las etiquetas se ponen y se quitan con un toque', async ({ page }) => {
  const hoja = await abrirLeche(page)

  const puestas = async () =>
    (await filas<{ item_id: string; tag_id: string }>('item_tags'))
      .filter((t) => t.item_id === IDS.leche)
      .map((t) => t.tag_id)
      .sort()

  await hoja.getByRole('button', { name: 'Limpieza' }).tap()
  await expect(hoja.getByRole('button', { name: 'Limpieza' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(puestas).toEqual([FRESCOS, LIMPIEZA])

  await hoja.getByRole('button', { name: 'Frescos' }).tap()
  await expect(hoja.getByRole('button', { name: 'Frescos' })).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(puestas).toEqual([LIMPIEZA])
})

test('si el servidor falla, la tienda vuelve a la de antes y lo dice', async ({ page }) => {
  const hoja = await abrirLeche(page)
  await falso('/__fallar?tabla=shopping_items')

  await hoja.getByRole('button', { name: 'Automercado' }).tap()

  await expect(hoja.getByRole('alert')).toHaveText('No se pudo guardar. Probá de nuevo.')
  await expect(hoja.getByRole('button', { name: 'Walmart' })).toHaveAttribute('aria-pressed', 'true')
  expect((await leche())?.store_id).toBe(WALMART)
})

test('borrar pide confirmación y saca el item de la lista', async ({ page }) => {
  const hoja = await abrirLeche(page)

  await hoja.getByRole('button', { name: 'Borrar de la lista' }).tap()
  await expect(hoja.getByText('¿Borrar Leche Dos Pinos 2L de la lista?')).toBeVisible()
  await hoja.getByRole('button', { name: 'Sí, borrar' }).tap()

  await expect(hoja).toBeHidden()
  await expect(page.getByRole('checkbox', { name: /Leche/ })).toHaveCount(0)
  expect(await leche()).toBeUndefined()
})

test('«No, dejarlo» no borra nada', async ({ page }) => {
  const hoja = await abrirLeche(page)

  await hoja.getByRole('button', { name: 'Borrar de la lista' }).tap()
  await hoja.getByRole('button', { name: 'No, dejarlo' }).tap()

  await expect(hoja.getByRole('button', { name: 'Borrar de la lista' })).toBeVisible()
  expect(await leche()).toBeDefined()
})

test('las fotos siguen en la página del item', async ({ page }) => {
  const hoja = await abrirLeche(page)

  await hoja.getByRole('link', { name: 'Agregar una foto' }).tap()

  await expect(page).toHaveURL(`/compras/${IDS.leche}`)
  await expect(titulo(page)).toHaveText('Leche Dos Pinos 2L')
  // Desde la fase 4 es solo la página de las fotos: lo demás se edita en la hoja.
  await expect(page.getByRole('button', { name: 'Agregar foto' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveCount(0)
})

test('después de anotar, un toque manda el item a su tienda', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Qué hay que comprar' }).fill('Arroz')
  await page.getByRole('button', { name: 'Agregar item' }).tap()

  const tira = page.getByRole('navigation', { name: 'Dónde se compra Arroz' })
  await expect(tira).toBeVisible()
  await tira.getByRole('button', { name: 'Walmart' }).tap()

  await expect(page.getByText('Arroz pasó a Walmart.')).toBeVisible()
  await expect(grupo(page, 'Walmart').getByRole('checkbox', { name: /Arroz/ })).toBeVisible()
})

test('la tira de la tienda se va al escribir lo siguiente', async ({ page }) => {
  const campo = page.getByRole('textbox', { name: 'Qué hay que comprar' })
  await campo.fill('Arroz')
  await page.getByRole('button', { name: 'Agregar item' }).tap()
  await expect(page.getByRole('navigation', { name: 'Dónde se compra Arroz' })).toBeVisible()

  await campo.fill('Frijoles')

  await expect(page.getByRole('navigation', { name: 'Dónde se compra Arroz' })).toHaveCount(0)
})

// ─────────── fase 5: la lista recuerda dónde se compra cada producto ───────────
// En `datos.mjs`, el jabón de platos se compró antes de hoy en Walmart, y el pan
// está pendiente en «Cualquiera».

test('lo que ya se anotó antes vuelve a su tienda, y la tira lo dice', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Qué hay que comprar' }).fill('Jabón de platos')
  await page.getByRole('button', { name: 'Agregar item' }).tap()

  await expect(page.getByText('Jabón de platos quedó en Walmart, como la última vez.')).toBeVisible()
  await expect(grupo(page, 'Walmart').getByRole('checkbox', { name: /Jabón de platos/ })).not.toBeChecked()

  // La tira ofrece las otras, y también volver a «Cualquiera».
  const tira = page.getByRole('navigation', { name: 'Dónde se compra Jabón de platos' })
  await expect(tira.getByRole('button')).toHaveText(['Cualquiera', 'Automercado'])

  await tira.getByRole('button', { name: 'Automercado' }).tap()

  await expect(page.getByText('Jabón de platos pasó a Automercado.')).toBeVisible()
  await expect(grupo(page, 'Automercado').getByRole('checkbox', { name: /Jabón de platos/ })).toBeVisible()
})

test('si la última vez quedó en cualquier tienda, ahí queda', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Qué hay que comprar' }).fill('Pan cuadrado')
  await page.getByRole('button', { name: 'Agregar item' }).tap()

  await expect(page.getByText('Pan cuadrado quedó en cualquier tienda. ¿Dónde se compra?')).toBeVisible()
  await expect(grupo(page, 'En cualquier tienda').getByRole('checkbox', { name: /Pan cuadrado/ })).toHaveCount(2)
})

test('la tienda elegida le gana a la memoria', async ({ page }) => {
  await page.goto(`/compras?tienda=${AUTOMERCADO}`)
  await page.getByRole('textbox', { name: 'Qué hay que comprar' }).fill('Jabón de platos')
  await page.getByRole('button', { name: 'Agregar item' }).tap()

  await expect(grupo(page, 'Automercado').getByRole('checkbox', { name: /Jabón de platos/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: /Dónde se compra/ })).toHaveCount(0)
})

test('con una tienda elegida, lo nuevo cae ahí directo', async ({ page }) => {
  await page.goto(`/compras?tienda=${WALMART}`)
  const campo = page.getByRole('textbox', { name: 'Qué hay que comprar' })
  await expect(campo).toHaveAttribute('placeholder', 'Agregar a Walmart…')

  await campo.fill('Jabón')
  await page.getByRole('button', { name: 'Agregar item' }).tap()

  await expect(grupo(page, 'Walmart').getByRole('checkbox', { name: /Jabón/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: /Dónde se compra/ })).toHaveCount(0)
})

test('al escribir algo que ya está pendiente, avisa sin frenar', async ({ page }) => {
  const campo = page.getByRole('textbox', { name: 'Qué hay que comprar' })

  await campo.fill('lech')

  await expect(page.getByText('Ya está en la lista: Leche Dos Pinos 2L')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Agregar item' })).toBeEnabled()
})

test('las pestañas andan aunque un cambio de la hoja siga esperando al servidor', async ({
  page,
}) => {
  const hoja = await abrirLeche(page)
  await falso('/__demora?ms=8000')

  await hoja.getByRole('button', { name: 'Automercado' }).tap()
  await hoja.getByRole('button', { name: 'Cerrar' }).tap()
  await pestana(page, 'Gastos').tap()

  await expect(titulo(page)).toHaveText('Gastos', { timeout: 3_000 })
})
