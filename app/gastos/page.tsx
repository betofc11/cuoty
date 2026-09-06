import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'

export default async function GastosPage() {
  const { activa } = await contextoDeCasa()

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <OfflineBanner />

        <header className="flex flex-col gap-1">
          <h1 className="text-tinta text-xl font-semibold">Gastos</h1>
          <p className="text-tinta-suave text-base">{activa.nombre}</p>
        </header>

        <section className="border-borde-suave rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
            En construcción
          </h2>
          <p className="text-tinta-suave mt-2 text-base">
            Las listas, los gastos y el editor de porcentajes llegan en la fase 6.
            {activa.rol === 'member'
              ? ' Como miembro vas a poder verlos, no editarlos.'
              : ' Como admin vas a poder crearlos y repartir los porcentajes.'}
          </p>
        </section>
      </div>
    </Shell>
  )
}
