'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * Dos personas en el super con el mismo teléfono abierto: cuando una
 * marca algo, la otra tiene que verlo sin recargar.
 *
 * Se escucha solo `shopping_items` y filtrado por casa. El evento no
 * trae los datos que la pantalla necesita (nombre del producto, tags),
 * así que en vez de reconstruir el estado acá se pide de nuevo el
 * Server Component, que ya sabe armarlo. RLS igual filtra los eventos:
 * nadie recibe cambios de una casa que no es suya.
 */
export function RealtimeCompras({ casaId }: { casaId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const canal = supabase
      .channel(`compras:${casaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `house_id=eq.${casaId}`,
        },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(canal)
    }
  }, [casaId, router])

  return null
}
