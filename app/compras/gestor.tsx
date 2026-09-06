'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Alert } from '@/components/ui/alert'

import type { EstadoCompras } from './acciones'

export type FilaGestor = {
  id: string
  nombre: string
  /** No se puede borrar. Lleva el motivo al lado, no un botón apagado. */
  fijo?: string
  detalle?: string
}

type Accion = (previo: EstadoCompras, formData: FormData) => Promise<EstadoCompras>

function BotonBorrar({ nombre }: { nombre: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Borrar ${nombre}`}
      className="min-h-touch text-peligro -mr-2 px-3 text-base font-semibold disabled:opacity-60"
    >
      {pending ? '···' : 'Borrar'}
    </button>
  )
}

/**
 * Alta y baja de una lista simple con nombre único por casa. Lo usan
 * tiendas y etiquetas: cambia el texto, no el comportamiento.
 */
export function Gestor({
  filas,
  campoId,
  etiquetaCampo,
  placeholder,
  maxLength,
  crear,
  borrar,
  nombreCampoBorrar,
  vacio,
}: {
  filas: FilaGestor[]
  /** Va como `id` y como `name` del input: llega a la acción con este nombre. */
  campoId: string
  etiquetaCampo: string
  placeholder: string
  maxLength: number
  crear: Accion
  borrar: Accion
  /** Cómo se llama el input oculto que recibe la acción de borrar. */
  nombreCampoBorrar: string
  vacio: string
}) {
  const [texto, setTexto] = useState('')

  const [estadoCrear, accionCrear, creando] = useActionState<EstadoCompras, FormData>(
    async (previo, formData) => {
      const resultado = await crear(previo, formData)
      if (!resultado.error) setTexto('')
      return resultado
    },
    {},
  )

  // Un solo estado para todos los borrados: no se borran dos a la vez.
  const [estadoBorrar, accionBorrar] = useActionState<EstadoCompras, FormData>(borrar, {})

  return (
    <div className="flex flex-col gap-4">
      <form action={accionCrear} className="flex gap-2">
        <label htmlFor={campoId} className="sr-only">
          {etiquetaCampo}
        </label>
        {/*
          El `name` sale de `campoId` («tienda», «etiqueta») y no es «nombre»
          a propósito: Safari ignora el `autoComplete="off"` de abajo y clasifica
          el campo por heurística sobre el `name` y el `id`. Con «nombre» lo toma
          por el titular de una tarjeta y ofrece los datos de pago del iPhone.
        */}
        <input
          id={campoId}
          name={campoId}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={maxLength}
          className="min-h-touch border-borde bg-superficie-alta text-tinta
                     placeholder:text-tinta-suave focus:border-crc min-w-0 flex-1
                     rounded-2xl border px-4 text-base outline-none"
        />
        <button
          type="submit"
          disabled={creando || texto.trim().length === 0}
          className="min-h-touch bg-crc flex shrink-0 items-center justify-center rounded-2xl
                     px-5 text-base font-semibold text-white disabled:opacity-60"
        >
          {creando ? 'Agregando…' : 'Agregar'}
        </button>
      </form>

      {estadoCrear.error ? <Alert tono="error">{estadoCrear.error}</Alert> : null}
      {estadoBorrar.error ? <Alert tono="error">{estadoBorrar.error}</Alert> : null}

      {filas.length === 0 ? (
        <p className="text-tinta-suave text-base">{vacio}</p>
      ) : (
        <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
          {filas.map((fila) => (
            <li key={fila.id} className="flex items-center justify-between gap-3 py-2 pl-4 pr-4">
              <span className="flex min-w-0 flex-col">
                <span className="text-tinta truncate text-base">{fila.nombre}</span>
                {fila.detalle ? (
                  <span className="text-tinta-suave text-sm">{fila.detalle}</span>
                ) : null}
              </span>

              {fila.fijo ? (
                <span className="text-tinta-suave shrink-0 text-sm">{fila.fijo}</span>
              ) : (
                <form action={accionBorrar} className="shrink-0">
                  <input type="hidden" name={nombreCampoBorrar} value={fila.id} />
                  <BotonBorrar nombre={fila.nombre} />
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
