/**
 * Guard de regresión de la invariante 7 — CRC y USD nunca se suman.
 *
 * Este archivo no exporta nada y no corre en runtime: lo verifica `tsc`. Si
 * alguien afloja los tipos de `add`/`subtract` y sumar monedas distintas vuelve
 * a compilar, el `@ts-expect-error` deja de tener error que suprimir y
 * TypeScript falla ACÁ. La invariante no se puede perder en silencio.
 */

import { add, subtract, zero } from './index'

const colones = zero('CRC')
const dolares = zero('USD')

// Dentro de una misma moneda: compila.
add(colones, colones)
add(dolares, dolares)
subtract(colones, colones)
subtract(dolares, dolares)

// @ts-expect-error — sumar colones con dólares no compila.
add(colones, dolares)

// @ts-expect-error — restar dólares de colones tampoco.
subtract(colones, dolares)

// @ts-expect-error — ni al revés.
add(dolares, colones)

export {}
