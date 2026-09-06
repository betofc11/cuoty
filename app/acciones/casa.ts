'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { misCasas } from '@/lib/auth/session'
import { COOKIE_CASA } from '@/lib/casas/activa'

/**
 * Cambia la casa activa y recarga. Tocar la tuerca de una casa también pasa por
 * acá: cambiar de casa y abrir sus ajustes son la misma acción, solo cambia el
 * destino.
 */
export async function cambiarCasa(formData: FormData): Promise<void> {
  const id = String(formData.get('casaId') ?? '')
  const pedido = String(formData.get('destino') ?? '/')

  // RLS igual taparía los datos, pero no dejamos una cookie apuntando a
  // cualquier cosa.
  const casas = await misCasas()
  if (!casas.some((c) => c.id === id)) redirect('/')

  const store = await cookies()
  store.set(COOKIE_CASA, id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
  })

  revalidatePath('/', 'layout')

  const destino = pedido.startsWith('/') && !pedido.startsWith('//') ? pedido : '/'
  redirect(destino)
}
