/*
 * Un Supabase de mentira para las pruebas de punta a punta.
 *
 * La app de verdad corre contra esto en vez del proyecto real: así las pruebas
 * entran con sesión sin tocar usuarios reales, no dependen de la red y empiezan
 * siempre desde la misma casa (`datos.mjs`).
 *
 * Imita lo justo que usa Cuoty, ni más:
 *   - Auth: `GET /auth/v1/user` con el token de prueba, y el refresh.
 *   - PostgREST: select de columnas, filtros eq / neq / in / is / gt / gte /
 *     lt / lte, order, limit, y `.single()` / `.maybeSingle()`. Insert, update
 *     y delete con `Prefer: return=representation`.
 *   - Las RPC que necesitan las pantallas de las pruebas.
 *
 * No hay RLS: el usuario de prueba es el único que entra y ve toda la casa. Las
 * pruebas de RLS se hacen impersonando en SQL contra la base real (CLAUDE.md).
 *
 * `POST /__reiniciar` vuelve a los datos iniciales, para que cada prueba
 * arranque igual. `POST /__demora?ms=8000` hace esperar las escrituras, como
 * con la señal de un supermercado, y `POST /__fallar?tabla=shopping_items`
 * hace que las escrituras a esa tabla respondan con un error de Postgres.
 */

import { randomUUID } from 'node:crypto'
import http from 'node:http'

import { TOKEN, USUARIO, datosIniciales } from './datos.mjs'

const PUERTO = Number(process.env.PUERTO_SUPABASE_FALSO ?? 54399)

let tablas = datosIniciales()
let demoraEscrituras = 0
let tablaQueFalla = null

const USUARIO_AUTH = {
  id: USUARIO.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: USUARIO.email,
  email_confirmed_at: '2026-09-01T12:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-09-01T12:00:00Z',
  updated_at: '2026-09-01T12:00:00Z',
}

function responder(res, estado, cuerpo, cabeceras = {}) {
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    ...cabeceras,
  })
  res.end(cuerpo === undefined ? '' : JSON.stringify(cuerpo))
}

async function leerCuerpo(req) {
  let texto = ''
  for await (const parte of req) texto += parte
  return texto ? JSON.parse(texto) : null
}

// ─────────────────────────────── filtros ───────────────────────────────

/** `(a,b,"c, d")` → ['a', 'b', 'c, d']. */
function lista(valor) {
  const adentro = valor.replace(/^\(/, '').replace(/\)$/, '')
  const partes = []
  let actual = ''
  let entreComillas = false
  for (const c of adentro) {
    if (c === '"') entreComillas = !entreComillas
    else if (c === ',' && !entreComillas) {
      partes.push(actual)
      actual = ''
    } else actual += c
  }
  if (adentro.length) partes.push(actual)
  return partes
}

function cumple(fila, columna, expresion) {
  let negado = false
  let resto = expresion
  if (resto.startsWith('not.')) {
    negado = true
    resto = resto.slice(4)
  }
  const punto = resto.indexOf('.')
  const op = resto.slice(0, punto)
  const valor = resto.slice(punto + 1)
  const dato = fila[columna]

  let ok
  switch (op) {
    case 'eq':
      ok = dato !== null && dato !== undefined && String(dato) === valor
      break
    case 'neq':
      ok = dato !== null && dato !== undefined && String(dato) !== valor
      break
    case 'in':
      ok = dato !== null && dato !== undefined && lista(valor).includes(String(dato))
      break
    case 'is':
      ok = valor === 'null' ? dato === null || dato === undefined : String(dato) === valor
      break
    case 'gt':
      ok = dato !== null && dato > valor
      break
    case 'gte':
      ok = dato !== null && dato >= valor
      break
    case 'lt':
      ok = dato !== null && dato < valor
      break
    case 'lte':
      ok = dato !== null && dato <= valor
      break
    default:
      throw new Error(`El Supabase falso no sabe filtrar con «${op}» (${columna}=${expresion})`)
  }
  return negado ? !ok : ok
}

const NO_SON_FILTROS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

function filtrar(filas, params) {
  return filas.filter((fila) =>
    [...params.entries()].every(
      ([clave, valor]) => NO_SON_FILTROS.has(clave) || cumple(fila, clave, valor),
    ),
  )
}

/** `month.desc,id.asc.nullslast` */
function ordenar(filas, orden) {
  if (!orden) return filas
  const criterios = orden.split(',').map((c) => {
    const [columna, direccion = 'asc'] = c.split('.')
    return { columna, signo: direccion === 'desc' ? -1 : 1 }
  })
  return [...filas].sort((a, b) => {
    for (const { columna, signo } of criterios) {
      const x = a[columna]
      const y = b[columna]
      if (x === y) continue
      if (x === null || x === undefined) return 1
      if (y === null || y === undefined) return -1
      return (x < y ? -1 : 1) * signo
    }
    return 0
  })
}

function proyectar(filas, select) {
  if (!select || select === '*') return filas
  const columnas = select.split(',').map((c) => c.trim()).filter(Boolean)
  if (columnas.some((c) => c.includes('('))) {
    throw new Error(`El Supabase falso no hace embeds: select=${select}`)
  }
  return filas.map((f) => Object.fromEntries(columnas.map((c) => [c, f[c] ?? null])))
}

/** `.single()` pide un objeto y no un arreglo; `.maybeSingle()` llega como GET normal. */
function entregar(res, req, estado, filas) {
  const quiereObjeto = (req.headers.accept ?? '').includes('vnd.pgrst.object')
  if (!quiereObjeto) return responder(res, estado, filas)
  if (filas.length !== 1) {
    return responder(res, 406, {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: `The result contains ${filas.length} rows`,
      hint: null,
    })
  }
  return responder(res, estado, filas[0])
}

// ─────────────────────────────── RPC ───────────────────────────────

const RPC = {
  ensure_current_period(tablas, { p_house_id }) {
    return tablas.periods.find((p) => p.house_id === p_house_id && p.status === 'open') ?? null
  },

  add_shopping_item(tablas, { p_house_id, p_name, p_store_id, p_quantity, p_note, p_tag_ids }) {
    const nombre = String(p_name ?? '').replace(/\s+/g, ' ').trim()
    const normalizado = nombre.toLowerCase()
    let producto = tablas.products.find(
      (p) => p.house_id === p_house_id && p.normalized_name === normalizado,
    )
    if (!producto) {
      producto = {
        id: randomUUID(),
        house_id: p_house_id,
        name: nombre,
        normalized_name: normalizado,
        created_at: new Date().toISOString(),
        created_by: USUARIO.id,
      }
      tablas.products.push(producto)
    }
    const tienda =
      p_store_id ?? tablas.stores.find((s) => s.house_id === p_house_id && s.is_default)?.id
    const ahora = new Date().toISOString()
    const item = {
      id: randomUUID(),
      house_id: p_house_id,
      product_id: producto.id,
      store_id: tienda,
      quantity: p_quantity ?? null,
      note: p_note ?? null,
      status: 'pending',
      added_by: USUARIO.id,
      purchased_by: null,
      purchased_at: null,
      archived_at: null,
      created_at: ahora,
      updated_at: ahora,
    }
    tablas.shopping_items.push(item)
    for (const tagId of p_tag_ids ?? []) tablas.item_tags.push({ item_id: item.id, tag_id: tagId })
    return item.id
  },
}

// ─────────────────────────────── servidor ───────────────────────────────

function autorizado(req) {
  return req.headers.authorization === `Bearer ${TOKEN}`
}

function sesion() {
  return {
    access_token: TOKEN,
    refresh_token: 'refresh-de-prueba',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    user: USUARIO_AUTH,
  }
}

async function atender(req, res) {
  const url = new URL(req.url, `http://localhost:${PUERTO}`)
  const ruta = url.pathname

  if (req.method === 'OPTIONS') return responder(res, 204)

  if (ruta === '/__reiniciar' && req.method === 'POST') {
    tablas = datosIniciales()
    demoraEscrituras = 0
    tablaQueFalla = null
    return responder(res, 204)
  }

  if (ruta === '/__fallar' && req.method === 'POST') {
    tablaQueFalla = url.searchParams.get('tabla')
    return responder(res, 204)
  }

  if (ruta === '/__demora' && req.method === 'POST') {
    demoraEscrituras = Number(url.searchParams.get('ms') ?? 0)
    return responder(res, 204)
  }

  // Los datos de cuando llegó el pedido, no los de cuando termina la demora:
  // si una prueba reinicia mientras una escritura de la anterior espera, esa
  // escritura cae en los datos viejos y no ensucia la prueba nueva.
  const datos = tablas

  if (demoraEscrituras && req.method !== 'GET' && req.method !== 'HEAD') {
    await new Promise((listo) => setTimeout(listo, demoraEscrituras))
  }

  // Para que una prueba mire cómo quedó una tabla después de una acción.
  if (ruta.startsWith('/__tabla/')) {
    return responder(res, 200, datos[ruta.slice('/__tabla/'.length)] ?? [])
  }

  if (ruta === '/auth/v1/user') {
    return autorizado(req)
      ? responder(res, 200, USUARIO_AUTH)
      : responder(res, 401, { code: 401, msg: 'invalid JWT' })
  }
  if (ruta === '/auth/v1/token') return responder(res, 200, sesion())
  if (ruta === '/auth/v1/logout') return responder(res, 204)

  if (ruta.startsWith('/rest/v1/rpc/')) {
    const nombre = ruta.slice('/rest/v1/rpc/'.length)
    const fn = RPC[nombre]
    if (!fn) return responder(res, 404, { code: 'PGRST202', message: `rpc ${nombre} no existe en el falso` })
    return responder(res, 200, fn(datos, (await leerCuerpo(req)) ?? {}))
  }

  if (ruta.startsWith('/rest/v1/')) {
    const tabla = ruta.slice('/rest/v1/'.length)
    datos[tabla] ??= []
    const filas = datos[tabla]
    const params = url.searchParams
    const devolver = (req.headers.prefer ?? '').includes('return=representation')

    if (tabla === tablaQueFalla && req.method !== 'GET' && req.method !== 'HEAD') {
      return responder(res, 500, {
        code: 'XX000',
        message: 'error forzado por la prueba',
        details: null,
        hint: null,
      })
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      let resultado = ordenar(filtrar(filas, params), params.get('order'))
      const limite = params.get('limit')
      if (limite) resultado = resultado.slice(0, Number(limite))
      return entregar(res, req, 200, proyectar(resultado, params.get('select')))
    }

    if (req.method === 'POST') {
      const cuerpo = await leerCuerpo(req)
      const nuevas = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]).map((f) => ({
        id: randomUUID(),
        created_at: new Date().toISOString(),
        ...f,
      }))
      filas.push(...nuevas)
      return devolver
        ? entregar(res, req, 201, proyectar(nuevas, params.get('select')))
        : responder(res, 201)
    }

    if (req.method === 'PATCH') {
      const cambios = await leerCuerpo(req)
      const tocadas = filtrar(filas, params)
      for (const fila of tocadas) Object.assign(fila, cambios, { updated_at: new Date().toISOString() })
      return devolver
        ? entregar(res, req, 200, proyectar(tocadas, params.get('select')))
        : responder(res, 204)
    }

    if (req.method === 'DELETE') {
      const borradas = filtrar(filas, params)
      datos[tabla] = filas.filter((f) => !borradas.includes(f))
      return devolver
        ? entregar(res, req, 200, proyectar(borradas, params.get('select')))
        : responder(res, 204)
    }
  }

  return responder(res, 404, { message: `El Supabase falso no conoce ${req.method} ${ruta}` })
}

http
  .createServer((req, res) => {
    atender(req, res).catch((error) => {
      // Que se vea en la salida de Playwright: un 500 mudo esconde por qué
      // una pantalla salió vacía.
      console.error('[supabase falso]', error)
      responder(res, 500, { message: String(error?.message ?? error) })
    })
  })
  .listen(PUERTO, () => {
    console.log(`[supabase falso] escuchando en http://localhost:${PUERTO}`)
  })
