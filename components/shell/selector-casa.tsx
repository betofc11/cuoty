'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'

import { cambiarCasa } from '@/app/acciones/casa'
import type { Casa } from '@/lib/auth/session'
import { colorDeCasa, inicialDeCasa } from '@/lib/casas/color'

function rotulo(casa: Casa, esActiva: boolean): string {
  const miembros = `${casa.miembros} ${casa.miembros === 1 ? 'miembro' : 'miembros'}`
  return esActiva ? `Activa · ${miembros}` : miembros
}

function Chip({ casa }: { casa: Casa }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: colorDeCasa(casa.id) }}
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-lg
                 font-semibold text-white"
    >
      {inicialDeCasa(casa.nombre)}
    </span>
  )
}

function FilaCasa({ casa, esActiva }: { casa: Casa; esActiva: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className="min-h-touch active:bg-superficie flex w-full items-center gap-3 px-4 py-3 text-left"
    >
      <Chip casa={casa} />
      <span className="flex min-w-0 flex-col">
        <span className="text-tinta truncate text-base font-semibold">{casa.nombre}</span>
        <span className="text-tinta-suave text-sm">
          {pending ? `Cargando ${casa.nombre}…` : rotulo(casa, esActiva)}
        </span>
      </span>
    </button>
  )
}

/**
 * Única excepción a "los íconos siempre van con texto": la tuerca del dropdown
 * de casas. Zona propia de 56px con separador, y tocarla TAMBIÉN cambia la casa
 * activa — no solo abre los ajustes.
 */
function BotonTuerca({ nombre }: { nombre: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      aria-label={`Ajustes de ${nombre}`}
      className="active:bg-superficie text-tinta-suave flex w-14 items-center justify-center self-stretch"
    >
      {pending ? (
        <span aria-hidden="true" className="text-lg">
          ···
        </span>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="size-5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      )}
    </button>
  )
}

export function SelectorCasa({ activa, casas }: { activa: Casa; casas: Casa[] }) {
  const [abierto, setAbierto] = useState(false)
  const unaSola = casas.length === 1

  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="min-h-touch flex w-full items-center gap-2 py-1 pl-2 text-left"
      >
        <span
          aria-hidden="true"
          style={{ backgroundColor: colorDeCasa(activa.id) }}
          className="w-1 self-stretch rounded-full"
        />
        <span className="flex min-w-0 flex-col">
          <span className="text-tinta flex items-center gap-1 text-base font-semibold">
            <span className="truncate">{activa.nombre}</span>
            <span aria-hidden="true" className="text-tinta-suave">
              ▾
            </span>
          </span>
          {/* El rol se lee sin abrir nada: es lo que compra la variación ii. */}
          <span className="text-tinta-suave text-xs">
            {activa.rol === 'admin' ? 'Administro esta casa' : 'Soy miembro'}
          </span>
        </span>
      </button>

      {abierto ? (
        <>
          <button
            type="button"
            aria-label="Cerrar el selector de casas"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />

          <div
            className="border-borde bg-superficie-alta absolute top-full left-0 z-20 mt-2
                       w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-lg"
          >
            <p className="text-tinta-suave px-4 pt-4 pb-2 text-xs font-semibold tracking-wide uppercase">
              {unaSola ? 'Mi casa' : 'Mis casas'}
            </p>

            <ul className="divide-borde-suave divide-y">
              {casas.map((casa) => {
                const esActiva = casa.id === activa.id

                // Con una sola casa no hay nada que elegir: la fila no es un
                // control. Un botón deshabilitado sería peor que no tenerlo.
                if (unaSola) {
                  return (
                    <li key={casa.id} className="flex items-center gap-3 px-4 py-3">
                      <Chip casa={casa} />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-tinta truncate text-base font-semibold">
                          {casa.nombre}
                        </span>
                        <span className="text-tinta-suave text-sm">
                          {rotulo(casa, true)}
                        </span>
                      </span>
                    </li>
                  )
                }

                return (
                  <li key={casa.id} className="flex items-stretch">
                    <form action={cambiarCasa} className="min-w-0 flex-1">
                      <input type="hidden" name="casaId" value={casa.id} />
                      <input type="hidden" name="destino" value="/" />
                      <FilaCasa casa={casa} esActiva={esActiva} />
                    </form>

                    {/* La tuerca solo donde soy admin. Donde soy miembro no existe. */}
                    {casa.rol === 'admin' ? (
                      <form action={cambiarCasa} className="border-borde-suave flex border-l">
                        <input type="hidden" name="casaId" value={casa.id} />
                        <input type="hidden" name="destino" value="/casa" />
                        <BotonTuerca nombre={casa.nombre} />
                      </form>
                    ) : null}
                  </li>
                )
              })}
            </ul>

            <div className="border-borde flex flex-col border-t">
              <Link
                href="/onboarding/unirme"
                className="min-h-touch text-crc active:bg-superficie flex items-center px-4 text-base font-semibold"
              >
                Unirme a otra casa
              </Link>
              <Link
                href="/onboarding/crear"
                className="min-h-touch text-crc active:bg-superficie flex items-center px-4 text-base font-semibold"
              >
                Crear casa
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
