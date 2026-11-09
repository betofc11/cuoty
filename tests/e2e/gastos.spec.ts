import { expect, test, titulo } from './apoyo'

/*
 * La pestaña de Gastos después de sacar el arrastre (noviembre de 2026). Con
 * cinco meses cerrados debiendo, eran cinco tarjetas ARRIBA de las listas, y
 * para ver el mes había que pasarlas todas. La casa de prueba repite eso: cuatro
 * meses con saldo vivo y uno ya saldado (`datosDeGastos` en `falso/datos.mjs`).
 */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** El mes que fue hace `n` meses en Costa Rica: año, número (1-12) y nombre. */
function mesAtrasPartes(n: number) {
  const [anio, mes] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number)
  const total = anio! * 12 + (mes! - 1) - n
  return { anio: Math.floor(total / 12), numero: (total % 12) + 1, nombre: MESES[total % 12]! }
}

/** «Octubre 2026». */
function mesAtras(n: number): string {
  const { nombre, anio } = mesAtrasPartes(n)
  return `${nombre} ${anio}`
}

/** '2026-10', la clave de la URL. */
function claveAtras(n: number): string {
  const { anio, numero } = mesAtrasPartes(n)
  return `${anio}-${String(numero).padStart(2, '0')}`
}

/** El desplegable del arrastre, al pie de Gastos. */
function arrastre(page: import('@playwright/test').Page) {
  return page.locator('details#arrastre')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/gastos')
  await expect(titulo(page)).toHaveText('Gastos')
})

test('las listas del mes se ven sin bajar, y el arrastre va plegado al pie', async ({
  page,
}) => {
  const servicios = page.getByRole('heading', { level: 2, name: 'Servicios' })
  await expect(servicios).toBeInViewport()

  // Ninguna tarjeta por mes, y los meses no se ven hasta abrirlo.
  await expect(page.getByText(/^Arrastre de /)).toHaveCount(0)
  await expect(arrastre(page)).toHaveCount(1)
  await expect(arrastre(page)).not.toHaveAttribute('open')
  await expect(arrastre(page).locator('summary')).toContainText('4 meses sin saldar · Marta')
  await expect(page.getByRole('link', { name: new RegExp(`^${mesAtras(1)}`) })).toBeHidden()

  const yLista = (await servicios.boundingBox())!.y
  const yArrastre = (await arrastre(page).boundingBox())!.y
  expect(yArrastre).toBeGreaterThan(yLista)
})

test('lo que me toca va en el encabezado de cada lista, sin «Ampliar por lista»', async ({
  page,
}) => {
  await expect(page.getByText('Ampliar por lista')).toHaveCount(0)
  await expect(page.getByText('Me toca ₡37.075', { exact: true })).toBeVisible()

  // El 50% ya lo dice la leyenda: la fila no lo repite, y la fecha de cobro va
  // en el mismo renglón.
  const luz = page.getByRole('link', { name: /^Luz ICE/ })
  await expect(luz).toContainText('Me toca ₡16.225 · se cobra el 12')
  await expect(luz).not.toContainText('50%')
})

test('una lista sin gastos aparece, con su «Editar %»', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 2, name: /^Sin gastos en / })).toBeVisible()
  await page.getByRole('link', { name: 'Editar % de Mascotas' }).tap()
  await expect(page).toHaveURL(/\/gastos\/porcentajes\//)
})

test('abierto, el arrastre muestra un mes por fila, del más nuevo al más viejo', async ({
  page,
}) => {
  await arrastre(page).locator('summary').tap()

  const meses = arrastre(page).getByRole('link')
  await expect(meses).toHaveCount(5)
  for (const [i, n] of [1, 2, 3, 4, 5].entries()) {
    await expect(meses.nth(i)).toContainText(mesAtras(n))
  }
  // El historial: el que ya se pagó sigue ahí, como saldado.
  await expect(meses.nth(4)).toContainText('Saldado')
})

test('al elegir un mes se ve quién arrastró qué, y «Volver» lo deja abierto', async ({
  page,
}) => {
  const { nombre, anio } = mesAtrasPartes(2)

  await arrastre(page).locator('summary').tap()
  await arrastre(page).getByRole('link', { name: new RegExp(`^${mesAtras(2)}`) }).tap()

  await expect(page).toHaveURL(`/gastos/arrastres/${claveAtras(2)}`)
  await expect(titulo(page)).toHaveText(`Arrastre de ${nombre.toLowerCase()} de ${anio}`)
  await expect(page.getByRole('heading', { name: 'Quién arrastró qué' })).toBeVisible()

  // Abonó una parte después del cierre: se ve lo que quedaba y lo que falta.
  const marta = page.getByRole('link', { name: /^Marta/ })
  await expect(marta).toContainText('Al cerrar quedaban ₡107.050')
  await expect(marta).toContainText('₡87.050')

  await page.getByRole('link', { name: 'Volver' }).tap()
  await expect(page).toHaveURL(/arrastre=abierto/)
  await expect(arrastre(page)).toHaveAttribute('open')
  await expect(arrastre(page).locator('summary')).toBeInViewport()
})

test('un mes saldado dice que no falta nada, y lleva a sus gastos', async ({ page }) => {
  const { nombre } = mesAtrasPartes(5)

  await page.goto(`/gastos/arrastres/${claveAtras(5)}`)
  await expect(page.getByText('Nada: ya está saldado')).toBeVisible()
  await expect(page.getByRole('link', { name: /^Marta/ })).toContainText('Saldado')

  await page.getByRole('link', { name: `Ver los gastos de ${nombre.toLowerCase()}` }).tap()
  await expect(page).toHaveURL(`/gastos?mes=${claveAtras(5)}`)
  await expect(page.getByText(`${mesAtras(5)} está cerrado`)).toBeVisible()
})

test('un mes que no es arrastre no existe', async ({ page }) => {
  // El mes abierto no está cerrado: no tiene arrastre.
  await page.goto(`/gastos/arrastres/${claveAtras(0)}`)
  await expect(page.getByText('No encontramos eso')).toBeVisible()
})

test('«Volver» desde un gasto de un mes cerrado vuelve a ese mes', async ({ page }) => {
  const octubre = mesAtras(1)

  await page.getByRole('button', { name: mesAtras(0) }).tap()
  await page.getByRole('link', { name: new RegExp(`^${octubre}`) }).tap()
  await expect(page.getByText(`${octubre} está cerrado`)).toBeVisible()

  await page.getByRole('link', { name: /^Servicios del mes/ }).tap()
  await expect(titulo(page)).toHaveText('Servicios del mes')

  await page.getByRole('link', { name: 'Volver' }).tap()
  await expect(page.getByText(`${octubre} está cerrado`)).toBeVisible()
})
