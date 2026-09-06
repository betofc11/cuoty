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
    let canal: ReturnType<typeof supabase.channel> | null = null
    let cancelado = false

    async function conectar() {
      // Realtime necesita el token ANTES de suscribirse: sin él el
      // servidor evalúa RLS como anónimo, no manda ningún evento y no
      // avisa. Es un fallo callado, que es el peor tipo.
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelado) return
      if (session) supabase.realtime.setAuth(session.access_token)

      canal = supabase
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
        .subscribe((estado) => {
          if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
            // Si esto falla la lista sigue funcionando, solo deja de
            // actualizarse sola. Vale más verlo que tragárselo.
            console.warn(`[Cuoty] Realtime no conectó: ${estado}`)
          }
        })
    }

    void conectar()

    return () => {
      cancelado = true
      if (canal) void supabase.removeChannel(canal)
    }
  }, [casaId, router])

  return null
}
