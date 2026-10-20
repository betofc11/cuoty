import { Barra, Esqueleto, FilasEnTarjeta } from '@/components/ui/esqueleto'

export default function CargandoGastos() {
  return (
    <Esqueleto>
      <Barra className="h-12 w-48 rounded-full" />
      <div className="flex flex-col gap-2">
        <Barra className="h-4 w-32" />
        <Barra className="h-9 w-40" />
        <Barra className="h-4 w-4/5" />
      </div>
      <div className="flex flex-col gap-2">
        <Barra className="h-5 w-28" />
        <FilasEnTarjeta filas={3} />
      </div>
    </Esqueleto>
  )
}
