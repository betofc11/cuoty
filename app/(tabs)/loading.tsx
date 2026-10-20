import { Barra, Esqueleto, FilasEnTarjeta } from '@/components/ui/esqueleto'

/**
 * Carga del inicio, dentro del marco: el layout de las tabs queda montado y
 * solo el contenido espera. Las demás pestañas traen el suyo.
 */
export default function CargandoInicio() {
  return (
    <Esqueleto>
      <div className="border-borde bg-superficie flex flex-col gap-3 rounded-2xl border p-5">
        <Barra className="h-4 w-36" />
        <Barra className="h-9 w-44" />
        <Barra className="h-4 w-3/4" />
        <Barra className="h-5 w-40" />
      </div>
      <div className="flex flex-col gap-2">
        <Barra className="h-4 w-20" />
        <FilasEnTarjeta filas={2} />
      </div>
    </Esqueleto>
  )
}
