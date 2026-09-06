'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { DetalleItem, TagVista, TiendaVista } from '@/lib/compras/consultas'

import {
  alternarComprado,
  borrarItem,
  editarItem,
  type EstadoCompras,
} from '../acciones'

function BotonEstado({ comprado }: { comprado: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variante={comprado ? 'secundario' : 'primario'} disabled={pending}>
      {pending
        ? 'Guardando…'
        : comprado
          ? 'Marcar como pendiente'
          : 'Marcar como comprado'}
    </Button>
  )
}

function BotonBorrar({ producto }: { producto: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch text-peligro flex items-center justify-center text-base font-semibold disabled:opacity-60"
    >
      {pending ? 'Borrando…' : `Borrar ${producto} de la lista`}
    </button>
  )
}

export function EditorItem({
  item,
  tiendas,
  tags,
}: {
  item: DetalleItem
  tiendas: TiendaVista[]
  tags: TagVista[]
}) {
  const [estado, accion, pendiente] = useActionState<EstadoCompras, FormData>(editarItem, {})
  const puestos = new Set(item.tags.map((t) => t.id))

  return (
    <div className="flex flex-col gap-6">
      <form action={alternarComprado}>
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="comprar" value={item.comprado ? 'no' : 'si'} />
        <BotonEstado comprado={item.comprado} />
      </form>

      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="itemId" value={item.id} />

        <div className="flex flex-col gap-2">
          <label htmlFor="tiendaId" className="text-tinta text-base font-medium">
            Dónde se compra
          </label>
          <select
            id="tiendaId"
            name="tiendaId"
            defaultValue={item.tienda.id}
            className="min-h-touch border-borde bg-superficie-alta text-tinta focus:border-crc
                       rounded-2xl border px-4 text-base outline-none"
          >
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="cantidad" className="text-tinta text-base font-medium">
            Cantidad
          </label>
          <input
            id="cantidad"
            name="cantidad"
            defaultValue={item.cantidad ?? ''}
            placeholder="2 kg, 3 unidades…"
            autoComplete="off"
            className="min-h-touch border-borde bg-superficie-alta text-tinta
                       placeholder:text-tinta-suave focus:border-crc rounded-2xl border
                       px-4 text-base outline-none"
          />
          <p className="text-tinta-suave text-sm">
            Texto libre a propósito: «2 kg» y «un paquete» valen igual.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nota" className="text-tinta text-base font-medium">
            Nota
          </label>
          <textarea
            id="nota"
            name="nota"
            defaultValue={item.nota ?? ''}
            rows={2}
            placeholder="La marca verde, no la azul"
            className="border-borde bg-superficie-alta text-tinta placeholder:text-tinta-suave
                       focus:border-crc rounded-2xl border p-4 text-base outline-none"
          />
        </div>

        {tags.length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-tinta text-base font-medium">Etiquetas</legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((t) => (
                <label
                  key={t.id}
                  className="min-h-touch border-borde has-[:checked]:border-crc
                             has-[:checked]:bg-crc-tenue has-[:checked]:text-crc
                             has-[:checked]:font-semibold text-tinta-suave flex cursor-pointer
                             items-center gap-2 rounded-full border px-4 text-base"
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.id}
                    defaultChecked={puestos.has(t.id)}
                    className="accent-crc size-4"
                  />
                  {t.nombre}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}
        {estado.ok ? <Alert tono="ok">{estado.ok}</Alert> : null}

        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      <form action={borrarItem} className="border-borde border-t pt-2">
        <input type="hidden" name="itemId" value={item.id} />
        <BotonBorrar producto={item.producto} />
        <p className="text-tinta-suave pt-1 text-sm">
          Esto sí borra de verdad. La lista de compras no lleva contabilidad, así que no
          hay nada que anular.
        </p>
      </form>
    </div>
  )
}
