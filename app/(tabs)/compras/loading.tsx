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
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-borde-suave bg-superficie-alta flex items-center gap-3 rounded-2xl border p-3.5"
          >
            <Barra className="size-6 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Barra className="h-4 w-1/2" />
              <Barra className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </Esqueleto>
  )
}
