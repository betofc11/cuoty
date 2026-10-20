'use client'

import Link from 'next/link'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { Hoja } from '@/components/ui/hoja'
import type { ItemVista, TagVista, TiendaVista } from '@/lib/compras/consultas'
import { fechaCorta } from '@/lib/fechas'

import {
  borrarDeLaLista,
  cambiarCantidad,
  cambiarEtiquetas,
  cambiarNota,
  moverDeTienda,
  type EstadoCompras,
} from './acciones'
import { CHIP, CHIP_APAGADO, CHIP_ELEGIDO } from './chips'
import { avisoDeFallo } from './fallo'

const Abrir = createContext<((item: ItemVista) => void) | null>(null)

/** Para que una fila abra la hoja. Fuera de `EditorDeItems` da `null`. */
export function useEditarItem() {
  return useContext(Abrir)
}

/**
 * Editar sin salir de la lista: una sola hoja para todos los items, que sube
 * desde abajo con la lista detrás. Antes «Editar» abría una página, y cambiar la
 * tienda costaba cinco pasos (abrir, elegir en un select, «Guardar cambios»,
 * «Volver»). En la casa real, 40 de 49 items pasaron por ahí.
 *
 * La hoja guarda una copia del item al abrirse: mientras está abierta, un
 * refresco de Realtime cambia la fila de atrás pero no pisa lo que se está
 * escribiendo.
 */
export function EditorDeItems({
  tiendas,
  etiquetas,
  children,
}: {
  tiendas: TiendaVista[]
  etiquetas: TagVista[]
  children: React.ReactNode
}) {
  const [item, setItem] = useState<ItemVista | null>(null)
  const cerrar = () => setItem(null)

  return (
    <Abrir.Provider value={setItem}>
      {children}
      <Hoja abierta={item !== null} onCerrar={cerrar} titulo={item?.producto ?? ''}>
        {item ? (
          <Formulario
            key={item.id}
            item={item}
            tiendas={tiendas}
            etiquetas={etiquetas}
            alBorrar={cerrar}
          />
        ) : null}
      </Hoja>
    </Abrir.Provider>
  )
}

type Campo = 'tienda' | 'cantidad' | 'nota' | 'etiquetas'
type Estado = { tipo: 'guardando' } | { tipo: 'guardado' } | { tipo: 'error'; texto: string }

/** «Guardando…», «Guardado» o el error, al lado de la etiqueta del campo. */
function EstadoDelCampo({ estado }: { estado: Estado | undefined }) {
  if (!estado) return null
  if (estado.tipo === 'error') {
    return (
      <span role="alert" className="text-peligro text-sm font-normal">
        {estado.texto}
      </span>
    )
  }
  return (
    <span
      aria-live="polite"
      className={`text-sm font-normal ${estado.tipo === 'guardado' ? 'text-ok' : 'text-tinta-suave'}`}
    >
      {estado.tipo === 'guardado' ? 'Guardado' : 'Guardando…'}
    </span>
  )
}

const ETIQUETA = 'text-tinta flex items-baseline justify-between gap-3 text-base font-medium'
const CAMPO =
  'border-borde-control bg-superficie-alta text-tinta placeholder:text-tinta-suave ' +
  'focus:border-marca focus:ring-marca focus:ring-1 rounded-2xl border px-4 text-base outline-none'

function Formulario({
  item,
  tiendas,
  etiquetas,
  alBorrar,
}: {
  item: ItemVista
  tiendas: TiendaVista[]
  etiquetas: TagVista[]
  alBorrar: () => void
}) {
  const [tiendaId, setTiendaId] = useState(item.tienda.id)
  const [cantidad, setCantidad] = useState(item.cantidad ?? '')
  const [nota, setNota] = useState(item.nota ?? '')
  const [tagIds, setTagIds] = useState(() => new Set(item.tags.map((t) => t.id)))
  const [estados, setEstados] = useState<Partial<Record<Campo, Estado>>>({})
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null)

  // Lo último que quedó guardado de cada texto: el campo se guarda al salir de
  // él, y solo si cambió.
  const guardado = useRef({ cantidad: item.cantidad ?? '', nota: item.nota ?? '' })
  // Lo que hay escrito ahora, para guardarlo si la hoja se cierra sin que el
  // campo pierda el foco (con Esc, o tocando el fondo).
  const escrito = useRef({ cantidad, nota })
  escrito.current = { cantidad, nota }
  // Solo el último guardado de cada campo escribe su estado: si no, un «No se
  // pudo» viejo pisaría el «Guardado» del toque que sí salió.
  const ultimo = useRef<Record<Campo, number>>({ tienda: 0, cantidad: 0, nota: 0, etiquetas: 0 })

  const marcar = (campo: Campo, estado: Estado) => setEstados((e) => ({ ...e, [campo]: estado }))

  /**
   * Guarda un campo. Va como promesa suelta y no en una transición: con la
   * hoja cerrada, una transición pendiente no dejaría navegar con las pestañas.
   */
  async function guardar(
    campo: Campo,
    llamada: () => Promise<EstadoCompras>,
    revertir: () => void,
  ) {
    const intento = ++ultimo.current[campo]
    marcar(campo, { tipo: 'guardando' })
    try {
      const resultado = await llamada()
      if (intento !== ultimo.current[campo]) return
      if (resultado.error) {
        revertir()
        marcar(campo, { tipo: 'error', texto: resultado.error })
      } else {
        marcar(campo, { tipo: 'guardado' })
      }
    } catch (e) {
      if (intento !== ultimo.current[campo]) return
      const aviso = avisoDeFallo(e, 'guardar')
      if (aviso) {
        revertir()
        marcar(campo, { tipo: 'error', texto: aviso.texto })
      }
    }
  }

  function elegirTienda(nueva: string) {
    if (nueva === tiendaId) return
    const antes = tiendaId
    setTiendaId(nueva)
    void guardar('tienda', () => moverDeTienda(item.id, nueva), () => setTiendaId(antes))
  }

  function guardarTexto(campo: 'cantidad' | 'nota') {
    const valor = (campo === 'cantidad' ? cantidad : nota).trim()
    const antes = guardado.current[campo]
    if (valor === antes) return
    guardado.current[campo] = valor
    // Si falla, lo escrito se queda en el campo para reintentar: solo se
    // olvida que estaba guardado.
    void guardar(
      campo,
      () => (campo === 'cantidad' ? cambiarCantidad(item.id, valor) : cambiarNota(item.id, valor)),
      () => {
        guardado.current[campo] = antes
      },
    )
  }

  // Al cerrar la hoja sin salir del campo, lo escrito no se pierde.
  useEffect(() => {
    return () => {
      const { cantidad: c, nota: n } = escrito.current
      if (c.trim() !== guardado.current.cantidad) void cambiarCantidad(item.id, c.trim())
      if (n.trim() !== guardado.current.nota) void cambiarNota(item.id, n.trim())
    }
  }, [item.id])

  function alternarEtiqueta(tagId: string) {
    const antes = tagIds
    const nuevas = new Set(tagIds)
    if (nuevas.has(tagId)) nuevas.delete(tagId)
    else nuevas.add(tagId)
    setTagIds(nuevas)
    void guardar('etiquetas', () => cambiarEtiquetas(item.id, [...nuevas]), () => setTagIds(antes))
  }

  async function borrar() {
    setBorrando(true)
    setErrorBorrar(null)
    try {
      const resultado = await borrarDeLaLista(item.id)
      if (resultado.error) setErrorBorrar(resultado.error)
      else alBorrar()
    } catch (e) {
      const aviso = avisoDeFallo(e, 'borrar')
      if (aviso) setErrorBorrar(aviso.texto)
    } finally {
      setBorrando(false)
    }
  }

  const alSalirConEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  return (
    <>
      <div className="flex flex-col gap-5 px-4 pt-2 pb-5">
        <fieldset className="flex flex-col">
          <legend className={`${ETIQUETA} mb-3 w-full`}>
            Dónde se compra <EstadoDelCampo estado={estados.tienda} />
          </legend>
          {/* gap-y-3: el chip mide 36 y se toca en 48, así las áreas no se pisan. */}
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {tiendas.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === tiendaId}
                onClick={() => elegirTienda(t.id)}
                className={`${CHIP} ${t.id === tiendaId ? CHIP_ELEGIDO : CHIP_APAGADO}`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="hoja-cantidad" className={ETIQUETA}>
            Cantidad <EstadoDelCampo estado={estados.cantidad} />
          </label>
          <input
            id="hoja-cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            onBlur={() => guardarTexto('cantidad')}
            onKeyDown={alSalirConEnter}
            enterKeyHint="done"
            placeholder="2 kg, 3 unidades…"
            autoComplete="off"
            maxLength={40}
            className={`min-h-touch ${CAMPO}`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="hoja-nota" className={ETIQUETA}>
            Nota <EstadoDelCampo estado={estados.nota} />
          </label>
          <textarea
            id="hoja-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onBlur={() => guardarTexto('nota')}
            rows={2}
            placeholder="La marca verde, no la azul"
            maxLength={200}
            className={`${CAMPO} py-3`}
          />
        </div>

        {etiquetas.length > 0 ? (
          <fieldset className="flex flex-col">
            <legend className={`${ETIQUETA} mb-3 w-full`}>
              Etiquetas <EstadoDelCampo estado={estados.etiquetas} />
            </legend>
            <div className="flex flex-wrap gap-x-2 gap-y-3">
              {etiquetas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tagIds.has(t.id)}
                  onClick={() => alternarEtiqueta(t.id)}
                  className={`${CHIP} ${tagIds.has(t.id) ? CHIP_ELEGIDO : CHIP_APAGADO}`}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>

      <div className="border-borde-suave divide-borde-suave flex flex-col divide-y border-t">
        <p className="text-tinta-suave px-4 py-3 text-sm">
          Lo anotó {item.agregadoPor} · {fechaCorta(item.agregadoEl).toLowerCase()}
        </p>

        {/* Las fotos siguen en la página del item: subir una es la cámara y
            Storage, y no cabe en una hoja que se usa para cambios de un toque. */}
        <Link
          href={`/compras/${item.id}`}
          className="min-h-touch text-marca active:bg-superficie flex items-center px-4 text-base font-semibold"
        >
          {item.fotos > 0 ? `Ver las fotos (${item.fotos})` : 'Agregar una foto'}
        </Link>

        {confirmando ? (
          <div className="flex flex-col gap-3 px-4 py-3">
            <p className="text-tinta text-base">
              ¿Borrar {item.producto} de la lista? No se puede deshacer.
            </p>
            {errorBorrar ? (
              <p role="alert" className="text-peligro text-sm">
                {errorBorrar}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={borrar}
                disabled={borrando}
                className="min-h-touch bg-peligro text-sobre-relleno flex-1 rounded-2xl px-4 text-base
                           font-semibold disabled:opacity-60"
              >
                {borrando ? 'Borrando…' : 'Sí, borrar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="min-h-touch border-borde bg-superficie-alta text-tinta flex-1 rounded-2xl border px-4
                           text-base font-semibold"
              >
                No, dejarlo
              </button>
            </div>
          </div>
        ) : (
          // Dos pasos: en una hoja que se usa a las carreras, un toque suelto
          // no puede borrar algo que no vuelve.
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="min-h-touch text-peligro active:bg-superficie flex items-center px-4 text-left text-base
                       font-semibold"
          >
            Borrar de la lista
          </button>
        )}
      </div>
    </>
  )
}
