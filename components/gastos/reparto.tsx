import type { ParteDelReparto } from '@/lib/casas/personas'

function colorDelSegmento(tono: number): string {
  return `color-mix(in oklab, var(--persona-${tono}-tinta) 45%, var(--persona-${tono}-fondo))`
}

function formatoPorcentaje(percent: number): string {
  return `${percent.toLocaleString('es-CR', { maximumFractionDigits: 2 })}%`
}

/**
 * Cómo se reparte una lista o un gasto entre las personas de la casa: una barra
 * al 100% con un segmento por persona, en su tono, y la leyenda en texto debajo.
 *
 * Los porcentajes exactos van en la leyenda: la barra acompaña, no carga sola el
 * dato (por eso es `aria-hidden`). El segmento va en un tono intermedio entre el
 * fondo y la tinta de cada persona: el fondo pálido del avatar casi no se ve
 * sobre la tarjeta.
 *
 * Sin `'use client'` y sin estado: la usan las páginas del servidor y también el
 * editor de porcentajes, que le pasa los valores mientras se mueven.
 */
export function BarraDeReparto({ partes }: { partes: ParteDelReparto[] }) {
  const visibles = partes.filter((p) => p.percent > 0)
  if (visibles.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {visibles.map((p) => (
          <span
            key={p.membershipId}
            style={{ flexGrow: p.percent, flexBasis: 0, backgroundColor: colorDelSegmento(p.tono) }}
          />
        ))}
      </div>

      <ul className="text-tinta-suave flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {visibles.map((p) => (
          <li key={p.membershipId} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              style={{ backgroundColor: colorDelSegmento(p.tono) }}
              className="size-2 shrink-0 rounded-full"
            />
            {p.nombre} {formatoPorcentaje(p.percent)}
          </li>
        ))}
      </ul>
    </div>
  )
}
