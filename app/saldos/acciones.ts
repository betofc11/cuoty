'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { fromInput, type CurrencyCode } from '@/lib/money'

export type EstadoAbono = { error?: string }

export async function registrarAbono(
  _prev: EstadoAbono,
  formData: FormData,
): Promise<EstadoAbono> {
  const membershipId = String(formData.get('membershipId') ?? '')
  const moneda: CurrencyCode = String(formData.get('moneda')) === 'USD' ? 'USD' : 'CRC'
  const metodo = String(formData.get('metodo') ?? '').trim()

  const monto = fromInput(String(formData.get('monto') ?? ''), moneda)
  if (!monto || monto.minor <= 0) {
    return { error: 'El monto tiene que ser mayor que cero.' }
  }

  // Invariante 3: solo el admin registra abonos. RLS lo vuelve a exigir.
  const { activa } = await contextoDeCasa()
  if (activa.rol !== 'admin') {
    return { error: 'Solo quien administra la casa registra abonos.' }
  }

  try {
    const { supabase } = await requireUser()
    const { error } = await supabase.rpc('register_payment', {
      p_membership_id: membershipId,
      p_currency: moneda,
      p_amount: monto.minor / 100,
      p_method: metodo || undefined,
    })
    if (error) return { error: error.message }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  revalidatePath('/saldos', 'layout')
  redirect(`/saldos/${membershipId}`)
}
