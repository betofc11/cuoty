/*
 * La casa de las pruebas de punta a punta. Son datos inventados y viven solo en
 * la memoria del Supabase falso: nada de esto toca el proyecto real.
 *
 * Los ids son UUID fijos para que las pruebas puedan nombrar filas. Las fechas
 * salen de «ahora», así el mes abierto es el de hoy en Costa Rica y lo comprado
 * hoy cae en «Comprado hoy».
 */

export const USUARIO = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'luis@cuoty.test',
  nombre: 'Luis',
}

/** El token de la sesión falsa. Cualquier otro, el servidor lo rechaza. */
export const TOKEN = 'token-de-prueba'

const MARTA = '00000000-0000-4000-8000-000000000002'
const CASA = '00000000-0000-4000-8000-0000000000c1'

export const IDS = {
  casa: CASA,
  leche: '00000000-0000-4000-8000-0000000000a1',
  pinol: '00000000-0000-4000-8000-0000000000a2',
  pan: '00000000-0000-4000-8000-0000000000a3',
  cafe: '00000000-0000-4000-8000-0000000000a4',
  tomate: '00000000-0000-4000-8000-0000000000a5',
  jabon: '00000000-0000-4000-8000-0000000000a6',
}

/** '2026-10-01': el primer día del mes de hoy, en Costa Rica y no en UTC. */
function mesActualCR() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
  return `${partes}-01`
}

export function datosIniciales() {
  const ahora = new Date().toISOString()
  const antes = '2026-09-01T12:00:00+00:00'

  const tienda = (id, name) => ({
    id,
    house_id: CASA,
    name,
    created_at: antes,
    created_by: USUARIO.id,
  })

  const producto = (id, name) => ({
    id,
    house_id: CASA,
    name,
    normalized_name: name.toLowerCase(),
    created_at: antes,
    created_by: USUARIO.id,
  })

  const item = (id, productId, storeId, extra = {}) => ({
    id,
    house_id: CASA,
    product_id: productId,
    store_id: storeId,
    quantity: null,
    note: null,
    status: 'pending',
    added_by: USUARIO.id,
    purchased_by: null,
    purchased_at: null,
    archived_at: null,
    created_at: antes,
    updated_at: antes,
    ...extra,
  })

  return {
    profiles: [
      { id: USUARIO.id, display_name: USUARIO.nombre, avatar_url: null, created_at: antes },
      { id: MARTA, display_name: 'Marta', avatar_url: null, created_at: antes },
    ],
    houses: [
      { id: CASA, name: 'Casa de prueba', join_code: 'CASA-PRUE', created_at: antes, created_by: USUARIO.id },
    ],
    memberships: [
      {
        id: '00000000-0000-4000-8000-0000000000b1',
        house_id: CASA,
        user_id: USUARIO.id,
        role: 'admin',
        joined_at: '2026-09-01T12:00:00+00:00',
        left_at: null,
      },
      {
        id: '00000000-0000-4000-8000-0000000000b2',
        house_id: CASA,
        user_id: MARTA,
        role: 'member',
        joined_at: '2026-09-02T12:00:00+00:00',
        left_at: null,
      },
    ],
    // «En cualquier tienda» no es una tienda: es un item con `store_id: null`.
    stores: [
      tienda('00000000-0000-4000-8000-0000000000d1', 'Walmart'),
      tienda('00000000-0000-4000-8000-0000000000d2', 'Automercado'),
    ],
    tags: [
      { id: '00000000-0000-4000-8000-0000000000e1', house_id: CASA, name: 'Frescos' },
      { id: '00000000-0000-4000-8000-0000000000e2', house_id: CASA, name: 'Limpieza' },
    ],
    products: [
      producto('00000000-0000-4000-8000-0000000000f1', 'Leche Dos Pinos 2L'),
      producto('00000000-0000-4000-8000-0000000000f2', 'Pinol 1L'),
      producto('00000000-0000-4000-8000-0000000000f3', 'Pan cuadrado'),
      producto('00000000-0000-4000-8000-0000000000f4', 'Café Britt 340g'),
      producto('00000000-0000-4000-8000-0000000000f5', 'Tomate'),
      producto('00000000-0000-4000-8000-0000000000f6', 'Jabón de platos'),
    ],
    shopping_items: [
      item(IDS.leche, '00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000d1', {
        quantity: '2',
      }),
      item(IDS.pinol, '00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000d1'),
      item(IDS.pan, '00000000-0000-4000-8000-0000000000f3', null, {
        note: 'El integral',
      }),
      item(IDS.cafe, '00000000-0000-4000-8000-0000000000f4', '00000000-0000-4000-8000-0000000000d2'),
      item(IDS.tomate, '00000000-0000-4000-8000-0000000000f5', null, {
        quantity: '1 kg',
        status: 'purchased',
        purchased_by: MARTA,
        purchased_at: ahora,
      }),
      // Comprado antes de hoy: va plegado en «Comprado», bajo «Antes de hoy».
      item(IDS.jabon, '00000000-0000-4000-8000-0000000000f6', '00000000-0000-4000-8000-0000000000d1', {
        status: 'purchased',
        purchased_by: USUARIO.id,
        purchased_at: antes,
      }),
    ],
    item_tags: [
      { item_id: IDS.leche, tag_id: '00000000-0000-4000-8000-0000000000e1' },
      { item_id: IDS.pinol, tag_id: '00000000-0000-4000-8000-0000000000e2' },
    ],
    periods: [
      {
        id: '00000000-0000-4000-8000-000000000901',
        house_id: CASA,
        month: mesActualCR(),
        status: 'open',
        closed_at: null,
        closed_by: null,
        created_at: antes,
      },
    ],
    expense_lists: [
      {
        id: '00000000-0000-4000-8000-000000000801',
        house_id: CASA,
        name: 'Servicios',
        position: 0,
        archived_at: null,
        created_at: antes,
      },
    ],
  }
}
