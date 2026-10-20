import { Barra, Esqueleto } from '@/components/ui/esqueleto'

export default function CargandoCompras() {
  return (
    <Esqueleto>
      {/* El título no depende de datos: sale escrito desde el primer cuadro. */}
      <div className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Lista de compras</h1>
        <Barra className="mt-1 h-4 w-28" />
      </div>
      <Barra className="h-12 w-full rounded-2xl" />
      {/* Un grupo con su título y filas de una línea, como la lista de verdad. */}
      <div className="flex flex-col gap-2">
        <Barra className="mx-1 h-5 w-24" />
        <div className="border-borde bg-superficie-alta divide-borde-suave divide-y rounded-2xl border">
          {['w-1/2', 'w-2/5', 'w-3/5', 'w-1/3', 'w-1/2'].map((ancho, i) => (
            <div key={i} className="min-h-touch flex items-center gap-3 pr-4 pl-3">
              <Barra className="size-6 shrink-0 rounded-full" />
              <div className="flex-1">
                <Barra className={`h-4 ${ancho}`} />
              </div>
              <Barra className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </Esqueleto>
  )
}
