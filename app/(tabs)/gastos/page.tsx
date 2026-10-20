import Link from 'next/link'

import { ParDeMontos } from '@/components/dinero/par'
import { ChipMoneda, Monto } from '@/components/dinero/monto'
import { SelectorMes } from '@/components/gastos/selector-mes'
import { AccionDePie } from '@/components/shell/accion-de-pie'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import { claveDeMes, diaYMes, fechaCorta, nombreDeMes } from '@/lib/fechas'
import { vistaDeGastos } from '@/lib/gastos/consultas'
import { isZero } from '@/lib/money'

const BOTON_SECUNDARIO =
  'min-h-touch border-borde bg-superficie-alta text-tinta flex flex-1 items-center ' +
  'justify-center rounded-2xl border px-4 text-base font-semibold'

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
    <div className="flex flex-col gap-5">
      <OfflineBanner />

      <header className="flex items-center justify-between gap-3">
        <h1 className="text-tinta text-xl font-semibold">Gastos</h1>
        <SelectorMes actual={vista.periodo} periodos={vista.periodos} esAdmin={esAdmin} />
      </header>

      {/* Solo el admin agrega, y solo en un mes abierto. Al miembro no se le
          muestra apagado. Va sobre las tabs, como el alta de Compras: es lo que
          más se hace acá, y arriba empujaba los gastos fuera de la pantalla. */}
      {esAdmin && !cerrado ? (
        <AccionDePie>
          <div className="px-4 py-3">
            <Link
              href={`/gastos/nuevo?mes=${claveDeMes(vista.periodo.mes)}`}
              className="min-h-touch bg-marca flex items-center justify-center rounded-2xl
                         px-5 text-base font-semibold text-sobre-relleno"
            >
              Agregar gasto
            </Link>
          </div>
        </AccionDePie>
      ) : null}

      {cerrado ? (
        <div className="border-borde bg-superficie flex flex-col gap-1 rounded-2xl border p-4">
          <span className="text-tinta text-base font-semibold">
            {nombreDeMes(vista.periodo.mes)} está cerrado
          </span>
          {vista.cierre ? (
            <span className="text-tinta-suave text-sm">
              Cerrado por {vista.cierre.cerradoPor} · {fechaCorta(vista.cierre.cerradoEl)}
            </span>
          ) : null}
          <span className="text-tinta-suave text-sm">
            No se agregan ni editan gastos, y sus porcentajes ya no se recalculan.
          </span>
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-tinta text-base font-semibold">Mi cargo del mes</h2>
        <ParDeMontos par={vista.miCargo} />
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

      {/* Arrastre: saldo vivo de un mes cerrado, no una lista de gastos más. */}
      {vista.arrastres.map((a) => (
        <section
          key={a.periodoId}
          className="border-borde bg-superficie flex flex-col gap-2 rounded-2xl border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="text-tinta text-base font-semibold">
                Arrastre de {nombreDeMes(a.mes, { conAnio: false }).toLowerCase()}
              </h2>
              <span className="text-tinta-suave text-sm">
                {a.miembros} {a.miembros === 1 ? 'miembro debe' : 'miembros deben'}
              </span>
            </div>
            <ParDeMontos par={a.monto} tamano="normal" />
          </div>
          <p className="text-tinta-suave text-sm">Se cobra junto con este mes.</p>
          {/* La foto del cierre, solo si ya abonaron algo: sin esto el número
              de arriba parece contradecir lo que se vio al cerrar el mes. */}
          {a.alCerrar ? (
            <p className="text-tinta-suave text-sm">
              Al cerrarlo quedaban{' '}
              {!isZero(a.alCerrar.CRC) ? <Monto monto={a.alCerrar.CRC} tamano="chico" /> : null}
              {!isZero(a.alCerrar.CRC) && !isZero(a.alCerrar.USD) ? ' y ' : null}
              {!isZero(a.alCerrar.USD) ? <Monto monto={a.alCerrar.USD} tamano="chico" /> : null}
              {' '}· ya abonaron la diferencia.
            </p>
          ) : null}
        </section>
      ))}

      {conGastos.length === 0 ? (
        <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta text-base font-semibold">
            Todavía no hay gastos en {nombreDeMes(vista.periodo.mes, { conAnio: false }).toLowerCase()}
          </h2>
          <p className="text-tinta-suave text-base">
            {esAdmin
              ? 'Agregá el primero con el botón de abajo: se reparte solo según los porcentajes de su lista.'
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
                className="min-h-touch text-marca flex items-center px-2 text-base font-semibold"
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

      {/* Lo que el admin usa poco va al final, en la misma fila secundaria que
          Compras usa para «Etiquetas» y «Tiendas». */}
      {esAdmin ? (
        <div className="border-borde flex gap-2 border-t pt-4">
          {!cerrado ? (
            <Link href="/gastos/listas/nueva" className={BOTON_SECUNDARIO}>
              Nueva lista
            </Link>
          ) : null}
          <Link href="/gastos/recurrentes" className={BOTON_SECUNDARIO}>
            Recurrentes
          </Link>
        </div>
      ) : null}
    </div>
  )
}
