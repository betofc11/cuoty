import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'

export default async function ComprasPage() {
  const { activa } = await contextoDeCasa()

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <OfflineBanner />

        <header className="flex flex-col gap-1">
          <h1 className="text-tinta text-xl font-semibold">Lista de compras</h1>
          <p className="text-tinta-suave text-base">
            Podés agregar, editar y borrar items.
          </p>
        </header>

        <section className="border-borde-suave rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
            En construcción
          </h2>
          <p className="text-tinta-suave mt-2 text-base">
            Items, tags, tiendas, filtros, comprados y fotos llegan en la fase 9. Acá la
            casa no cambia nada: en la lista de compras todos los miembros pueden todo.
          </p>
        </section>
      </div>
    </Shell>
  )
}
