import { notFound } from 'next/navigation'

import { editarGasto } from '@/app/gastos/acciones'
import { FormGasto } from '@/components/gastos/form-gasto'
import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { formatMoney, fromDecimal } from '@/lib/money'

import { BotonAnular } from './anular'

export default async function EditarGastoPage({
  params,
}: {
  params: Promise<{ gastoId: string }>
}) {
  const { gastoId } = await params
  const { activa } = await contextoDeCasa()

  if (activa.rol !== 'admin') notFound()

  const { supabase } = await requireUser()

  const { data: gasto } = await supabase
    .from('expenses')
    .select('id, house_id, list_id, name, amount, currency, charge_date, voided_at')
    .eq('id', gastoId)
    .maybeSingle()

  if (!gasto || gasto.house_id !== activa.id || gasto.voided_at) notFound()

  const { data: listas } = await supabase
    .from('expense_lists')
    .select('id, name')
    .eq('house_id', activa.id)
    .is('archived_at', null)
    .order('position')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href={`/gastos/${gasto.id}`}>Volver</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Editar gasto</h1>
        <p className="text-tinta-suave text-base">
          Cambiar el monto vuelve a repartirlo y anota la diferencia en el saldo de cada
          quien.
        </p>
      </header>

      <FormGasto
        accion={editarGasto}
        listas={(listas ?? []).map((l) => ({ id: l.id, nombre: l.name }))}
        gasto={{
          id: gasto.id,
          nombre: gasto.name,
          // Como lo escribiría una persona («38.400», no «38400.00»).
          // `fromInput` lo vuelve a leer bien al guardar.
          monto: formatMoney(fromDecimal(gasto.amount, gasto.currency)).replace(
            /^[₡$]/,
            '',
          ),
          moneda: gasto.currency,
          listaId: gasto.list_id,
          fechaCobro: gasto.charge_date,
        }}
        etiquetaEnvio="Guardar cambios"
      />

      <div className="border-borde border-t pt-6">
        <BotonAnular gastoId={gasto.id} nombre={gasto.name} />
      </div>
    </div>
  )
}
