import Link from 'next/link'

import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { contextoDeCasa } from '@/lib/casas/activa'
import { leerFiltros, vistaDeCompras, type Filtros } from '@/lib/compras/consultas'

import { archivarComprados } from './acciones'
import { AgregarItem } from './agregar'
import { Buscador } from './buscador'
import { FilaItem } from './fila-item'
import { RealtimeCompras } from './realtime'

type Params = { ver?: string; tienda?: string; tag?: string; q?: string }

/** Arma el href conservando el resto de los filtros. */
function enlace(filtros: Filtros, cambios: Partial<Params>): string {
  const params = new URLSearchParams()

  const ver = cambios.ver !== undefined ? cambios.ver : filtros.ver
  const tienda = cambios.tienda !== undefined ? cambios.tienda : filtros.tienda
  const tag = cambios.tag !== undefined ? cambios.tag : filtros.tag
  const q = cambios.q !== undefined ? cambios.q : filtros.q

  if (ver && ver !== 'pendientes') params.set('ver', ver)
  if (tienda) params.set('tienda', tienda)
  if (tag) params.set('tag', tag)
  if (q) params.set('q', q)

  const query = params.toString()
  return query ? `/compras?${query}` : '/compras'
}

const VISTAS = [
  { valor: 'pendientes', texto: 'Pendientes' },
  { valor: 'comprados', texto: 'Comprados' },
  { valor: 'todos', texto: 'Todos' },
] as const

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

  return (
    <Shell>
      <RealtimeCompras casaId={activa.id} />

      <div className="flex flex-col gap-5">
        <OfflineBanner />

        <header className="flex flex-col gap-1">
          <h1 className="text-tinta text-xl font-semibold">Lista de compras</h1>
          <p className="text-tinta-suave text-base">
            {vista.pendientes === 0
              ? 'No falta nada por comprar.'
              : vista.pendientes === 1
                ? 'Falta 1 cosa.'
                : `Faltan ${vista.pendientes} cosas.`}
            {' '}Acá todos los miembros pueden agregar, marcar y borrar.
          </p>
        </header>

        <AgregarItem />

        {!vista.listaVacia ? (
          <>
            <Buscador inicial={filtros.q} />

            <div
              role="group"
              aria-label="Qué mostrar"
              className="border-borde bg-superficie grid grid-cols-3 gap-1 rounded-2xl border p-1"
            >
              {VISTAS.map((v) => {
                const activo = filtros.ver === v.valor
                return (
                  <Link
                    key={v.valor}
                    href={enlace(filtros, { ver: v.valor })}
                    aria-current={activo ? 'true' : undefined}
                    scroll={false}
                    className={`min-h-touch flex items-center justify-center rounded-xl text-base font-medium ${
                      activo ? 'bg-superficie-alta text-tinta shadow-sm' : 'text-tinta-suave'
                    }`}
                  >
                    {v.texto}
                  </Link>
                )
              })}
            </div>

            {vista.tiendas.length > 1 ? (
              <nav aria-label="Filtrar por tienda" className="flex flex-wrap gap-2">
                <Link
                  href={enlace(filtros, { tienda: '' })}
                  scroll={false}
                  aria-current={!filtros.tienda ? 'true' : undefined}
                  className={`min-h-touch flex items-center rounded-full border px-4 text-base ${
                    !filtros.tienda
                      ? 'border-crc bg-crc-tenue text-crc font-semibold'
                      : 'border-borde text-tinta-suave'
                  }`}
                >
                  Toda la casa
                </Link>
                {vista.tiendas.map((t) => {
                  const activo = filtros.tienda === t.id
                  return (
                    <Link
                      key={t.id}
                      href={enlace(filtros, { tienda: activo ? '' : t.id })}
                      scroll={false}
                      aria-current={activo ? 'true' : undefined}
                      className={`min-h-touch flex items-center rounded-full border px-4 text-base ${
                        activo
                          ? 'border-crc bg-crc-tenue text-crc font-semibold'
                          : 'border-borde text-tinta-suave'
                      }`}
                    >
                      {t.nombre}
                    </Link>
                  )
                })}
              </nav>
            ) : null}

            {vista.tags.length > 0 ? (
              <nav aria-label="Filtrar por etiqueta" className="flex flex-wrap gap-2">
                {vista.tags.map((t) => {
                  const activo = filtros.tag === t.id
                  return (
                    <Link
                      key={t.id}
                      href={enlace(filtros, { tag: activo ? '' : t.id })}
                      scroll={false}
                      aria-current={activo ? 'true' : undefined}
                      className={`min-h-touch flex items-center rounded-full border px-3 text-sm ${
                        activo
                          ? 'border-crc bg-crc-tenue text-crc font-semibold'
                          : 'border-borde text-tinta-suave'
                      }`}
                    >
                      {t.nombre}
                    </Link>
                  )
                })}
              </nav>
            ) : null}
          </>
        ) : null}

        {/* Casa sin nada todavía */}
        {vista.listaVacia ? (
          <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
            <h2 className="text-tinta text-base font-semibold">La lista está vacía</h2>
            <p className="text-tinta-suave text-base">
              Anotá lo primero que falte arriba. Cualquiera de la casa lo va a ver al
              instante, sin recargar.
            </p>
          </section>
        ) : null}

        {/* Tres vacíos distintos, y mandan a lugares distintos:
            no encontré / ya está todo comprado / no han comprado nada.
            Decirle «quitá un filtro» a quien no puso ninguno es peor
            que no decir nada. */}
        {!vista.listaVacia && vista.mostrados === 0 ? (
          <section className="border-borde-suave flex flex-col gap-3 rounded-2xl border border-dashed p-5">
            <h2 className="text-tinta text-base font-semibold">
              {hayFiltro
                ? filtros.q
                  ? `Nada que coincida con «${filtros.q}»`
                  : 'Nada con esos filtros'
                : filtros.ver === 'comprados'
                  ? 'Nada comprado todavía'
                  : 'Ya está todo comprado'}
            </h2>
            <p className="text-tinta-suave text-base">
              {hayFiltro
                ? 'Probá quitando algún filtro.'
                : filtros.ver === 'comprados'
                  ? 'Cuando marquen algo, va a aparecer acá.'
                  : 'Lo que compraron quedó en «Comprados». Archivalo para sacarlo de la lista.'}
            </p>
            {hayFiltro ? (
              <Link
                href={enlace(filtros, { tienda: '', tag: '', q: '' })}
                className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                           justify-center rounded-2xl border px-4 text-base font-semibold"
              >
                Quitar los filtros
              </Link>
            ) : null}
          </section>
        ) : null}

        {vista.grupos.map((grupo) => (
          <section key={grupo.tienda.id} className="flex flex-col gap-2">
            <h2 className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
              {grupo.tienda.nombre}
            </h2>
            <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
              {grupo.items.map((item) => (
                <FilaItem key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}

        {vista.comprados > 0 ? (
          <form action={archivarComprados}>
            <button
              type="submit"
              className="min-h-touch border-borde bg-superficie-alta text-tinta-suave flex w-full
                         items-center justify-center rounded-2xl border px-4 text-base"
            >
              Archivar {vista.comprados} {vista.comprados === 1 ? 'comprado' : 'comprados'}
            </button>
          </form>
        ) : null}

        <div className="border-borde flex flex-col border-t pt-2">
          <Link
            href="/compras/etiquetas"
            className="min-h-touch text-crc flex items-center text-base font-semibold"
          >
            Etiquetas
          </Link>
          {/* Las tiendas las maneja el admin: así lo decide RLS, no la UI. */}
          {esAdmin ? (
            <Link
              href="/compras/tiendas"
              className="min-h-touch text-crc flex items-center text-base font-semibold"
            >
              Tiendas
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
