'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/alert'
import type { TiendaVista } from '@/lib/compras/consultas'
import { contiene } from '@/lib/compras/texto'

import { agregarItem, moverDeTienda } from './acciones'
import { Carrusel } from './carrusel'
import { CHIP, CHIP_APAGADO } from './chips'
import { avisoDeFallo, type Aviso } from './fallo'

/**
 * Lo que se acaba de anotar y dónde quedó, para mandarlo a otra tienda de un
 * toque. `tienda: null` es «en cualquier tienda».
 */
type Recien = { id: string; nombre: string; tienda: TiendaVista | null }

/**
 * A dónde ofrece mandarlo la tira. Desde «Cualquiera», a cualquier tienda.
 * Desde la tienda de la última vez, a cualquier otra, y también de vuelta a
 * «Cualquiera» (`null`).
 */
function destinos(tiendas: TiendaVista[], actual: TiendaVista | null): (TiendaVista | null)[] {
  return actual ? [null, ...tiendas.filter((t) => t.id !== actual.id)] : tiendas
}

/**
 * Alta rápida: un campo y listo, sin etiquetas. Cae en la tienda elegida si
 * estás en el súper («Agregar a Walmart»). Si no, la elige
 * `add_shopping_item`: la de la última vez que la casa anotó ese producto, o
 * «Cualquiera» si es nuevo. Pedir todo de entrada convierte "anotá el pan" en
 * un formulario, y entonces nadie anota nada.
 *
 * Lo que sí se ofrece es la tienda, después y de un toque: la tira aparece con
 * lo recién anotado, dice dónde quedó, y se va sola al escribir lo siguiente.
 * En la casa real, 82 % de los items terminaban movidos a mano a una tienda,
 * por el detalle y en cinco pasos.
 *
 * Va anclada al pie, sobre la barra de tabs: es la acción que más se
 * repite y la única que se hace con una mano en el super. Arriba
 * empujaba la lista hacia abajo y quedaba fuera de alcance del pulgar.
 *
 * El envío va con `onSubmit` y estado propio, no con `useActionState`: esa
 * corre la acción en una transición async, y mientras dura, React no aplica
 * ninguna otra, tampoco la navegación de las tabs que están justo abajo. Ver
 * `useMarcar` en `fila-item.tsx`. De paso, un fallo de red ya no tumba la
 * pantalla al `error.tsx`: se muestra acá.
 */
export function AgregarItem({
  tiendas,
  tiendaElegida,
  pendientes,
}: {
  /** Las tiendas de la casa. «Cualquiera» no es una: la tira la agrega sola. */
  tiendas: TiendaVista[]
  /** Con una tienda elegida en los filtros, lo nuevo cae ahí directo. */
  tiendaElegida: { id: string; nombre: string } | null
  /** Los nombres de lo pendiente, para avisar «Ya está en la lista». */
  pendientes: string[]
}) {
  const [texto, setTexto] = useState('')
  const [pendiente, setPendiente] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [recien, setRecien] = useState<Recien | null>(null)
  const [moviendo, setMoviendo] = useState(false)
  const [listo, setListo] = useState<string | null>(null)

  // «leche» encuentra «Leche Dos Pinos 2L». Con menos de tres letras casi todo
  // coincide con algo, y el aviso sería ruido.
  const buscado = texto.trim()
  const parecidos =
    buscado.length >= 3 ? pendientes.filter((n) => contiene(n, buscado)).slice(0, 2) : []

  function escribir(valor: string) {
    setTexto(valor)
    // Escribir lo siguiente es seguir de largo: la tira de la tienda y la
    // confirmación ya no hacen falta.
    setRecien(null)
    setListo(null)
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (pendiente) return

    const formData = new FormData(evento.currentTarget)
    const nombre = String(formData.get('producto') ?? '').trim()
    setPendiente(true)
    setAviso(null)
    setRecien(null)
    setListo(null)
    try {
      const resultado = await agregarItem({}, formData)
      if (resultado.error) {
        setAviso({ texto: resultado.error })
      } else {
        setTexto('')
        // Con una tienda elegida no hace falta: cayó donde estás. `undefined`
        // es que no se sabe dónde quedó (una tienda nueva que esta pantalla
        // todavía no tiene): sin tira, mejor que una tira que miente.
        const tienda =
          resultado.tiendaId === null
            ? null
            : tiendas.find((t) => t.id === resultado.tiendaId)
        if (
          !tiendaElegida &&
          resultado.itemId &&
          tienda !== undefined &&
          destinos(tiendas, tienda).length > 0
        ) {
          setRecien({ id: resultado.itemId, nombre, tienda })
        }
      }
    } catch (e) {
      setAviso(avisoDeFallo(e, 'agregar'))
    } finally {
      setPendiente(false)
    }
  }

  async function mandarA(tienda: TiendaVista | null) {
    if (!recien || moviendo) return
    setMoviendo(true)
    setAviso(null)
    try {
      const resultado = await moverDeTienda(recien.id, tienda?.id ?? null)
      if (resultado.error) {
        setAviso({ texto: resultado.error })
      } else {
        setListo(`${recien.nombre} pasó a ${tienda?.nombre ?? 'cualquier tienda'}.`)
        setRecien(null)
      }
    } catch (e) {
      setAviso(avisoDeFallo(e, 'mover'))
    } finally {
      setMoviendo(false)
    }
  }

  return (
    // Sin fondo ni borde propios: los pone `AccionDePie`, a todo el ancho.
    <div className="flex flex-col gap-2 px-4 py-3">
      {aviso ? (
        // «Recargar» va al lado y no adentro: sobre el tinte rojo de la alerta,
        // el terracota no tiene par verificado en `npm run contraste`.
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Alert tono="error">{aviso.texto}</Alert>
          </div>
          {aviso.recargar ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-touch text-marca shrink-0 text-base font-semibold"
            >
              Recargar
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Avisa, no frena: «Leche» y «Leche deslactosada» pueden ir los dos. */}
      <p aria-live="polite" className="text-tinta-suave text-sm empty:hidden">
        {parecidos.length > 0 ? `Ya está en la lista: ${parecidos.join(', ')}` : null}
      </p>

      {recien ? (
        <div className="flex flex-col gap-1">
          {/* Dice dónde quedó: si la memoria lo mandó a Walmart sin avisar, el
              item aparece en un grupo que quizá ni está en pantalla. */}
          <p className="text-tinta-suave text-sm">
            <span className="text-tinta font-semibold">{recien.nombre}</span>{' '}
            {recien.tienda
              ? `quedó en ${recien.tienda.nombre}, como la última vez. ¿Va en otra?`
              : 'quedó en cualquier tienda. ¿Dónde se compra?'}
          </p>
          <Carrusel etiqueta={`Dónde se compra ${recien.nombre}`} sangra>
            {destinos(tiendas, recien.tienda).map((t) => (
              <button
                key={t?.id ?? 'cualquiera'}
                type="button"
                onClick={() => mandarA(t)}
                disabled={moviendo}
                className={`${CHIP} ${CHIP_APAGADO} disabled:opacity-60`}
              >
                {t?.nombre ?? 'Cualquiera'}
              </button>
            ))}
          </Carrusel>
        </div>
      ) : null}

      {listo ? (
        <p role="status" className="text-ok text-sm">
          {listo}
        </p>
      ) : null}

      <form onSubmit={enviar} className="flex gap-2">
        <label htmlFor="producto" className="sr-only">
          Qué hay que comprar
        </label>
        {tiendaElegida ? <input type="hidden" name="tiendaId" value={tiendaElegida.id} /> : null}
        {/*
          El campo se llama `producto` y no `nombre` a propósito. Safari ignora
          el `autoComplete="off"` y clasifica el campo por heurística sobre el
          `name` y el `id`: con `nombre` lo tomaba por el titular de una tarjeta
          y ofrecía rellenarlo con los datos de pago del iPhone. No lo renombres
          de vuelta — el atributo de abajo solo lo respetan Chrome y Firefox.
        */}
        <input
          id="producto"
          name="producto"
          type="text"
          value={texto}
          onChange={(e) => escribir(e.target.value)}
          placeholder={tiendaElegida ? `Agregar a ${tiendaElegida.nombre}…` : 'Agregar item…'}
          autoComplete="off"
          maxLength={80}
          className="min-h-touch border-borde-control bg-superficie text-tinta
                     placeholder:text-tinta-suave focus:border-marca focus:ring-marca focus:ring-1 min-w-0 flex-1
                     rounded-2xl border px-4 text-base outline-none"
        />
        <button
          type="submit"
          disabled={pendiente || texto.trim().length === 0}
          aria-label={pendiente ? 'Agregando' : 'Agregar item'}
          className="min-h-touch bg-marca flex size-12 shrink-0 items-center justify-center
                     rounded-2xl text-2xl font-semibold text-sobre-relleno disabled:opacity-60"
        >
          <span aria-hidden="true">{pendiente ? '···' : '+'}</span>
        </button>
      </form>
    </div>
  )
}
