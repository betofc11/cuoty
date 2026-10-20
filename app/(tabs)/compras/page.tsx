import Link from 'next/link'

import { AccionDePie } from '@/components/shell/accion-de-pie'
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
import { partirPorTienda, type GrupoTienda } from '@/lib/compras/grupos'
import { tonoDeEtiqueta } from '@/lib/compras/tonos'
import { fechaCorta } from '@/lib/fechas'

import { archivarComprados } from '@/app/compras/acciones'
import { AgregarItem } from '@/app/compras/agregar'
import { Buscador } from '@/app/compras/buscador'
import { Carrusel } from '@/app/compras/carrusel'
import { CHIP, CHIP_APAGADO, CHIP_ELEGIDO } from '@/app/compras/chips'
import { FilaComprada, FilaItem } from '@/app/compras/fila-item'
import { FiltroEtiquetas } from '@/app/compras/filtro-etiquetas'
import { RealtimeCompras } from '@/app/compras/realtime'

type Params = { tienda?: string; tag?: string; q?: string }

type Cambios = Partial<Filtros>

/** Arma el href conservando el resto de los filtros. */
function enlace(filtros: Filtros, cambios: Cambios): string {
  const params = new URLSearchParams()

  const tienda = cambios.tienda !== undefined ? cambios.tienda : filtros.tienda
  const tag = cambios.tag !== undefined ? cambios.tag : filtros.tag
  const q = cambios.q !== undefined ? cambios.q : filtros.q

  if (tienda) params.set('tienda', tienda)
  if (tag) params.set('tag', tag)
  if (q) params.set('q', q)

  const query = params.toString()
  return query ? `/compras?${query}` : '/compras'
}

/**
 * Un tramo de la lista con su título: el de cada tienda y el de lo comprado
 * hoy. El número se lee en la pantalla; el lector de pantalla oye la frase.
 */
function Grupo({
  id,
  titulo,
  cuenta,
  cuentaLarga,
  children,
}: {
  id: string
  titulo: string
  cuenta: number
  cuentaLarga: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2
        id={id}
        className="text-tinta flex items-baseline justify-between gap-3 px-1 text-base font-semibold"
      >
        {titulo}
        <span aria-hidden="true" className="text-tinta-suave text-sm font-normal">
          {cuenta}
        </span>
        <span className="sr-only">, {cuentaLarga}</span>
      </h2>
      {/* `overflow-hidden` para que el fondo al presionar una fila respete
          las esquinas de la tarjeta. */}
      <ul className="border-borde bg-superficie-alta divide-borde-suave divide-y overflow-hidden rounded-2xl border">
        {children}
      </ul>
    </section>
  )
}

/** El grupo de una tienda. La predeterminada se nombra por lo que significa. */
function GrupoDeTienda({ grupo }: { grupo: GrupoTienda }) {
  return (
    <Grupo
      id={`grupo-${grupo.tienda.id}`}
      titulo={grupo.tienda.esPredeterminada ? 'En cualquier tienda' : grupo.tienda.nombre}
      cuenta={grupo.items.length}
      cuentaLarga={pendientes(grupo.items.length)}
    >
      {grupo.items.map((item) => (
        <FilaItem key={item.id} item={item} />
      ))}
    </Grupo>
  )
}

/** «1 pendiente», «3 pendientes». */
function pendientes(n: number): string {
  return `${n} ${n === 1 ? 'pendiente' : 'pendientes'}`
}

const BOTON_SECUNDARIO =
  'min-h-touch border-borde bg-superficie-alta text-tinta flex flex-1 items-center ' +
  'justify-center rounded-2xl border px-4 text-base font-semibold'

/**
 * Un chip de la fila de tiendas. El número es lo pendiente de esa tienda; el
 * elegido cambia el número por la ×, porque tocarlo de nuevo lo quita.
 */
function ChipTienda({
  nombre,
  cuenta,
  activo,
  quitable,
  href,
}: {
  nombre: string
  cuenta: number
  activo: boolean
  /** «Todo» no se quita: es lo que queda al quitar las demás. */
  quitable: boolean
  href: string
}) {
  const conX = activo && quitable

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? 'true' : undefined}
      className={`${CHIP} ${activo ? CHIP_ELEGIDO : CHIP_APAGADO}`}
    >
      {nombre}
      <span aria-hidden="true" className={activo ? (conX ? 'text-base' : '') : 'text-tinta-suave font-medium'}>
        {conX ? '×' : cuenta}
      </span>
      <span className="sr-only">{conX ? ', quitar el filtro' : `, ${pendientes(cuenta)}`}</span>
    </Link>
  )
}

/**
 * La etiqueta puesta, en su tono y con su ×. Ocupa el lugar del botón
 * «Etiquetas»: para cambiar de etiqueta se quita y se elige otra.
 */
function ChipEtiquetaPuesta({ tag, href }: { tag: TagVista; href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`${CHIP} border-transparent`}
      // El relleno es el tono de la etiqueta. El texto va del color de la
      // superficie: en claro el tono es oscuro y en oscuro es claro, así que
      // invertirlo sirve en los dos temas sin una segunda paleta.
      style={{ backgroundColor: tonoDeEtiqueta(tag.tono), color: 'var(--superficie-alta)' }}
    >
      {tag.nombre}
      <span aria-hidden="true" className="text-base">
        ×
      </span>
      <span className="sr-only">, quitar el filtro</span>
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
  const elegida: TiendaConteo | null = vista.tiendaElegida
  const tagPuesta = vista.tags.find((t) => t.id === filtros.tag) ?? null
  const hayFiltro = Boolean(elegida || tagPuesta || filtros.q)

  // «Estoy en Walmart»: lo de Walmart y lo de cualquier tienda a la vista, lo
  // de las demás tiendas plegado. Ver `lib/compras/grupos.ts`.
  const { aLaVista, otras } = partirPorTienda(vista.items, elegida?.id ?? null)
  const visibles = aLaVista.reduce((n, g) => n + g.items.length, 0)
  const enOtras = otras.reduce((n, g) => n + g.items.length, 0)

  // La fila de filtros sale si hay algo que elegir, o algo puesto que quitar.
  const hayTiendas = vista.tiendas.length > 0
  const hayFiltros = hayTiendas || vista.tags.length > 0

  return (
    <>
      <RealtimeCompras casaId={activa.id} />
      {/* El alta va sobre las tabs, al alcance del pulgar: es lo que más se
          repite y se hace con una mano en el súper. */}
      <AccionDePie>
        <AgregarItem />
      </AccionDePie>

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

            {/* Las tiendas a la vista, en un toque: es lo que se elige al
                entrar al súper. Antes vivían detrás de un embudo, en un
                panel, a dos toques y dos navegaciones. Las etiquetas quedan
                a la derecha, fijas, porque se usan mucho menos. */}
            {hayFiltros ? (
              <div className="flex items-center gap-2">
                {hayTiendas ? (
                  <Carrusel etiqueta="Filtrar por tienda" className="min-w-0 flex-1">
                    <ChipTienda
                      nombre="Todo"
                      cuenta={vista.items.length}
                      activo={!elegida}
                      quitable={false}
                      href={enlace(filtros, { tienda: '' })}
                    />
                    {vista.tiendas.map((t) => (
                      <ChipTienda
                        key={t.id}
                        nombre={t.nombre}
                        cuenta={t.pendientes}
                        activo={t.id === elegida?.id}
                        quitable
                        href={enlace(filtros, { tienda: t.id === elegida?.id ? '' : t.id })}
                      />
                    ))}
                  </Carrusel>
                ) : null}

                <div className="ml-auto flex shrink-0">
                  {tagPuesta ? (
                    <ChipEtiquetaPuesta tag={tagPuesta} href={enlace(filtros, { tag: '' })} />
                  ) : vista.tags.length > 0 ? (
                    <FiltroEtiquetas
                      opciones={vista.tags.map((t) => ({
                        id: t.id,
                        nombre: t.nombre,
                        pendientes: t.pendientes,
                        href: enlace(filtros, { tag: t.id }),
                      }))}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {hayFiltro && visibles < vista.totalPendientes ? (
              <p className="text-tinta-suave text-sm">
                {visibles} de {pendientes(vista.totalPendientes)}
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

        {/* Tres vacíos distintos, y mandan a lugares distintos: ya está todo
            comprado / la búsqueda o la etiqueta no encontraron nada / en esta
            tienda no queda nada, pero en otras sí. Decirle «quitá un filtro»
            a quien no le sirve quitarlo es peor que no decir nada. Hablan de
            lo pendiente: lo comprado que pase el filtro sale igual abajo. */}
        {!vista.listaVacia && visibles === 0 ? (
          vista.totalPendientes === 0 ? (
            <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
              <h2 className="text-tinta text-base font-semibold">Ya está todo comprado</h2>
              {vista.compradosHoy.length > 0 ? (
                <p className="text-tinta-suave text-base">
                  Lo de hoy quedó abajo, por si hay que desmarcar algo.
                </p>
              ) : vista.compradosAntes.length > 0 ? (
                <p className="text-tinta-suave text-base">
                  Lo que compraron quedó abajo, en «Ver artículos comprados».
                </p>
              ) : null}
            </section>
          ) : elegida && vista.items.length > 0 ? (
            <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
              <h2 className="text-tinta text-base font-semibold">
                Nada pendiente en {elegida.nombre}
              </h2>
              <p className="text-tinta-suave text-base">
                Lo que falta es de otras tiendas: está abajo, en «En otras tiendas».
              </p>
            </section>
          ) : (
            <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
              <h2 className="text-tinta text-base font-semibold">
                {filtros.q
                  ? `Nada pendiente que coincida con «${filtros.q}»`
                  : 'Nada pendiente con esos filtros'}
              </h2>
              <p className="text-tinta-suave text-base">Probá quitando algún filtro.</p>
              <Link
                href={enlace(filtros, { tienda: '', tag: '', q: '' })}
                className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                           justify-center rounded-2xl border px-4 text-base font-semibold"
              >
                Quitar los filtros
              </Link>
            </section>
          )
        ) : null}

        {/* Un grupo por tienda, con «Cualquiera» al final: la tienda se dice
            una vez y no en cada fila. */}
        {aLaVista.map((g) => (
          <GrupoDeTienda key={g.tienda.id} grupo={g} />
        ))}

        {/* Con una tienda elegida, lo de las demás no se esconde: queda
            plegado, por si lo que falta en otra también lo hay acá. */}
        {otras.length > 0 ? (
          <details className="group">
            <summary
              className="min-h-touch border-borde bg-superficie-alta text-tinta flex cursor-pointer items-center
                         justify-between gap-3 rounded-2xl border px-4 text-base font-semibold"
            >
              En otras tiendas
              <span className="text-tinta-suave flex items-center gap-3 font-normal">
                <span aria-hidden="true" className="text-sm">
                  {enOtras}
                </span>
                <span className="sr-only">, {pendientes(enOtras)}</span>
                <span aria-hidden="true" className="transition group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <div className="flex flex-col gap-4 pt-4">
              {otras.map((g) => (
                <GrupoDeTienda key={g.tienda.id} grupo={g} />
              ))}
            </div>
          </details>
        ) : null}

        {/* Lo marcado hoy no se va de la pantalla: si al tocar la casilla el
            item desapareciera, deshacer un toque errado obligaría a abrir el
            acordeón. Lo último que se marcó va primero. */}
        {vista.compradosHoy.length > 0 ? (
          <Grupo
            id="grupo-comprado-hoy"
            titulo="Comprado hoy"
            cuenta={vista.compradosHoy.length}
            cuentaLarga={`${vista.compradosHoy.length} ${
              vista.compradosHoy.length === 1 ? 'item' : 'items'
            }`}
          >
            {vista.compradosHoy.map((item) => (
              <FilaComprada
                key={item.id}
                item={item}
                marca={item.compradoPor ? { previo: ', lo marcó ', texto: item.compradoPor } : null}
              />
            ))}
          </Grupo>
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
            {/* El recorte va en la lista y no en el `<details>`: ahí cortaba
                el anillo de foco del `<summary>`. Sin recorte, la última fila
                presionada pintaba esquinas cuadradas sobre la tarjeta. */}
            <ul className="border-borde-suave divide-borde-suave divide-y overflow-hidden rounded-b-2xl border-t">
              {vista.compradosAntes.map((item) => (
                <FilaComprada
                  key={item.id}
                  item={item}
                  editable
                  // La fecha relativa sale del servidor: calculada en el
                  // cliente, una página guardada de otro día no hidrataba.
                  marca={
                    item.compradoEl
                      ? { previo: ', comprado ', texto: fechaCorta(item.compradoEl) }
                      : null
                  }
                />
              ))}
            </ul>
          </details>
        ) : null}

        {/* Archiva TODO lo comprado de la casa, no solo lo que se está
            viendo: por eso el número es el total y no el de la vista. */}
        {vista.totalComprados > 0 ? (
          <form action={archivarComprados}>
            <Button type="submit" variante="secundario">
              Quitar los comprados ({vista.totalComprados})
            </Button>
          </form>
        ) : null}

        {/* «Editar» y no solo «Etiquetas»: arriba, el botón «Etiquetas» filtra,
            y dos controles con el mismo nombre que hacen cosas distintas no
            se distinguen. */}
        <div className="border-borde flex gap-2 border-t pt-4">
          <Link href="/compras/etiquetas" className={BOTON_SECUNDARIO}>
            Editar etiquetas
          </Link>
          {/* Las tiendas las maneja el admin: así lo decide RLS, no la UI. */}
          {esAdmin ? (
            <Link href="/compras/tiendas" className={BOTON_SECUNDARIO}>
              Editar tiendas
            </Link>
          ) : null}
        </div>
      </div>
    </>
  )
}
