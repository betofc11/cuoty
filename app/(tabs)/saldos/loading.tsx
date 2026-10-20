import { Barra, Esqueleto } from '@/components/ui/esqueleto'

export default function CargandoSaldos() {
  return (
    <Esqueleto>
      {/* El título depende del rol («Saldos de la casa» o «Mi saldo»): va en barra. */}
      <div className="flex flex-col gap-2">
        <Barra className="h-7 w-48" />
        <Barra className="h-4 w-4/5" />
      </div>
      <div className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2 p-4">
            <Barra className="h-4 w-1/3" />
            <Barra className="h-5 w-1/2" />
            <Barra className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </Esqueleto>
  )
}
