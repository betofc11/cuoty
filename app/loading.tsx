/**
 * Estado de carga obligatorio. Cubre todas las rutas que no traen el suyo.
 *
 * Son bloques grises y no un texto que diga «Cargando…»: la pantalla que viene
 * después tiene esta misma forma, así que nada salta de lugar al llegar.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-4 p-4 py-5"
    >
      {/* El texto va acá y no en un aria-label: una live region anuncia su
          CONTENIDO, y los bloques de abajo no tienen ninguno. Con solo el
          label, según el lector de pantalla, esto no anuncia nada. */}
      <span className="sr-only">Cargando…</span>

      <div className="bg-borde-suave h-6 w-2/3 animate-pulse rounded-lg" />
      <div className="bg-borde-suave h-4 w-1/2 animate-pulse rounded-lg" />

      <div className="mt-2 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-borde bg-superficie flex flex-col gap-2 rounded-2xl border p-4">
            <div className="bg-borde-suave h-4 w-3/5 animate-pulse rounded" />
            <div className="bg-borde-suave h-3 w-2/5 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
