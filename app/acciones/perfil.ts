'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/auth/session'
import { LARGO_MAXIMO_NOMBRE } from '@/lib/perfil/nombre'

export type EstadoNombre = { error?: string; guardado?: boolean }

export async function guardarNombre(
  _prev: EstadoNombre,
  formData: FormData,
): Promise<EstadoNombre> {
  // `apodo` y no `nombre`: Safari ignora `autoComplete="off"` y clasifica los
  // campos por su `name`. Uno llamado `nombre` lo toma por titular de tarjeta y
  // le ofrece a la persona los datos de su tarjeta de crédito. Es la misma razón
  // por la que `crearCasa` recibe `casa`.
  const nombre = String(formData.get('apodo') ?? '')
    .trim()
    .replace(/\s+/g, ' ')

  if (!nombre) return { error: 'Escribí tu nombre.' }
  if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    return { error: `El nombre es muy largo: máximo ${LARGO_MAXIMO_NOMBRE} caracteres.` }
  }

  // Bandera propia, no una URL del formulario: si el destino viniera del cliente
  // sería un redirect abierto de manual.
  const seguir = formData.get('seguir') === '1'

  try {
    const { supabase, user } = await requireUser()

    // El `eq` es redundante con la política `profiles_update`, pero la consulta
    // sin filtro dependería solo de RLS para no pisar filas ajenas.
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: nombre })
      .eq('id', user.id)

    if (error) return { error: 'No se pudo guardar. Intentá de nuevo.' }
  } catch {
    return { error: 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.' }
  }

  // 'layout': el nombre se pinta en el shell de todas las páginas, no solo acá.
  revalidatePath('/', 'layout')

  // `redirect()` lanza: va fuera del try para no atraparse a sí mismo.
  if (seguir) redirect('/')

  return { guardado: true }
}
