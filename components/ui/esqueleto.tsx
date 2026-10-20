/**
 * Piezas de los `loading.tsx`. Cada pantalla arma su esqueleto con la forma
 * que va a tener: un monto de 30px lleva una barra de 36, una fila conserva su
 * alto, y los títulos que no dependen de datos se escriben de una vez. Así nada
 * salta de lugar cuando llegan los datos.
 */
export function Barra({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-borde-suave rounded-lg motion-safe:animate-pulse ${className}`} />
}

/** Contenedor con el aviso para lectores de pantalla. */
export function Esqueleto({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-5">
      {/* El texto va acá y no en un aria-label: una live region anuncia su
          CONTENIDO, y las barras no tienen ninguno. */}
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  )
}

/** Una tarjeta con filas de dos líneas, como las listas de la app. */
export function FilasEnTarjeta({ filas }: { filas: number }) {
  return (
    <div className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 p-4">
          <div className="flex flex-1 flex-col gap-2">
            <Barra className="h-4 w-3/5" />
            <Barra className="h-3 w-2/5" />
          </div>
          <Barra className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}
