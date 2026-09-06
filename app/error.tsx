'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Estado de error obligatorio. No muestra `error.message`: esos textos vienen
 * de Postgres y de PostgREST, están en inglés y hablan de tablas y políticas.
 * El `digest` sí va, porque es lo único que sirve para encontrar el fallo en
 * los registros del servidor.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Cuoty]', error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-tinta text-xl font-semibold">Algo se rompió</h1>
        <p className="text-tinta-suave text-base">
          No es culpa tuya y no se perdió nada de lo que ya estaba guardado. Probá de
          nuevo.
        </p>
      </div>

      <button
        type="button"
        onClick={reset}
        className="min-h-touch bg-crc flex items-center justify-center rounded-2xl px-5
                   text-base font-semibold text-white"
      >
        Reintentar
      </button>

      <Link
        href="/"
        className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                   justify-center rounded-2xl border px-5 text-base font-semibold"
      >
        Ir al inicio
      </Link>

      {error.digest ? (
        <p className="text-tinta-suave text-center text-sm">
          Código del error: {error.digest}
        </p>
      ) : null}
    </div>
  )
}
