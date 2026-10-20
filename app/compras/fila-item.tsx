'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import type { ItemVista } from '@/lib/compras/consultas'

import { marcarComprado } from './acciones'
import { avisoDeFallo, type Aviso } from './fallo'

/**
 * Marcar es lo que más se hace en el súper, así que va optimista: la tilde
 * sale con el toque y no cuando vuelve el servidor, que con la señal de un
 * supermercado tarda segundos.
 *
 * Va con estado propio y NO con `useOptimistic` ni con un `<form action>`, y
 * es a propósito. Los dos corren la acción dentro de una transición async, y
 * React junta todas las transiciones en curso: mientras una espera al
 * servidor, ninguna otra se aplica. La navegación de Next es una transición,
 * así que tocar una pestaña justo después de marcar no hacía nada hasta que
 * volvía la respuesta (y con mala señal, nunca). Llamada fuera de toda
 * transición, la navegación descarta la acción pendiente y sale en el acto.
 * Lo prueba `tests/e2e/navegacion.spec.ts`.
 *
 * `pedido` es lo que la persona tocó y el servidor todavía no mostró, y
 * manda sobre `item.comprado` mientras tanto. Se suelta cuando llega un
 * render del servidor sin toques en vuelo: Next resuelve la acción antes de
 * aplicar el árbol nuevo, así que ese render ya trae el resultado. Si falla,
 * se suelta enseguida y la fila dice por qué.
 *
 * Dos toques seguidos valen como dos intenciones: el segundo lee el valor
 * pedido y deshace el primero. Next corre las acciones en orden, así que gana
 * la última. Por eso solo la última puede escribir el aviso: si no, el fallo
 * del primer toque llegaba después y quedaba pegado en una fila que terminó
 * como la persona quería.
 */
function useMarcar(item: ItemVista) {
  const [pedido, setPedido] = useState<boolean | null>(null)
  const [enVuelo, setEnVuelo] = useState(0)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const ultimo = useRef(0)

  // Cada render del servidor trae un `item` nuevo. Es el patrón de React para
  // ajustar estado cuando cambia una prop, sin un efecto que pinte dos veces.
  const [visto, setVisto] = useState(item)
  if (visto !== item) {
    setVisto(item)
    if (enVuelo === 0) setPedido(null)
  }

  const comprado = pedido ?? item.comprado

  function alternar() {
    const comprar = !comprado
    const intento = ++ultimo.current
    const verbo = comprar ? 'marcar' : 'desmarcar'

    setAviso(null)
    setPedido(comprar)
    setEnVuelo((n) => n + 1)

    marcarComprado(item.id, comprar)
      .then((resultado) => {
        if (resultado.error && intento === ultimo.current) {
          setPedido(null)
          setAviso({ texto: resultado.error })
        }
      })
      .catch((e: unknown) => {
        const fallo = avisoDeFallo(e, verbo)
        if (fallo && intento === ultimo.current) {
          setPedido(null)
          setAviso(fallo)
        }
      })
      .finally(() => setEnVuelo((n) => n - 1))
  }

  return { comprado, alternar, aviso }
}

/*
  El anillo va hacia adentro: la tarjeta del grupo lleva `overflow-hidden`
  para que el fondo al presionar respete las esquinas, y un anillo hacia
  afuera quedaría cortado.
*/
const FOCO = 'focus-visible:outline-marca focus-visible:outline-2 focus-visible:-outline-offset-2'

/*
  «Editar» va en tinta-suave y no en la marca, aunque sea un enlace: se repite
  en cada fila, y en terracota serían siete palabras de acción compitiendo con
  los productos, que son lo que se viene a leer. La acción principal de la
  fila es tocarla.
*/
const EDITAR = `min-h-touch text-tinta-suave active:bg-superficie flex shrink-0 items-center px-4 text-base ${FOCO}`

/**
 * El círculo es decorativo: el control es la fila entera. Va en
 * `borde-control` porque es lo único que dice «esto se marca» con la fila
 * vacía, y eso pide el 3:1 de los bordes de campo.
 */
function Circulo({ comprado }: { comprado: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        comprado ? 'border-ok bg-ok text-sobre-relleno' : 'border-borde-control'
      }`}
    >
      {comprado ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-4">
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}

function AvisoDeFila({ aviso }: { aviso: Aviso | null }) {
  if (!aviso) return null
  // `alert` para que se anuncie: lo que la persona tocó no pasó y la tilde
  // se fue sola, que sin aviso parece un toque que no agarró.
  return (
    <div role="alert" className="flex items-center justify-between gap-3 px-4 pb-1">
      <p className="text-peligro py-2 text-sm">{aviso.texto}</p>
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
  )
}

/**
 * «Leche Dos Pinos 2L · 2»: la cantidad pegada al nombre, no contra el borde.
 * Con un nombre largo se corta el nombre y no la cantidad, que es lo que hace
 * falta frente a la góndola. La cantidad lleva su propio tope porque es
 * texto libre. El `&nbsp;` es porque un item flex se come el espacio inicial.
 */
function Nombre({ item }: { item: ItemVista }) {
  return (
    <span className="flex min-w-0 items-baseline">
      <span className="truncate font-medium">{item.producto}</span>
      {item.cantidad ? (
        <span className="text-tinta-suave max-w-[45%] shrink-0 truncate">&nbsp;· {item.cantidad}</span>
      ) : null}
    </span>
  )
}

/**
 * Una fila de la lista. Tocarla entera marca el item: es lo que más se
 * repite, y antes ese toque grande abría el detalle, que es lo más raro.
 * Editar va al final y con su palabra.
 *
 * Una sola línea: nombre y cantidad. La segunda aparece solo con nota o
 * fotos, lo único que ayuda frente a la góndola. La tienda la dice el
 * encabezado del grupo; las etiquetas y quién lo anotó, el detalle.
 */
export function FilaItem({ item }: { item: ItemVista }) {
  const { comprado, alternar, aviso } = useMarcar(item)

  const fotos = item.fotos > 0 ? `${item.fotos} ${item.fotos === 1 ? 'foto' : 'fotos'}` : null
  const detalle = [item.nota, fotos].filter(Boolean).join(' · ')

  return (
    <li>
      <div className="flex items-stretch">
        <button
          type="button"
          role="checkbox"
          aria-checked={comprado}
          onClick={alternar}
          className={`min-h-touch active:bg-superficie flex min-w-0 flex-1 items-center gap-3 py-2 pl-3
                      text-left ${FOCO}`}
        >
          <Circulo comprado={comprado} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={`text-base ${comprado ? 'text-tinta-suave line-through' : 'text-tinta'}`}>
              <Nombre item={item} />
            </span>
            {detalle ? <span className="text-tinta-suave truncate text-sm">{detalle}</span> : null}
          </span>
        </button>

        <Link href={`/compras/${item.id}`} className={EDITAR}>
          Editar<span className="sr-only"> {item.producto}</span>
        </Link>
      </div>
      <AvisoDeFila aviso={aviso} />
    </li>
  )
}

/**
 * Lo ya comprado: tachado y en una línea. Se toca igual que una fila
 * pendiente, porque desmarcar algo que se tocó por error tiene que costar un
 * toque.
 *
 * `marca` va a la derecha: quién lo marcó si fue hoy (con dos personas en el
 * súper, eso es lo que evita comprarlo dos veces) o el día, si fue antes. La
 * arma el servidor: la fecha relativa («Ayer») calculada en el cliente no
 * coincidía al hidratar una página guardada de otro día.
 *
 * Lo de hoy no lleva «Editar»: ese lugar es del nombre de quien lo marcó. Lo
 * de antes sí, porque el acordeón es el único camino a su detalle.
 */
export function FilaComprada({
  item,
  marca,
  editable = false,
}: {
  item: ItemVista
  marca: { previo: string; texto: string } | null
  editable?: boolean
}) {
  const { comprado, alternar, aviso } = useMarcar(item)

  return (
    <li>
      <div className="flex items-stretch">
        <button
          type="button"
          role="checkbox"
          aria-checked={comprado}
          onClick={alternar}
          className={`min-h-touch active:bg-superficie flex min-w-0 flex-1 items-center gap-3 py-2 pl-3
                      text-left ${editable ? '' : 'pr-4'} ${FOCO}`}
        >
          <Circulo comprado={comprado} />
          <span
            className={`min-w-0 flex-1 text-base ${
              comprado ? 'text-tinta-suave line-through' : 'text-tinta'
            }`}
          >
            <Nombre item={item} />
          </span>
          {/* Con tope: un nombre de 60 letras dejaba al producto sin lugar. El
              nombre completo sigue en el nombre accesible del botón. */}
          {marca ? (
            <span className="text-tinta-suave max-w-[40%] shrink-0 truncate text-sm">
              <span className="sr-only">{marca.previo}</span>
              {marca.texto}
            </span>
          ) : null}
        </button>

        {editable ? (
          <Link href={`/compras/${item.id}`} className={EDITAR}>
            Editar<span className="sr-only"> {item.producto}</span>
          </Link>
        ) : null}
      </div>
      <AvisoDeFila aviso={aviso} />
    </li>
  )
}
