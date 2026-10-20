'use client'

import { AvisoDeError } from '@/components/ui/aviso-de-error'

/**
 * Error dentro del marco: si falla Gastos, las tabs siguen ahí para irse a otra
 * pestaña. El de la raíz reemplazaba la pantalla entera.
 */
export default function ErrorDeTab({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col gap-6 py-6">
      <AvisoDeError error={error} reset={reset} />
    </div>
  )
}
