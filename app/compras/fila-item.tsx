'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'

import type { ItemVista } from '@/lib/compras/consultas'
import { fechaCorta } from '@/lib/fechas'

import { alternarComprado } from './acciones'
import { BadgeEtiqueta, BadgeTienda } from './badges'

function Casilla({ item }: { item: ItemVista }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={
        item.comprado
          ? `Desmarcar ${item.producto} como comprado`
          : `Marcar ${item.producto} como comprado`
      }
      // El botón es de 48 aunque el círculo sea de 24: el target táctil no
      // se negocia, y así arranca alineado con el nombre y no con el centro
      // de una fila que crece con las etiquetas y la nota.
      className="min-h-touch active:bg-superficie flex size-12 shrink-0 items-center
                 justify-center self-start rounded-2xl"
    >
      <span
        aria-hidden="true"
        className={`flex size-6 items-center justify-center rounded-full border-2 transition ${
          item.comprado ? 'border-ok bg-ok text-white' : 'border-borde'
        } ${pending ? 'opacity-50' : ''}`}
      >
        {item.comprado ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-4">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  )
}

/**
 * La versión compacta que vive dentro del acordeón de comprados. Lleva la
 * casilla igual que la fila normal: desmarcar algo que se tocó por error
 * tiene que costar un toque, no abrir el detalle.
 */
export function FilaComprada({ item }: { item: ItemVista }) {
  return (
    <li className="flex items-center">
      <form action={alternarComprado} className="flex">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="comprar" value="no" />
        <Casilla item={item} />
      </form>

      <Link
        href={`/compras/${item.id}`}
        className="active:bg-superficie flex min-w-0 flex-1 items-center justify-between
                   gap-3 self-stretch py-2 pr-4"
      >
        <span className="text-tinta-suave min-w-0 truncate text-base line-through">
          {item.producto}
        </span>
        {item.compradoEl ? (
          <span className="text-tinta-suave shrink-0 text-sm">
            {fechaCorta(item.compradoEl)}
          </span>
        ) : null}
      </Link>
    </li>
  )
}

export function FilaItem({ item }: { item: ItemVista }) {
  return (
    <li className="border-borde-suave bg-superficie-alta flex items-stretch rounded-2xl border">
      <form action={alternarComprado} className="flex">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="comprar" value={item.comprado ? 'no' : 'si'} />
        <Casilla item={item} />
      </form>

      <Link
        href={`/compras/${item.id}`}
        className="active:bg-superficie flex min-w-0 flex-1 items-start gap-2 rounded-r-2xl py-3.5 pr-3"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-baseline gap-2">
            <span
              className={`min-w-0 flex-1 truncate text-base font-semibold ${
                item.comprado ? 'text-tinta-suave line-through' : 'text-tinta'
              }`}
            >
              {item.producto}
            </span>
            {item.cantidad ? (
              <span className="text-tinta-suave shrink-0 text-sm">{item.cantidad}</span>
            ) : null}
          </span>

          <span className="flex flex-wrap items-center gap-1.5">
            {item.tags.map((t) => (
              <BadgeEtiqueta key={t.id} tono={t.tono} nombre={t.nombre} />
            ))}
            <BadgeTienda nombre={item.tienda.nombre} />
          </span>

          {item.nota ? (
            <span className="text-tinta-suave truncate text-sm">{item.nota}</span>
          ) : null}

          <span className="text-tinta-suave text-sm">
            {item.comprado && item.compradoPor
              ? `Lo marcó ${item.compradoPor}${
                  item.compradoEl ? ` · ${fechaCorta(item.compradoEl).toLowerCase()}` : ''
                }`
              : `Agregado por ${item.agregadoPor}`}
            {item.fotos > 0 ? ` · ${item.fotos} ${item.fotos === 1 ? 'foto' : 'fotos'}` : ''}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="text-tinta-suave flex h-6 shrink-0 items-center text-base"
        >
          ›
        </span>
      </Link>
    </li>
  )
}
