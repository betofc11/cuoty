import { Barra, Esqueleto, FilasEnTarjeta } from '@/components/ui/esqueleto'

export default function CargandoGastos() {
  return (
    <Esqueleto>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-tinta text-xl font-semibold">Gastos</h1>
        <Barra className="h-12 w-40 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-tinta text-base font-semibold">Mi cargo del mes</h2>
        <Barra className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-2">
        <Barra className="h-5 w-28" />
        <FilasEnTarjeta filas={3} />
      </div>
    </Esqueleto>
  )
}
