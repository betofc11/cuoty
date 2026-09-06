'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { COOKIE_TEMA, type Tema } from '@/lib/tema'

/**
 * No lleva `httpOnly`: el service worker no la necesita, pero tampoco hay nada
 * que proteger acá — es una preferencia visual, no una credencial.
 */
export async function cambiarTema(formData: FormData): Promise<void> {
  const pedido = String(formData.get('tema') ?? '')
  const tema: Tema =
    pedido === 'claro' || pedido === 'oscuro' || pedido === 'sistema' ? pedido : 'sistema'

  const store = await cookies()

  if (tema === 'sistema') {
    // Borrarla en vez de guardar 'sistema': ausencia = seguir al sistema, que
    // es exactamente lo que hace el CSS.
    store.delete(COOKIE_TEMA)
  } else {
    store.set(COOKIE_TEMA, tema, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  // 'layout' y no la página: la clase vive en el `<html>` del layout raíz.
  revalidatePath('/', 'layout')
}
