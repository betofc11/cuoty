import { Barra, Esqueleto } from '@/components/ui/esqueleto'

export default function CargandoSaldos() {
  return (
    <Esqueleto>
      <div className="flex flex-col gap-2">
        <Barra className="h-7 w-48" />
        <Barra className="h-4 w-4/5" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-borde bg-superficie flex flex-col gap-3 rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Barra className="h-4 w-1/2" />
                <Barra className="h-3 w-2/3" />
              </div>
              <Barra className="h-5 w-24" />
            </div>
            <Barra className="h-12 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </Esqueleto>
  )
}
