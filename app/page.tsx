import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'

export default async function DashboardPage() {
  const { activa } = await contextoDeCasa()

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <OfflineBanner />

        <section className="border-borde bg-superficie rounded-2xl border p-5">
          <h1 className="text-tinta text-xl font-semibold">Estás en {activa.nombre}</h1>
          <p className="text-tinta-suave mt-2 text-base">
            {activa.rol === 'admin'
              ? 'Administrás esta casa: registrás los abonos, editás los gastos y cerrás el mes.'
              : 'Acá sos miembro: podés ver los gastos y editar la lista de compras, pero no editar gastos.'}
          </p>
        </section>

        <section className="border-borde border-borde-suave rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
            Todavía no hay nada que mostrar
          </h2>
          <p className="text-tinta-suave mt-2 text-base">
            El saldo del mes, el desglose por lista y el aviso del próximo corte llegan
            en las fases 6 y 7.
          </p>
        </section>
      </div>
    </Shell>
  )
}
