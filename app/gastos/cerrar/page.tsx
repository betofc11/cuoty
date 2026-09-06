import { notFound } from 'next/navigation'

import { ParDeMontos } from '@/components/dinero/par'
import { SaldoPar } from '@/components/dinero/saldo'
import { Alert } from '@/components/ui/alert'
import { BackLink } from '@/components/ui/back-link'
import { contextoDeCasa } from '@/lib/casas/activa'
import { claveDeMes, nombreDeMes } from '@/lib/fechas'
import { vistaDeCierre } from '@/lib/gastos/cierre'

import { Confirmar } from './confirmar'

export default async function CerrarMesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const { activa } = await contextoDeCasa()

  // Invariante 10: el cierre es manual y solo del admin.
  if (activa.rol !== 'admin' || !mes) notFound()

  const vista = await vistaDeCierre(mes)
  if (!vista) notFound()

  const corto = nombreDeMes(vista.mes, { conAnio: false }).toLowerCase()
  const cortoSig = nombreDeMes(vista.mesSiguiente, { conAnio: false }).toLowerCase()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href={`/gastos?mes=${claveDeMes(vista.mes)}`}>Volver</BackLink>

      <header className="flex flex-col gap-2">
        <h1 className="text-tinta text-xl font-semibold">Terminar {corto}</h1>
        <p className="text-tinta-suave text-base">
          Después de cerrar no se pueden agregar ni editar gastos de {corto}, y sus
          porcentajes no se recalculan nunca más.
        </p>
      </header>

      {vista.remanentes.length > 0 ? (
        <Alert tono="error">
          Quedan saldos sin abonar. Se arrastran a {cortoSig} como el arrastre de{' '}
          {nombreDeMes(vista.mes)}.
        </Alert>
      ) : (
        <Alert tono="ok">Todos están al día. No hay nada que arrastrar.</Alert>
      )}

      {vista.remanentes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
            Qué se arrastra
          </h2>
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {vista.remanentes.map((r) => (
              <li key={r.membershipId} className="flex items-center justify-between gap-3 p-4">
                <span className="text-tinta text-base">{r.nombre}</span>
                <SaldoPar par={r.saldo} tamano="normal" />
              </li>
            ))}
            {vista.alDia.map((nombre) => (
              <li key={nombre} className="flex items-center justify-between gap-3 p-4">
                <span className="text-tinta text-base">{nombre}</span>
                <span className="text-ok text-base font-semibold">al día</span>
              </li>
            ))}
          </ul>
          <p className="text-tinta-suave text-sm">
            Se guarda una foto del remanente de {corto}, y solo del suyo. Un saldo a favor
            también se arrastra.
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Resumen de {corto}
        </h2>
        <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
          <li className="flex items-start justify-between gap-3 p-4">
            <span className="text-tinta text-base">Gastos del mes</span>
            <ParDeMontos par={vista.gastosDelMes} tamano="normal" />
          </li>
          <li className="flex items-start justify-between gap-3 p-4">
            <span className="text-tinta text-base">Abonos registrados</span>
            <ParDeMontos par={vista.abonosDelMes} tamano="normal" />
          </li>
          <li className="flex items-center justify-between gap-3 p-4">
            <span className="text-tinta text-base">Recurrentes que siguen</span>
            <span className="text-tinta text-base font-semibold">
              {vista.recurrentesVigentes} de {vista.recurrentesTotales}
            </span>
          </li>
        </ul>
        <p className="text-tinta-suave text-sm">
          Al cerrar se abre {cortoSig} y se le cargan esos recurrentes.
        </p>
      </section>

      <Confirmar
        periodoId={vista.periodoId}
        mes={vista.mes}
        siguiente={vista.mesSiguiente}
      />
    </div>
  )
}
