import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { exigirNombre, misCasas, type Casa } from '@/lib/auth/session'

export const COOKIE_CASA = 'cuoty_casa'

/**
 * Qué casa está activa y cuáles hay. La activa vive en una cookie: sobrevive a
 * la recarga y el servidor la lee sin preguntarle nada al cliente.
 *
 * Si la cookie apunta a una casa de la que ya no sos miembro, se cae a la
 * primera. Nunca se confía en su valor: `misCasas()` pasa por RLS.
 */
export const contextoDeCasa = cache(
  async (): Promise<{ activa: Casa; casas: Casa[] }> => {
    // Antes que la casa: es lo primero que se le pide a quien recién entra, y
    // acá cae porque `Shell` llama a esto en toda página de la app. /bienvenida
    // y /cuenta no lo llaman, así que no hay ciclo de redirects.
    await exigirNombre()

    const casas = await misCasas()

    const primera = casas[0]
    if (!primera) redirect('/onboarding')

    const store = await cookies()
    const id = store.get(COOKIE_CASA)?.value
    const activa = casas.find((c) => c.id === id) ?? primera

    return { activa, casas }
  },
)
