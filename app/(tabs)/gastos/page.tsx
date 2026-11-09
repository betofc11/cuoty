import Link from 'next/link'

import { ParDeMontos } from '@/components/dinero/par'
import { ChipMoneda, Monto } from '@/components/dinero/monto'
import { ArrastrePlegable } from '@/components/gastos/arrastre'
import { BarraDeReparto } from '@/components/gastos/reparto'
import { SelectorMes } from '@/components/gastos/selector-mes'
import { AccionDePie } from '@/components/shell/accion-de-pie'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import { claveDeMes, diaYMesCorto, fechaCorta, nombreDeMes } from '@/lib/fechas'
import { vistaDeArrastres } from '@/lib/gastos/arrastres'
import { vistaDeGastos, type GastoVista, type ListaVista } from '@/lib/gastos/consultas'
import { isZero, type MoneyPair } from '@/lib/money'

const BOTON_SECUNDARIO =
  'min-h-touch border-borde bg-superficie-alta text-tinta flex flex-1 items-center ' +
  'justify-center rounded-2xl border px-4 text-base font-semibold'

/** «Me toca ₡37.075», o «… y $18,48» si la lista trae las dos monedas. */
function MiParte({ par }: { par: MoneyPair }) {
  const hayCrc = !isZero(par.CRC)
  const hayUsd = !isZero(par.USD)

  return (
    <>
      Me toca {hayCrc || !hayUsd ? <Monto monto={par.CRC} tamano="chico" /> : null}
      {hayCrc && hayUsd ? ' y ' : null}
      {hayUsd ? <Monto monto={par.USD} tamano="chico" /> : null}
    </>
  )
}

/**
 * El segundo renglón de un gasto: lo que me toca y, para el admin, cuándo se
 * cobra. Antes eran dos renglones más («50% · me toca …» y «Se cobra el …»).
 *
 * El porcentaje sale solo cuando dice algo que la leyenda de arriba no dice: en
 * un mes cerrado (no hay leyenda) o si el gasto se repartió con otro porcentaje
 * que el vigente. Repetir «50%» en cada fila, debajo de «Luis 50%», era ruido.
 */
function DetalleDelGasto({
  gasto,
  miPorcentajeVigente,
  algoMeToca,
  conFecha,
}: {
  gasto: GastoVista
  miPorcentajeVigente: number | null
  algoMeToca: boolean
  conFecha: boolean
}) {
  const partes: React.ReactNode[] = []

  if (gasto.miPorcentaje !== null) {
    const conPorcentaje = gasto.miPorcentaje !== miPorcentajeVigente
    partes.push(
      <span key="parte">
        {conPorcentaje ? `${gasto.miPorcentaje}% · me toca ` : 'Me toca '}
        <Monto monto={gasto.miCargo} tamano="chico" />
      </span>,
    )
  } else if (algoMeToca) {
    // Si no me toca nada de toda la lista, ya lo dice el encabezado una vez.
    partes.push(<span key="parte">No te toca</span>)
  }

  if (conFecha && gasto.fechaCobro) {
    const fecha = diaYMesCorto(gasto.fechaCobro)
    partes.push(
      <span key="fecha">{partes.length > 0 ? `se cobra el ${fecha}` : `Se cobra el ${fecha}`}</span>,
    )
  }

  if (partes.length === 0) return null

  return (
    <p className="text-tinta-suave text-sm">
      {partes.flatMap((p, i) => (i === 0 ? [p] : [' · ', p]))}
    </p>
  )
}

function SeccionDeLista({
  lista,
  miMembresia,
  editable,
  esAdmin,
}: {
  lista: ListaVista
  miMembresia: string
  editable: boolean
  esAdmin: boolean
}) {
  const algoMeToca = lista.gastos.some((g) => g.miPorcentaje !== null)
  const miPorcentajeVigente =
    lista.reparto.find((p) => p.membershipId === miMembresia)?.percent ?? null

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-tinta text-base font-semibold">{lista.nombre}</h2>
          {/* Lo que antes escondía «Ampliar por lista», ahora junto a su lista. */}
          <span className="text-tinta-suave text-sm">
            {algoMeToca ? <MiParte par={lista.miSubtotal} /> : 'No te toca nada de esta lista'}
          </span>
        </div>
        {/* Solo el admin reparte. Al miembro no se le muestra deshabilitado. */}
        {editable ? (
          <Link
            href={`/gastos/porcentajes/${lista.id}`}
            className="min-h-touch text-marca flex shrink-0 items-center px-2 text-base font-semibold"
          >
            Editar %
          </Link>
        ) : null}
      </header>

      {/* Vacío en un mes cerrado: ver `ListaVista.reparto`. */}
      <BarraDeReparto partes={lista.reparto} />

      <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
        {lista.gastos.map((g) => (
          <li key={g.id}>
            <Link
              href={`/gastos/${g.id}`}
              className="active:bg-superficie-alta flex flex-col gap-1 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-tinta min-w-0 flex-1 text-base font-medium">{g.nombre}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Monto monto={g.monto} />
                  <ChipMoneda moneda={g.moneda} />
                </span>
              </div>
              {/* La fecha de cobro es informativa y solo del admin: nadie paga
                  un gasto suelto. */}
              <DetalleDelGasto
                gasto={g}
                miPorcentajeVigente={miPorcentajeVigente}
                algoMeToca={algoMeToca}
                conFecha={esAdmin}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; arrastre?: string }>
}) {
  const { mes, arrastre } = await searchParams
  const { activa } = await contextoDeCasa()
  const [vista, arrastres] = await Promise.all([vistaDeGastos(mes), vistaDeArrastres()])

  const esAdmin = activa.rol === 'admin'
  const cerrado = vista.periodo.estado === 'closed'
  const editable = esAdmin && !cerrado
  const mesCorto = nombreDeMes(vista.periodo.mes, { conAnio: false }).toLowerCase()
  const conGastos = vista.listas.filter((l) => l.gastos.length > 0)
  // Una lista recién creada no tiene gastos, y antes no aparecía en ningún
  // lado: ni para verla ni para ajustarle los porcentajes. Solo al admin y con
  // el mes abierto, que es cuando se puede hacer algo con ella.
  const sinGastos = editable ? vista.listas.filter((l) => l.gastos.length === 0) : []

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
      {editable ? (
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

      {conGastos.length === 0 ? (
        <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
          <h2 className="text-tinta text-base font-semibold">
            Todavía no hay gastos en {mesCorto}
          </h2>
          <p className="text-tinta-suave text-base">
            {editable
              ? 'Agregá el primero con el botón de abajo: se reparte solo según los porcentajes de su lista.'
              : cerrado
                ? 'Este mes cerró sin gastos.'
                : 'Cuando el admin agregue gastos, van a aparecer acá con lo que te toca.'}
          </p>
        </section>
      ) : null}

      {/* Las listas del mes van primero: es lo que se viene a ver a Gastos. */}
      {conGastos.map((lista) => (
        <SeccionDeLista
          key={lista.id}
          lista={lista}
          miMembresia={activa.membershipId}
          editable={editable}
          esAdmin={esAdmin}
        />
      ))}

      {sinGastos.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-tinta text-base font-semibold">
            {conGastos.length > 0 ? `Sin gastos en ${mesCorto}` : 'Tus listas'}
          </h2>
          <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
            {sinGastos.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-1 pr-2 pl-4">
                <span className="text-tinta min-w-0 text-base">{l.nombre}</span>
                <Link
                  href={`/gastos/porcentajes/${l.id}`}
                  aria-label={`Editar % de ${l.nombre}`}
                  className="min-h-touch text-marca flex shrink-0 items-center px-2 text-base font-semibold"
                >
                  Editar %
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Plegado y al pie: antes era una tarjeta por mes ARRIBA de las listas. */}
      <ArrastrePlegable vista={arrastres} esAdmin={esAdmin} abierto={arrastre === 'abierto'} />

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
