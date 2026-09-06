import Link from 'next/link'
import { notFound } from 'next/navigation'

import { crearGasto } from '@/app/gastos/acciones'
import { FormGasto } from '@/components/gastos/form-gasto'
import { Alert } from '@/components/ui/alert'
import { BackLink } from '@/components/ui/back-link'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { nombreDeMes } from '@/lib/fechas'

export default async function NuevoGastoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const { activa } = await contextoDeCasa()

  if (activa.rol !== 'admin') notFound()

  const { supabase } = await requireUser()
  await supabase.rpc('ensure_current_period', { p_house_id: activa.id })

  const [{ data: periodos }, { data: listas }] = await Promise.all([
    supabase
      .from('periods')
      .select('id, month')
      .eq('house_id', activa.id)
      .eq('status', 'open')
      .order('month', { ascending: false }),
    supabase
      .from('expense_lists')
      .select('id, name')
      .eq('house_id', activa.id)
      .is('archived_at', null)
      .order('position'),
  ])

  const periodo = (mes ? periodos?.find((p) => p.month.startsWith(mes)) : null) ?? periodos?.[0]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-5 p-4 py-5">
      <BackLink href="/gastos">Volver</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Nuevo gasto</h1>
        {periodo ? (
          <p className="text-tinta-suave text-base">
            Se carga a {nombreDeMes(periodo.month)}.
          </p>
        ) : null}
      </header>

      {!periodo ? (
        <Alert tono="error">
          No hay ningún mes abierto en esta casa. Abrí uno antes de agregar gastos.
        </Alert>
      ) : !listas || listas.length === 0 ? (
        <section className="border-borde-suave flex flex-col gap-4 rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta text-base font-semibold">Primero hace falta una lista</h2>
          <p className="text-tinta-suave text-base">
            Los gastos se reparten con los porcentajes de su lista — Servicios, Casa,
            Suscripciones. Sin lista no hay con qué repartir.
          </p>
          <Link
            href="/gastos/listas/nueva"
            className="min-h-touch bg-crc flex items-center justify-center rounded-2xl px-5
                       text-base font-semibold text-white"
          >
            Crear una lista
          </Link>
        </section>
      ) : (
        <FormGasto
          accion={crearGasto}
          listas={listas.map((l) => ({ id: l.id, nombre: l.name }))}
          periodoId={periodo.id}
          mesInicio={periodo.month.slice(0, 7)}
          etiquetaEnvio="Agregar gasto"
        />
      )}
    </div>
  )
}
