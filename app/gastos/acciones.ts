'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { mesActualCR } from '@/lib/fechas'
import { fromInput, type CurrencyCode, type MoneyAny } from '@/lib/money'

/**
 * PostgREST tipa `numeric` como número, así que el monto viaja como number y no
 * como string decimal.
 *
 * Es exacto igual: `minor` es un entero y JS imprime `minor / 100` con la
 * cadena más corta que redondea de vuelta al mismo double — que para un valor
 * de dos decimales es justo ese decimal. «1599 / 100» se serializa «15.99», y
 * Postgres lo lee exacto en numeric(14,2). El float nunca llega a la base.
 */
function paraLaBase(monto: MoneyAny): number {
  return monto.minor / 100
}

export type EstadoGasto = { error?: string }

function leerMoneda(formData: FormData): CurrencyCode {
  return String(formData.get('moneda')) === 'USD' ? 'USD' : 'CRC'
}

/**
 * Los errores de la base ya vienen en español y pensados para el usuario
 * (período cerrado, moneda inmutable, admin sin porcentaje). Solo se filtran
 * los que suenan a Postgres.
 */
function mensajeDeBase(bruto: string): string {
  return /violates|duplicate key|permission denied|syntax error|column|relation/i.test(bruto)
    ? 'No se pudo guardar. Intentá de nuevo.'
    : bruto
}

export async function crearGasto(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const listaId = String(formData.get('listaId') ?? '')
  const periodoId = String(formData.get('periodoId') ?? '')
  const fechaCobro = String(formData.get('fechaCobro') ?? '').trim()
  const moneda = leerMoneda(formData)

  if (!nombre) return { error: 'Ponele nombre al gasto.' }
  if (!listaId) return { error: 'Elegí una lista.' }

  const monto = fromInput(String(formData.get('monto') ?? ''), moneda)
  if (!monto || monto.minor <= 0) return { error: 'El monto tiene que ser mayor que cero.' }

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') return { error: 'Solo el admin agrega gastos.' }

  const esRecurrente = formData.get('recurrente') === 'on'
  // '2026-12' del selector, o vacío = sin fecha final.
  const ultimoCobro = String(formData.get('ultimoCobro') ?? '').trim()

  try {
    const { supabase } = await requireUser()

    if (!esRecurrente) {
      const { error } = await supabase.from('expenses').insert({
        house_id: activa.id,
        list_id: listaId,
        period_id: periodoId,
        name: nombre,
        amount: paraLaBase(monto),
        currency: moneda,
        charge_date: fechaCobro || null,
      })
      if (error) return { error: mensajeDeBase(error.message) }
    } else {
      const { data: periodo } = await supabase
        .from('periods')
        .select('month')
        .eq('id', periodoId)
        .maybeSingle()

      if (!periodo) return { error: 'No encontramos el mes al que cargarlo.' }

      if (ultimoCobro && `${ultimoCobro}-01` < periodo.month) {
        return { error: 'El último cobro no puede ser antes del mes en que empieza.' }
      }

      const { error } = await supabase.from('recurring_templates').insert({
        house_id: activa.id,
        list_id: listaId,
        name: nombre,
        amount: paraLaBase(monto),
        currency: moneda,
        charge_day: fechaCobro ? Number(fechaCobro.slice(8, 10)) : null,
        first_charge_month: periodo.month,
        last_charge_month: ultimoCobro ? `${ultimoCobro}-01` : null,
      })
      if (error) return { error: mensajeDeBase(error.message) }

      // La plantilla no cobra sola: crea la instancia de este mes.
      const { error: errorGen } = await supabase.rpc('generate_recurring_expenses', {
        p_period_id: periodoId,
      })
      if (errorGen) return { error: mensajeDeBase(errorGen.message) }
    }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/gastos')
  redirect('/gastos')
}

export async function editarGasto(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const gastoId = String(formData.get('gastoId') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const listaId = String(formData.get('listaId') ?? '')
  const fechaCobro = String(formData.get('fechaCobro') ?? '').trim()
  const moneda = leerMoneda(formData)

  if (!nombre) return { error: 'Ponele nombre al gasto.' }

  const monto = fromInput(String(formData.get('monto') ?? ''), moneda)
  if (!monto || monto.minor <= 0) return { error: 'El monto tiene que ser mayor que cero.' }

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') return { error: 'Solo el admin edita gastos.' }

  try {
    const { supabase } = await requireUser()
    // La moneda no se manda: es inmutable y la base lo rechazaría.
    const { error } = await supabase
      .from('expenses')
      .update({
        name: nombre,
        list_id: listaId,
        amount: paraLaBase(monto),
        charge_date: fechaCobro || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gastoId)
    if (error) return { error: mensajeDeBase(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/gastos')
  redirect('/gastos')
}

/**
 * Crear una lista reparte de una vez en partes iguales entre los miembros
 * activos. Sin porcentajes la lista no sirve: el trigger rechaza cualquier
 * gasto porque no hay quién absorba el residuo.
 */
export async function crearLista(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) return { error: 'Ponele nombre a la lista.' }

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') return { error: 'Solo el admin crea listas.' }

  try {
    const { supabase } = await requireUser()

    const { data: lista, error } = await supabase
      .from('expense_lists')
      .insert({ house_id: activa.id, name: nombre })
      .select('id')
      .single()

    if (error || !lista) return { error: mensajeDeBase(error?.message ?? 'Sin respuesta.') }

    const { data: miembros } = await supabase
      .from('memberships')
      .select('id, role, joined_at')
      .eq('house_id', activa.id)
      .is('left_at', null)
      .order('joined_at')

    const activos = miembros ?? []
    if (activos.length === 0) return { error: 'La casa no tiene miembros activos.' }

    // En puntos base para que sumen exactamente 100: el sobrante al admin.
    const base = Math.floor(10_000 / activos.length)
    const sobra = 10_000 - base * activos.length
    const admin = activos.find((m) => m.role === 'admin')?.id

    const { error: errorShares } = await supabase.from('list_shares').insert(
      activos.map((m) => ({
        list_id: lista.id,
        membership_id: m.id,
        percent: (base + (m.id === admin ? sobra : 0)) / 100,
      })),
    )

    if (errorShares) return { error: mensajeDeBase(errorShares.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/gastos')
  redirect('/gastos')
}

/**
 * Termina un recurrente: el mes en curso se cobra igual, y después deja de
 * aparecer. Por eso `last_charge_month` va al mes actual y no al anterior.
 */
export async function terminarRecurrente(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const plantillaId = String(formData.get('plantillaId') ?? '')

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') return { error: 'Solo el admin maneja los recurrentes.' }

  try {
    const { supabase } = await requireUser()
    const { error } = await supabase
      .from('recurring_templates')
      .update({ last_charge_month: mesActualCR() })
      .eq('id', plantillaId)
    if (error) return { error: mensajeDeBase(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/gastos/recurrentes')
  redirect('/gastos/recurrentes')
}

/**
 * Cierra el mes. Manual y solo del admin: el RPC lo vuelve a exigir, y RLS
 * detrás de él.
 */
export async function cerrarMes(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const periodoId = String(formData.get('periodoId') ?? '')
  const mesSiguienteClave = String(formData.get('mesSiguiente') ?? '').slice(0, 7)

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') {
    return { error: 'Solo quien administra la casa puede cerrar el mes.' }
  }

  try {
    const { supabase } = await requireUser()
    const { error } = await supabase.rpc('close_period', { p_period_id: periodoId })
    if (error) return { error: mensajeDeBase(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect(`/gastos?mes=${mesSiguienteClave}`)
}

export async function anularGasto(
  _prev: EstadoGasto,
  formData: FormData,
): Promise<EstadoGasto> {
  const gastoId = String(formData.get('gastoId') ?? '')

  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') return { error: 'Solo el admin anula gastos.' }

  try {
    const { supabase, user } = await requireUser()
    const { error } = await supabase
      .from('expenses')
      .update({ voided_at: new Date().toISOString(), voided_by: user.id })
      .eq('id', gastoId)
    if (error) return { error: mensajeDeBase(error.message) }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/gastos')
  redirect('/gastos')
}
