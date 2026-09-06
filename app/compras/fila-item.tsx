'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'

import type { ItemVista } from '@/lib/compras/consultas'

import { alternarComprado } from './acciones'

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
      className="min-h-touch active:bg-superficie-alta flex w-14 shrink-0 items-center justify-center self-stretch"
    >
      <span
        aria-hidden="true"
        className={`flex size-6 items-center justify-center rounded-lg border-2 transition ${
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

export function FilaItem({ item }: { item: ItemVista }) {
  return (
    <li className="flex items-stretch">
      <form action={alternarComprado} className="flex">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="comprar" value={item.comprado ? 'no' : 'si'} />
        <Casilla item={item} />
      </form>

      <Link
        href={`/compras/${item.id}`}
        className="active:bg-superficie-alta flex min-w-0 flex-1 flex-col gap-1 py-3 pr-4"
      >
        <span className="flex items-baseline gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-base font-medium ${
              item.comprado ? 'text-tinta-suave line-through' : 'text-tinta'
            }`}
          >
            {item.producto}
          </span>
          {item.cantidad ? (
            <span className="text-tinta-suave shrink-0 text-sm">{item.cantidad}</span>
          ) : null}
        </span>

        {item.tags.length > 0 || item.nota || item.fotos > 0 ? (
          <span className="flex flex-wrap items-center gap-1">
            {item.tags.map((t) => (
              <span
                key={t.id}
                className="border-borde text-tinta-suave rounded-full border px-2 py-0.5 text-xs"
              >
                {t.nombre}
              </span>
            ))}
            {item.nota ? (
              <span className="text-tinta-suave truncate text-sm">{item.nota}</span>
            ) : null}
            {item.fotos > 0 ? (
              <span className="text-tinta-suave text-xs">
                {item.fotos} {item.fotos === 1 ? 'foto' : 'fotos'}
              </span>
            ) : null}
          </span>
        ) : null}

        {item.comprado && item.compradoPor ? (
          <span className="text-tinta-suave text-sm">Lo compró {item.compradoPor}</span>
        ) : null}
      </Link>
    </li>
  )
}
