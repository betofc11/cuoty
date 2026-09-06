import Link from 'next/link'

import { Shell } from '@/components/shell/shell'
import { Button } from '@/components/ui/button'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import {
  leerFiltros,
  vistaDeCompras,
  type Filtros,
  type TagVista,
  type TiendaConteo,
} from '@/lib/compras/consultas'
import { tonoDeEtiqueta } from '@/lib/compras/tonos'

import { archivarComprados } from './acciones'
import { AgregarItem } from './agregar'
import { Buscador } from './buscador'
import { Carrusel } from './carrusel'
import { FilaComprada, FilaItem } from './fila-item'
import { RealtimeCompras } from './realtime'

type Params = { tienda?: string; tag?: string; q?: string; filtros?: string }

type Cambios = Partial<{ tienda: string; tag: string; q: string; abierto: boolean }>

/** Arma el href conservando el resto de los filtros. */
function enlace(filtros: Filtros, abierto: boolean, cambios: Cambios): string {
  const params = new URLSearchParams()

  const tienda = cambios.tienda !== undefined ? cambios.tienda : filtros.tienda
  const tag = cambios.tag !== undefined ? cambios.tag : filtros.tag
  const q = cambios.q !== undefined ? cambios.q : filtros.q
  const panel = cambios.abierto !== undefined ? cambios.abierto : abierto

  if (tienda) params.set('tienda', tienda)
  if (tag) params.set('tag', tag)
  if (q) params.set('q', q)
  if (panel) params.set('filtros', '1')

  const query = params.toString()
  return query ? `/compras?${query}` : '/compras'
}

/*
  El chip mide 36 de alto pero se toca en 48: el ::after estira el área
  sensible sin estirar el fondo. Bajarle el alto a secas rompía el mínimo
  táctil, y con muchas etiquetas la fila de filtros ocupaba más pantalla
  que la lista que filtra.
*/
const CHIP_BASE =
  "relative flex h-9 shrink-0 items-center rounded-full border text-sm font-semibold after:absolute after:content-['']"
/** Con texto ya sobra ancho: solo hay que estirar el alto de 36 a 48. */
const AREA_ANCHA = 'after:inset-x-0 after:-inset-y-1.5'
/** Solo ícono: mide 36×36, así que hay que estirar por los cuatro lados. */
const AREA_CUADRADA = 'after:-inset-1.5'

const CHIP = `${CHIP_BASE} ${AREA_ANCHA} gap-2 px-3.5`
const CHIP_APAGADO = 'border-borde bg-superficie-alta text-tinta'

const ICONO = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-4 shrink-0',
} as const

/** Abre los filtros. Va solo con la fila colapsada, con su palabra al expandirse. */
function Embudo() {
  return (
    <svg {...ICONO}>
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
    </svg>
  )
}

/**
 * Limpia los filtros. Escoba y no basurero: el basurero en una lista de
 * compras se lee como «borrar los items».
 *
 * Va en diagonal, con virola y cerdas en abanico de borde curvo — el borde
 * recto la convertía en brocha. Los destellos de la referencia no están: a
 * 16px, con trazo de 1.8 y las puntas redondeadas, la estrella de cuatro
 * puntas sale como una cruz gorda y le come el aire al abanico.
 */
function Escoba() {
  return (
    <svg {...ICONO}>
      {/* Palo */}
      <path d="M3.5 3.5 8 8" />
      {/* Virola: la banda que une el palo con las cerdas */}
      <path d="M7 10 9 12 12 9 10 7Z" />
      {/* Cerdas: el borde de abajo es un arco, que es lo que da el barrido */}
      <path d="M9 12 11 20A10 10 0 0 0 20 11L12 9Z" />
      {/* Dos arcos concéntricos adentro: con uno solo el abanico se lee como
          una hoja, con tres se empasta */}
      <path d="M10.2 16.5A6.5 6.5 0 0 0 16.5 10.2" />
      <path d="M10.5 13.9A3.7 3.7 0 0 0 13.9 10.5" />
    </svg>
  )
}

const ROTULO = 'text-tinta-suave text-xs font-semibold tracking-wide uppercase'

const BOTON_SECUNDARIO =
  'min-h-touch border-borde bg-superficie-alta text-tinta flex flex-1 items-center ' +
  'justify-center rounded-2xl border px-4 text-base font-semibold'

function ChipTienda({
  tienda,
  activo,
  href,
}: {
  tienda: TiendaConteo
  activo: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? 'true' : undefined}
      aria-label={
        activo
          ? `Quitar el filtro ${tienda.nombre}`
          : `Ver solo lo de ${tienda.nombre} · ${tienda.pendientes} ${
              tienda.pendientes === 1 ? 'pendiente' : 'pendientes'
            }`
      }
      className={`${CHIP} ${activo ? 'border-crc bg-crc text-white' : CHIP_APAGADO}`}
    >
      {tienda.nombre}
      <span
        aria-hidden="true"
        className={activo ? 'text-base' : 'text-tinta-suave font-medium'}
      >
        {activo ? '×' : tienda.pendientes}
      </span>
    </Link>
  )
}

function ChipEtiqueta({
  tag,
  activo,
  href,
}: {
  tag: TagVista
  activo: boolean
  href: string
}) {
  const tono = tonoDeEtiqueta(tag.tono)

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? 'true' : undefined}
      aria-label={activo ? `Quitar el filtro ${tag.nombre}` : undefined}
      className={`${CHIP} ${activo ? 'border-transparent' : CHIP_APAGADO}`}
      // El relleno es el tono de la etiqueta, el mismo que lleva su badge en
      // la fila. El texto va del color de la superficie: en claro el tono es
      // oscuro y en oscuro es claro, así que invertirlo sirve en los dos
      // temas sin una segunda paleta.
      style={activo ? { backgroundColor: tono, color: 'var(--superficie-alta)' } : undefined}
    >
      {tag.nombre}
      {activo ? (
        <span aria-hidden="true" className="text-base">
          ×
        </span>
      ) : null}
    </Link>
  )
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  const params = await searchParams
  const filtros = leerFiltros(params)
  const { activa } = await contextoDeCasa()
  const vista = await vistaDeCompras(filtros)

  const esAdmin = activa.rol === 'admin'
  const hayFiltro = Boolean(filtros.tienda || filtros.tag || filtros.q)

  // El panel vive en la URL y no en un `<details>`: cada chip es un enlace,
  // así que sin esto el panel se cerraría al poner el primer filtro y
  // habría que reabrirlo para poner el segundo.
  const abierto = params.filtros === '1'
  const hayQueFiltrar = vista.tiendas.length > 0 || vista.tags.length > 0

  const tiendaActiva = vista.tiendas.find((t) => t.id === filtros.tienda)
  const tagActiva = vista.tags.find((t) => t.id === filtros.tag)

  // Lo de hoy va arriba, con lo pendiente: es la lista de este mandado.
  const enLista = [...vista.items, ...vista.compradosHoy]

  return (
    <Shell pie={<AgregarItem />}>
      <RealtimeCompras casaId={activa.id} />

      <div className="flex flex-col gap-4">
        <OfflineBanner />

        <header className="flex flex-col gap-1">
          <h1 className="text-tinta text-xl font-semibold">Lista de compras</h1>
          <p className="text-tinta-suave text-base">
            {vista.totalPendientes === 0
              ? 'No falta nada por comprar.'
              : vista.totalPendientes === 1
                ? 'Falta 1 cosa.'
                : `Faltan ${vista.totalPendientes} cosas.`}
          </p>
        </header>

        {!vista.listaVacia ? (
          <div className="flex flex-col gap-3">
            <Buscador inicial={filtros.q} />

            {/* El embudo y «Limpiar» quedan anclados a los extremos y solo
                scrollean los chips del medio: con «Limpiar» dentro del
                carrusel había que llegar hasta el final para poder limpiar,
                que es justo lo que uno quiere hacer cuando hay muchos. */}
            {hayQueFiltrar || hayFiltro ? (
              <div className="flex items-center gap-2">
                {hayQueFiltrar ? (
                  <Link
                    href={enlace(filtros, abierto, { abierto: !abierto })}
                    scroll={false}
                    aria-expanded={abierto}
                    aria-controls="panel-filtros"
                    aria-label={abierto ? 'Cerrar los filtros' : 'Abrir los filtros'}
                    className={`border-crc bg-superficie-alta text-crc ${
                      abierto ? CHIP : `${CHIP_BASE} ${AREA_CUADRADA} w-9 justify-center`
                    }`}
                  >
                    <Embudo />
                    {abierto ? 'Filtros' : null}
                  </Link>
                ) : null}

                {/* Con el panel cerrado, lo puesto se ve acá: un filtro que no
                    se ve es un filtro que nadie va a poder quitar. Con el panel
                    abierto sobra — son los mismos chips que ya están adentro,
                    y ahí además vienen con su rótulo. */}
                {hayFiltro && !abierto ? (
                  <Carrusel etiqueta="Filtros puestos" className="flex-1">
                    {tiendaActiva ? (
                      <ChipTienda
                        tienda={tiendaActiva}
                        activo
                        href={enlace(filtros, abierto, { tienda: '' })}
                      />
                    ) : null}
                    {tagActiva ? (
                      <ChipEtiqueta
                        tag={tagActiva}
                        activo
                        href={enlace(filtros, abierto, { tag: '' })}
                      />
                    ) : null}
                  </Carrusel>
                ) : null}

                {/* Neutro y no en --peligro: limpiar un filtro no rompe nada, y
                    el rojo de peligro y el terracota de la marca son casi el
                    mismo color en esta paleta — pegados volverían a leerse como
                    el mismo control. El `ml-auto` lo mantiene contra el borde
                    derecho también cuando no hay carrusel que empuje. */}
                {hayFiltro ? (
                  <Link
                    href={enlace(filtros, abierto, { tienda: '', tag: '', q: '' })}
                    scroll={false}
                    aria-label={abierto ? undefined : 'Quitar todos los filtros'}
                    className={`ml-auto border-borde bg-superficie-alta text-tinta-suave ${
                      abierto ? CHIP : `${CHIP_BASE} ${AREA_CUADRADA} w-9 justify-center`
                    }`}
                  >
                    <Escoba />
                    {abierto ? 'Limpiar' : null}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {abierto && hayQueFiltrar ? (
              <div
                id="panel-filtros"
                className="flex flex-col gap-3 rounded-2xl px-4 py-3"
                /*
                  El tinte se mezcla contra la superficie en vez de usar
                  `--crc-tenue`: ese token en claro (#f6e7de) queda a tres
                  puntos del fondo de la página (#efe9e1) y el panel parecía
                  flotar, sin pertenecer a «Filtros». Mezclando el terracota
                  al 12% el tinte se nota igual en los dos temas, porque sigue
                  a la superficie de cada uno.
                */
                style={{
                  backgroundColor: 'color-mix(in oklab, var(--crc) 12%, var(--superficie))',
                }}
              >
                {vista.tiendas.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <p className={ROTULO}>Tiendas</p>
                    <Carrusel etiqueta="Filtrar por tienda" sangra>
                      {vista.tiendas.map((t) => (
                        <ChipTienda
                          key={t.id}
                          tienda={t}
                          activo={filtros.tienda === t.id}
                          href={enlace(filtros, abierto, {
                            tienda: filtros.tienda === t.id ? '' : t.id,
                          })}
                        />
                      ))}
                    </Carrusel>
                  </div>
                ) : null}

                {vista.tags.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <p className={ROTULO}>Etiquetas</p>
                    <Carrusel etiqueta="Filtrar por etiqueta" sangra>
                      {vista.tags.map((t) => (
                        <ChipEtiqueta
                          key={t.id}
                          tag={t}
                          activo={filtros.tag === t.id}
                          href={enlace(filtros, abierto, {
                            tag: filtros.tag === t.id ? '' : t.id,
                          })}
                        />
                      ))}
                    </Carrusel>
                  </div>
                ) : null}
              </div>
            ) : null}

            {hayFiltro ? (
              <p className="text-tinta-suave text-sm">
                {enLista.length} de {vista.totalPendientes}{' '}
                {vista.totalPendientes === 1 ? 'item' : 'items'}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Casa sin nada todavía */}
        {vista.listaVacia ? (
          <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
            <h2 className="text-tinta text-base font-semibold">La lista está vacía</h2>
            <p className="text-tinta-suave text-base">
              Anotá lo primero que falte en la barra de abajo. Cualquiera de la casa lo va
              a ver al instante, sin recargar.
            </p>
          </section>
        ) : null}

        {/* Dos vacíos distintos, y mandan a lugares distintos: no encontré
            nada / ya está todo comprado. Decirle «quitá un filtro» a quien
            no puso ninguno es peor que no decir nada. */}
        {!vista.listaVacia && enLista.length === 0 ? (
          <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
            <h2 className="text-tinta text-base font-semibold">
              {hayFiltro
                ? filtros.q
                  ? `Nada que coincida con «${filtros.q}»`
                  : 'Nada con esos filtros'
                : 'Ya está todo comprado'}
            </h2>
            <p className="text-tinta-suave text-base">
              {hayFiltro
                ? 'Probá quitando algún filtro.'
                : 'Lo que compraron quedó abajo, en «Ver artículos comprados».'}
            </p>
            {hayFiltro ? (
              <Link
                href={enlace(filtros, abierto, { tienda: '', tag: '', q: '' })}
                className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                           justify-center rounded-2xl border px-4 text-base font-semibold"
              >
                Quitar los filtros
              </Link>
            ) : null}
          </section>
        ) : null}

        {/* Lista plana: la tienda va como badge en cada fila, no como
            encabezado de grupo. Con una casa que compra en tres lugares,
            agrupar partía la lista en tres listas de dos líneas. */}
        {enLista.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {enLista.map((item) => (
              <FilaItem key={item.id} item={item} />
            ))}
          </ul>
        ) : null}

        {vista.compradosAntes.length > 0 ? (
          <details className="border-borde bg-superficie-alta group rounded-2xl border">
            <summary className="min-h-touch text-tinta flex cursor-pointer items-center justify-between px-4 text-base font-semibold">
              Ver artículos comprados ({vista.compradosAntes.length})
              <span
                aria-hidden="true"
                className="text-tinta-suave transition group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <ul className="border-borde-suave divide-borde-suave divide-y border-t">
              {vista.compradosAntes.map((item) => (
                <FilaComprada key={item.id} item={item} />
              ))}
            </ul>
          </details>
        ) : null}

        {/* Archiva TODO lo comprado de la casa, no solo lo que se está
            viendo: por eso el número es el total y no el de la vista. */}
        {vista.totalComprados > 0 ? (
          <form action={archivarComprados}>
            <Button type="submit" variante="secundario">
              Limpiar comprados ({vista.totalComprados})
            </Button>
          </form>
        ) : null}

        <div className="border-borde flex gap-2 border-t pt-4">
          <Link href="/compras/etiquetas" className={BOTON_SECUNDARIO}>
            Etiquetas
          </Link>
          {/* Las tiendas las maneja el admin: así lo decide RLS, no la UI. */}
          {esAdmin ? (
            <Link href="/compras/tiendas" className={BOTON_SECUNDARIO}>
              Tiendas
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
