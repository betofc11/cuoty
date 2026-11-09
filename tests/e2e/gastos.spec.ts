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

/** «Octubre 2026» para el mes que fue hace `n` meses en Costa Rica. */
function mesAtras(n: number): string {
  const [anio, mes] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number)
  const total = anio! * 12 + (mes! - 1) - n
  return `${MESES[total % 12]} ${Math.floor(total / 12)}`
}

test.beforeEach(async ({ page }) => {
  await page.goto('/gastos')
  await expect(titulo(page)).toHaveText('Gastos')
})

test('las listas del mes se ven sin bajar, y el arrastre es una sola fila al pie', async ({
  page,
}) => {
  const servicios = page.getByRole('heading', { level: 2, name: 'Servicios' })
  await expect(servicios).toBeInViewport()

  // Ninguna tarjeta por mes.
  await expect(page.getByText(/^Arrastre de /)).toHaveCount(0)

  const arrastre = page.getByRole('link', { name: /^Arrastre/ })
  await expect(arrastre).toHaveCount(1)
  await expect(arrastre).toContainText('4 meses sin saldar · Marta')

  const yLista = (await servicios.boundingBox())!.y
  const yArrastre = (await arrastre.boundingBox())!.y
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

test('la pantalla del arrastre lista los meses del más viejo al más nuevo', async ({ page }) => {
  await page.getByRole('link', { name: /^Arrastre/ }).tap()

  await expect(page).toHaveURL('/gastos/arrastres')
  await expect(titulo(page)).toHaveText('Arrastre de meses cerrados')

  const meses = page.getByRole('heading', { level: 3 })
  await expect(meses).toHaveText([mesAtras(4), mesAtras(3), mesAtras(2), mesAtras(1)])

  // El que recibió un abono después del cierre muestra la foto aparte.
  await expect(page.getByText('Al cerrarlo quedaban ₡107.050')).toBeVisible()

  // Lo saldado queda a mano, plegado.
  await page.getByText('Ya saldados').tap()
  await expect(page.getByText(mesAtras(5))).toBeVisible()
  await expect(page.getByText('Saldado', { exact: true })).toBeVisible()

  // Cada persona lleva a su saldo, que es donde se abona.
  await page.getByRole('link', { name: /^Marta ₡45\.000/ }).tap()
  await expect(page).toHaveURL(/\/saldos\//)
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
