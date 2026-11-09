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
    ...datosDeGastos(),
  }
}

// ─────────────────────────────── Gastos ───────────────────────────────

const LUIS_M = '00000000-0000-4000-8000-0000000000b1'
const MARTA_M = '00000000-0000-4000-8000-0000000000b2'

/** UUID fijo a partir de un número: `idFijo(0x9_02)` → `…000000000902`. */
function idFijo(n) {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

/** '2026-11-01' y 2 → '2026-09-01'. Aritmética de calendario, sin Date. */
function mesesAntes(iso, n) {
  const [anio, mes] = iso.split('-').map(Number)
  const total = anio * 12 + (mes - 1) - n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`
}

/**
 * Como la casa real que pidió sacar los arrastres de Gastos: cinco meses
 * cerrados detrás del abierto, y Marta con saldo en cuatro de ellos. Uno ya
 * quedó saldado, uno recibió un abono después del cierre (la foto ya no es lo
 * que se debe) y uno trae dólares.
 *
 * Las vistas (`period_balances`, `membership_balances`) se calculan acá desde el
 * ledger y los abonos, igual que en Postgres, para que nunca se contradigan.
 */
export const IDS_GASTOS = {
  periodoAbierto: idFijo(0x9_01),
  servicios: idFijo(0x8_01),
  suscripciones: idFijo(0x8_02),
  mascotas: idFijo(0x8_03),
  luz: idFijo(0x7_01),
}

function datosDeGastos() {
  const actual = mesActualCR()
  let siguiente = 0x6_00
  const nuevoId = () => idFijo(++siguiente)

  const listas = [
    { id: IDS_GASTOS.servicios, name: 'Servicios', position: 0 },
    { id: IDS_GASTOS.suscripciones, name: 'Suscripciones', position: 1 },
    // Sin gastos este mes: la lista recién creada que hay que poder ver.
    { id: IDS_GASTOS.mascotas, name: 'Mascotas', position: 2 },
  ].map((l) => ({ ...l, house_id: CASA, archived_at: null, created_at: '2026-04-01T12:00:00+00:00' }))

  const reparto = {
    [IDS_GASTOS.servicios]: { [LUIS_M]: 50, [MARTA_M]: 50 },
    [IDS_GASTOS.suscripciones]: { [LUIS_M]: 100 },
    [IDS_GASTOS.mascotas]: { [LUIS_M]: 60, [MARTA_M]: 40 },
  }

  const list_shares = Object.entries(reparto).flatMap(([listId, partes]) =>
    Object.entries(partes).map(([membershipId, percent]) => ({
      id: nuevoId(),
      list_id: listId,
      membership_id: membershipId,
      percent,
      updated_at: '2026-04-01T12:00:00+00:00',
    })),
  )

  // Meses cerrados: cuánto le tocó a Marta, cuánto quedaba al cerrar (la foto)
  // y cuánto abonó después del cierre. Luis siempre queda al día.
  const cerrados = [
    { atras: 5, marta: 40_000, foto: 15_000, despues: 15_000 }, // saldado después
    { atras: 4, marta: 45_000, foto: 45_000, despues: 0 },
    { atras: 3, marta: 48_339, foto: 48_339, despues: 0 },
    { atras: 2, marta: 107_050, foto: 107_050, despues: 20_000 }, // abonó una parte
    { atras: 1, marta: 133_350.88, foto: 133_350.88, despues: 0, dolares: 7.75 },
  ]

  const periods = [
    {
      id: IDS_GASTOS.periodoAbierto,
      house_id: CASA,
      month: actual,
      status: 'open',
      closed_at: null,
      closed_by: null,
      created_at: '2026-04-01T12:00:00+00:00',
    },
  ]
  const expenses = []
  const ledger_entries = []
  const payments = []
  const payment_allocations = []
  const period_carryovers = []

  const gasto = ({ id = nuevoId(), periodId, mes, listId, name, amount, currency, dia, chargeDate = null }) => {
    const creado = `${mes.slice(0, 8)}${String(dia).padStart(2, '0')}T15:00:00+00:00`
    expenses.push({
      id,
      house_id: CASA,
      list_id: listId,
      period_id: periodId,
      name,
      amount,
      currency,
      charge_date: chargeDate,
      voided_at: null,
      voided_by: null,
      created_at: creado,
    })
    for (const [membershipId, percent] of Object.entries(reparto[listId])) {
      ledger_entries.push({
        id: nuevoId(),
        house_id: CASA,
        period_id: periodId,
        membership_id: membershipId,
        list_id: listId,
        expense_id: id,
        kind: 'charge',
        description: name,
        amount: Math.round(amount * percent) / 100,
        currency,
        percent_applied: percent,
        created_at: creado,
        created_by: USUARIO.id,
      })
    }
  }

  const abono = (membershipId, periodId, amount, currency, fecha) => {
    const pagoId = nuevoId()
    payments.push({
      id: pagoId,
      house_id: CASA,
      membership_id: membershipId,
      amount,
      currency,
      kind: 'payment',
      method: 'SINPE',
      note: null,
      recorded_at: fecha,
      recorded_by: USUARIO.id,
    })
    payment_allocations.push({
      id: nuevoId(),
      payment_id: pagoId,
      membership_id: membershipId,
      period_id: periodId,
      amount,
      currency,
    })
  }

  for (const c of cerrados) {
    const mes = mesesAntes(actual, c.atras)
    const periodId = idFijo(0x9_01 + c.atras)
    const cierre = `${mesesAntes(actual, c.atras - 1).slice(0, 8)}01T18:00:00+00:00`
    periods.push({
      id: periodId,
      house_id: CASA,
      month: mes,
      status: 'closed',
      closed_at: cierre,
      closed_by: USUARIO.id,
      created_at: `${mes.slice(0, 8)}01T12:00:00+00:00`,
    })

    // Servicios va 50/50: el gasto es el doble de lo que le tocó a Marta.
    gasto({ periodId, mes, listId: IDS_GASTOS.servicios, name: 'Servicios del mes', amount: c.marta * 2, currency: 'CRC', dia: 3 })
    if (c.dolares) {
      gasto({ periodId, mes, listId: IDS_GASTOS.servicios, name: 'Netflix', amount: c.dolares * 2, currency: 'USD', dia: 4 })
    }

    abono(LUIS_M, periodId, c.marta, 'CRC', `${mes.slice(0, 8)}20T15:00:00+00:00`)
    if (c.dolares) abono(LUIS_M, periodId, c.dolares, 'USD', `${mes.slice(0, 8)}20T15:00:00+00:00`)

    const antesDelCierre = c.marta - c.foto
    if (antesDelCierre > 0) abono(MARTA_M, periodId, antesDelCierre, 'CRC', `${mes.slice(0, 8)}25T15:00:00+00:00`)
    if (c.despues > 0) abono(MARTA_M, periodId, c.despues, 'CRC', `${actual.slice(0, 8)}02T15:00:00+00:00`)

    // `close_period` solo escribe la foto de lo que no da cero.
    period_carryovers.push({ id: nuevoId(), period_id: periodId, membership_id: MARTA_M, currency: 'CRC', amount: c.foto, created_at: cierre })
    if (c.dolares) {
      period_carryovers.push({ id: nuevoId(), period_id: periodId, membership_id: MARTA_M, currency: 'USD', amount: c.dolares, created_at: cierre })
    }
  }

  // El mes abierto: tres de Servicios, dos suscripciones en dólares que son
  // todas de Luis, y nada en Mascotas.
  const abierto = { periodId: IDS_GASTOS.periodoAbierto, mes: actual }
  gasto({ ...abierto, id: IDS_GASTOS.luz, listId: IDS_GASTOS.servicios, name: 'Luz ICE', amount: 32_450, currency: 'CRC', dia: 2, chargeDate: `${actual.slice(0, 8)}12` })
  gasto({ ...abierto, listId: IDS_GASTOS.servicios, name: 'Agua AyA', amount: 12_800, currency: 'CRC', dia: 2 })
  gasto({ ...abierto, listId: IDS_GASTOS.servicios, name: 'Internet Kölbi', amount: 28_900, currency: 'CRC', dia: 3, chargeDate: `${actual.slice(0, 8)}05` })
  gasto({ ...abierto, listId: IDS_GASTOS.suscripciones, name: 'Netflix', amount: 15.49, currency: 'USD', dia: 3 })
  gasto({ ...abierto, listId: IDS_GASTOS.suscripciones, name: 'iCloud', amount: 2.99, currency: 'USD', dia: 4 })

  // ── Las vistas, calculadas como en Postgres ──
  const suma = (filas, periodId, membershipId, currency) =>
    filas
      .filter((f) => f.period_id === periodId && f.membership_id === membershipId && f.currency === currency)
      .reduce((total, f) => total + f.amount, 0)

  const period_balances = periods.flatMap((p) =>
    [LUIS_M, MARTA_M].flatMap((membershipId) =>
      ['CRC', 'USD'].map((currency) => ({
        period_id: p.id,
        house_id: CASA,
        month: p.month,
        status: p.status,
        membership_id: membershipId,
        currency,
        balance:
          Math.round(
            (suma(ledger_entries, p.id, membershipId, currency) -
              suma(payment_allocations, p.id, membershipId, currency)) *
              100,
          ) / 100,
      })),
    ),
  )

  const membership_balances = [
    { membershipId: LUIS_M, userId: USUARIO.id },
    { membershipId: MARTA_M, userId: MARTA },
  ].flatMap(({ membershipId, userId }) =>
    ['CRC', 'USD'].map((currency) => ({
      house_id: CASA,
      membership_id: membershipId,
      user_id: userId,
      currency,
      balance:
        Math.round(
          period_balances
            .filter((b) => b.membership_id === membershipId && b.currency === currency)
            .reduce((total, b) => total + b.balance, 0) * 100,
        ) / 100,
    })),
  )

  return {
    periods,
    expense_lists: listas,
    list_shares,
    expenses,
    ledger_entries,
    payments,
    payment_allocations,
    period_carryovers,
    period_balances,
    membership_balances,
  }
}
