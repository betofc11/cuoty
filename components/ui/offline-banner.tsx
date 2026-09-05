'use client'

import { useEffect, useState } from 'react'

/**
 * Estado obligatorio en toda vista: sin conexión, con reintento visible.
 * Arranca en "en línea" para no romper la hidratación.
 */
export function OfflineBanner() {
  const [enLinea, setEnLinea] = useState(true)

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine)
    actualizar()
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    return () => {
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
    }
  }, [])

  if (enLinea) return null

  return (
    <div
      role="status"
      className="border-borde bg-superficie flex items-center justify-between gap-3
                 rounded-2xl border p-4"
    >
      <span className="text-tinta-suave text-base">Sin señal. No pudimos conectarnos.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-touch text-crc shrink-0 px-3 text-base font-semibold"
      >
        Reintentar
      </button>
    </div>
  )
}
