'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Registra el service worker y le avisa cuándo tirar el caché de páginas.
 *
 * Solo en producción: en desarrollo el worker se queda sirviendo HTML viejo y
 * uno termina depurando una pantalla que ya no existe en el código.
 */
export function RegistrarServiceWorker() {
  const pathname = usePathname()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    // Tras la carga: registrarlo antes compite por ancho de banda con lo que
    // la pantalla necesita para pintarse.
    const registrar = () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' })
    }

    if (document.readyState === 'complete') registrar()
    else window.addEventListener('load', registrar, { once: true })

    return () => window.removeEventListener('load', registrar)
  }, [])

  useEffect(() => {
    if (pathname !== '/login') return
    if (!('serviceWorker' in navigator)) return

    // Estar en /login significa que se cerró sesión o que nunca la hubo. En
    // los dos casos, el HTML guardado de pantallas con datos de la casa sobra.
    void navigator.serviceWorker.ready.then((registro) => {
      registro.active?.postMessage({ tipo: 'limpiar-paginas' })
    })
  }, [pathname])

  return null
}
