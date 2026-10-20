/**
 * Guardia de contraste: lee los tokens de `app/globals.css` y falla si algún
 * par que la app usa de verdad baja del mínimo de WCAG.
 *
 *   npm run contraste
 *
 * Es el equivalente de `lib/money/money.type-test.ts` para el color: si
 * alguien aclara un token "porque se ve mejor", esto se pone rojo antes de que
 * llegue al teléfono. Los pares están escritos a mano a propósito: cada uno
 * corresponde a un lugar de la UI, y el comentario dice cuál.
 */
import { readFileSync } from 'node:fs'

// Acepta otra ruta como argumento, para probar un cambio antes de hacerlo.
const ruta = process.argv[2] ?? new URL('../app/globals.css', import.meta.url)
const css = readFileSync(ruta, 'utf8')

/** Saca los `--nombre: #hex;` del primer bloque que abre con `selector {`. */
function tokens(selector) {
  const inicio = css.indexOf(`${selector} {`)
  if (inicio === -1) throw new Error(`No encontré el bloque ${selector} en globals.css`)
  const fin = css.indexOf('}', inicio)
  const bloque = css.slice(inicio, fin)
  return Object.fromEntries(
    [...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]),
  )
}

const claro = tokens(':root')
// Lo que el tema oscuro no redefine se hereda de :root.
const oscuro = { ...claro, ...tokens('.dark') }

// ── Color ────────────────────────────────────────────────────────────────

const aRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const lineal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function luminancia(rgb) {
  const [r, g, b] = rgb.map(lineal)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** `bg-x/10` de Tailwind: el color con alfa, compuesto sobre lo que hay debajo. */
function sobre(color, alfa, fondo) {
  return color.map((c, i) => alfa * c + (1 - alfa) * fondo[i])
}

/** `color-mix(in oklab, a p, b)`, como lo usan las etiquetas y el panel de filtros. */
function mezclaOklab(a, p, b) {
  const aOklab = (rgb) => {
    const [r, g, bl] = rgb.map(lineal)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl)
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ]
  }
  const deOklab = ([L, A, B]) => {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map((c) => Math.min(1, Math.max(0, gamma(c))))
  }
  const x = aOklab(a)
  const y = aOklab(b)
  return deOklab(x.map((v, i) => p * v + (1 - p) * y[i]))
}

// ── Pares ────────────────────────────────────────────────────────────────

const TEXTO = 4.5
const CONTROL = 3

/** Cada par: [qué es, color de adelante, color de atrás, mínimo]. */
function pares(t) {
  const c = (nombre) => {
    if (!t[nombre]) throw new Error(`Falta el token --${nombre} en globals.css`)
    return aRgb(t[nombre])
  }
  const superficies = ['fondo', 'superficie', 'superficie-alta']
  const lista = []

  for (const s of superficies) {
    lista.push([`tinta / ${s}`, c('tinta'), c(s), TEXTO])
    lista.push([`tinta-suave / ${s}`, c('tinta-suave'), c(s), TEXTO])
    // Enlaces, el botón del mes, la pestaña activa.
    lista.push([`marca / ${s}`, c('marca'), c(s), TEXTO])
    lista.push([`peligro / ${s}`, c('peligro'), c(s), TEXTO])
    // «Al día», «Le sobran», saldo a favor.
    lista.push([`ok / ${s}`, c('ok'), c(s), TEXTO])
    // Borde de input, select y textarea.
    lista.push([`borde-control / ${s}`, c('borde-control'), c(s), CONTROL])
  }

  // Botón principal, «+» de compras, anular, la tilde de comprado.
  for (const r of ['marca', 'peligro', 'ok']) {
    lista.push([`sobre-relleno / ${r}`, c('sobre-relleno'), c(r), TEXTO])
  }

  // Tienda activa: `bg-tinta text-fondo`.
  lista.push(['fondo / tinta', c('fondo'), c('tinta'), TEXTO])
  // Badge de tienda: `bg-borde-suave text-tinta-suave`.
  lista.push(['tinta-suave / borde-suave', c('tinta-suave'), c('borde-suave'), TEXTO])
  // Rol «Admin»: `bg-borde-suave text-tinta`.
  lista.push(['tinta / borde-suave', c('tinta'), c('borde-suave'), TEXTO])
  // «Terminar el mes» y otras filas con tinte de marca.
  lista.push(['marca / marca-tenue', c('marca'), c('marca-tenue'), TEXTO])
  lista.push([
    'marca / marca-tenue 40% sobre superficie-alta',
    c('marca'),
    sobre(c('marca-tenue'), 0.4, c('superficie-alta')),
    TEXTO,
  ])
  // Chip USD.
  lista.push(['usd / usd-tenue', c('usd'), c('usd-tenue'), TEXTO])
  // Alertas: `bg-peligro/10 text-peligro`, `bg-ok/10 text-ok` sobre el fondo.
  lista.push(['peligro / peligro 10% sobre fondo', c('peligro'), sobre(c('peligro'), 0.1, c('fondo')), TEXTO])
  lista.push(['ok / ok 10% sobre fondo', c('ok'), sobre(c('ok'), 0.1, c('fondo')), TEXTO])
  // Panel de filtros: marca al 12% sobre superficie, con el embudo en marca encima.
  lista.push([
    'marca / panel de filtros',
    c('marca'),
    mezclaOklab(c('marca'), 0.12, c('superficie')),
    TEXTO,
  ])

  // Etiquetas: el badge (tono sobre su tinte al 15%) y el chip activo
  // (superficie-alta sobre el tono lleno). Ver lib/compras/tonos.ts.
  for (let n = 1; n <= 8; n++) {
    const tono = c(`etiqueta-${n}`)
    lista.push([
      `etiqueta-${n} / su tinte`,
      tono,
      mezclaOklab(tono, 0.15, c('superficie-alta')),
      TEXTO,
    ])
    lista.push([`superficie-alta / etiqueta-${n}`, c('superficie-alta'), tono, TEXTO])
  }

  return lista
}

// ── Informe ──────────────────────────────────────────────────────────────

let fallas = 0

for (const [tema, t] of [
  ['claro', claro],
  ['oscuro', oscuro],
]) {
  console.log(`\nTema ${tema}`)
  for (const [nombre, adelante, atras, minimo] of pares(t)) {
    const ratio = contraste(adelante, atras)
    const pasa = ratio >= minimo
    if (!pasa) fallas++
    const marca = pasa ? '  ok ' : ' FALLA'
    console.log(`${marca}  ${ratio.toFixed(2).padStart(5)}:1  (mín. ${minimo})  ${nombre}`)
  }
}

if (fallas > 0) {
  console.error(`\n${fallas} ${fallas === 1 ? 'par no llega' : 'pares no llegan'} al mínimo.`)
  process.exit(1)
}
console.log('\nTodos los pares pasan.')
