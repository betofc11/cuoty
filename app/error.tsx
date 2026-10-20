'use client'

import { AvisoDeError } from '@/components/ui/aviso-de-error'

/**
 * Estado de error obligatorio de las pantallas a pantalla completa. Las tabs
 * traen el suyo en `app/(tabs)/error.tsx`, dentro del marco.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-app mx-auto flex min-h-dvh w-full flex-col justify-center gap-6 p-4">
      <AvisoDeError error={error} reset={reset} />
    </div>
  )
}
