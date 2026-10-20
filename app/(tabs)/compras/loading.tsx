import { Barra, Esqueleto } from '@/components/ui/esqueleto'

/*
  Mismos altos y separaciones que la página: el título, la fila de chips de
  tienda (36px más el py-1.5 del carrusel) y el primer grupo con su título de
  24px. `Esqueleto` separa con gap-5 y la página con gap-4, por eso todo lo que
  viene después del título va en un bloque propio con gap-4 y -mt-1.
*/
export default function CargandoCompras() {
  return (
    <Esqueleto>
      {/* El título no depende de datos: sale escrito desde el primer cuadro. */}
      <h1 className="text-tinta text-xl font-semibold">Lista de compras</h1>
      <div className="-mt-1 flex flex-col gap-4">
        <div className="flex gap-2 py-1.5">
          {['w-20', 'w-24', 'w-28'].map((ancho) => (
            <Barra key={ancho} className={`h-9 ${ancho} rounded-full`} />
          ))}
        </div>
        {/* Un grupo con su título y filas de una línea, como la lista de verdad. */}
        <div className="flex flex-col gap-2">
          <Barra className="mx-1 my-0.5 h-5 w-24" />
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
      </div>
    </Esqueleto>
  )
}
