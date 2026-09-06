import Link from 'next/link'

import { ParDeMontos } from '@/components/dinero/par'
import { ChipMoneda, Monto } from '@/components/dinero/monto'
import { SelectorMes } from '@/components/gastos/selector-mes'
import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import { claveDeMes, diaYMes, nombreDeMes } from '@/lib/fechas'
import { vistaDeGastos } from '@/lib/gastos/consultas'

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const { activa } = await contextoDeCasa()
  const vista = await vistaDeGastos(mes)

  const esAdmin = activa.rol === 'admin'
  const cerrado = vista.periodo.estado === 'closed'
  const conGastos = vista.listas.filter((l) => l.gastos.length > 0)

  return (
    <Shell>
      <div className="flex flex-col gap-5">
        <OfflineBanner />

        <SelectorMes actual={vista.periodo} periodos={vista.periodos} />

        {cerrado ? (
          <p className="border-borde bg-superficie text-tinta-suave rounded-2xl border p-4 text-sm">
            {nombreDeMes(vista.periodo.mes)} está cerrado. No se agregan ni editan gastos,
            y sus porcentajes ya no se recalculan.
          </p>
        ) : null}

        {/* Solo el admin agrega. Al miembro no se le muestra apagado. */}
        {esAdmin && !cerrado ? (
          <div className="flex gap-2">
            <Link
              href={`/gastos/nuevo?mes=${claveDeMes(vista.periodo.mes)}`}
              className="min-h-touch bg-crc flex flex-1 items-center justify-center rounded-2xl
                         px-5 text-base font-semibold text-white"
            >
              Agregar gasto
            </Link>
            <Link
              href="/gastos/listas/nueva"
              className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                         justify-center rounded-2xl border px-4 text-base font-semibold"
            >
              Nueva lista
            </Link>
          </div>
        ) : null}

        <section className="flex flex-col gap-2">
          <h1 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
            Mi cargo del mes
          </h1>
          <ParDeMontos par={vista.miCargo} />
          <p className="text-tinta-suave text-sm">
            Lo que te tocó de los gastos de {nombreDeMes(vista.periodo.mes, { conAnio: false }).toLowerCase()}.
            Lo que queda tras los abonos es tu saldo, y va en el dashboard.
          </p>
        </section>

        {conGastos.length > 1 ? (
          <details className="border-borde bg-superficie rounded-2xl border">
            <summary className="min-h-touch text-tinta flex cursor-pointer items-center px-4 text-base font-medium">
              Ampliar por lista
            </summary>
            <ul className="divide-borde-suave divide-y border-t border-borde-suave">
              {conGastos.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-tinta text-base">{l.nombre}</span>
                  <ParDeMontos par={l.miSubtotal} tamano="normal" />
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {/* Arrastre: foto congelada, no una lista de gastos más. */}
        {vista.arrastres.map((a) => (
          <section
            key={a.periodoId}
            className="border-crc/30 bg-crc-tenue/40 flex flex-col gap-2 rounded-2xl border p-4"
          >
            <span className="text-crc text-xs font-semibold tracking-wide uppercase">
              Arrastre
            </span>
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-tinta text-base font-semibold">
                  {nombreDeMes(a.mes)}
                </span>
                <span className="text-tinta-suave text-sm">
                  {a.miembros} {a.miembros === 1 ? 'miembro debe' : 'miembros deben'}
                </span>
              </span>
              <ParDeMontos par={a.monto} tamano="normal" />
            </div>
            <p className="text-tinta-suave text-sm">
              Lo que quedó sin abonar en {nombreDeMes(a.mes, { conAnio: false }).toLowerCase()}.
              Se cobra junto con este mes y no se le agregan gastos nuevos.
            </p>
          </section>
        ))}

        {conGastos.length === 0 ? (
          <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
            <h2 className="text-tinta text-base font-semibold">
              Todavía no hay gastos en {nombreDeMes(vista.periodo.mes, { conAnio: false }).toLowerCase()}
            </h2>
            <p className="text-tinta-suave text-base">
              {esAdmin
                ? 'Agregá el primero y se reparte solo según los porcentajes de su lista.'
                : 'Cuando el admin agregue gastos, van a aparecer acá con lo que te toca.'}
            </p>
          </section>
        ) : null}

        {conGastos.map((lista) => (
          <section key={lista.id} className="flex flex-col gap-2">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-tinta text-base font-semibold">{lista.nombre}</h2>
              {/* Solo el admin reparte. Al miembro no se le muestra deshabilitado. */}
              {esAdmin && !cerrado ? (
                <Link
                  href={`/gastos/porcentajes/${lista.id}`}
                  className="min-h-touch text-crc flex items-center px-2 text-base font-semibold"
                >
                  Editar %
                </Link>
              ) : null}
            </header>

            <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
              {lista.gastos.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/gastos/${g.id}`}
                    className="active:bg-superficie-alta flex flex-col gap-1 p-4"
                  >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-tinta min-w-0 flex-1 text-base font-medium">
                      {g.nombre}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Monto monto={g.monto} />
                      <ChipMoneda moneda={g.moneda} />
                    </span>
                  </div>
                  <p className="text-tinta-suave text-sm">
                    {g.miPorcentaje !== null ? (
                      <>
                        {g.miPorcentaje}% · me toca{' '}
                        <Monto monto={g.miCargo} tamano="chico" />
                      </>
                    ) : (
                      'No te toca nada de este gasto'
                    )}
                  </p>

                  {/* Informativo y solo para el admin: nadie paga un gasto suelto. */}
                  {g.fechaCobro && esAdmin ? (
                    <p className="text-tinta-suave text-sm">
                      Se cobra el {diaYMes(g.fechaCobro)}
                    </p>
                  ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Shell>
  )
}
