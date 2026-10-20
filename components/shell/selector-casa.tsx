'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { cambiarCasa } from '@/app/acciones/casa'
import { Hoja } from '@/components/ui/hoja'
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

function IconoTuerca() {
  return (
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
  )
}

const FILA = 'min-h-touch active:bg-superficie flex w-full items-center gap-3 px-4 py-3 text-left'

function TextoDeFila({ casa, linea }: { casa: Casa; linea: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-tinta truncate text-base font-semibold">{casa.nombre}</span>
      <span className="text-tinta-suave text-sm">{linea}</span>
    </span>
  )
}

function FilaCasa({ casa }: { casa: Casa }) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className={FILA}>
      <Chip casa={casa} />
      <TextoDeFila casa={casa} linea={pending ? `Cargando ${casa.nombre}…` : rotulo(casa, false)} />
    </button>
  )
}

/**
 * Única excepción a "los íconos siempre van con texto": la tuerca de las casas.
 * Zona propia de 56px con separador, y tocarla TAMBIÉN cambia la casa activa —
 * no solo abre los ajustes.
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
        <IconoTuerca />
      )}
    </button>
  )
}

export function SelectorCasa({ activa, casas }: { activa: Casa; casas: Casa[] }) {
  const [abierto, setAbierto] = useState(false)
  const unaSola = casas.length === 1
  const cerrar = () => setAbierto(false)

  // Este selector vive en el layout de las tabs y ya no se desmonta al navegar.
  // Elegir otra casa la vuelve a pintar con `activa` nueva: ahí se cierra la
  // hoja. Elegir la que ya está activa no pasa por el servidor (abajo).
  useEffect(() => {
    setAbierto(false)
  }, [activa.id])

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
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

      <Hoja abierta={abierto} onCerrar={cerrar} titulo={unaSola ? 'Mi casa' : 'Mis casas'}>
        <ul className="border-borde-suave divide-borde-suave divide-y border-t">
          {casas.map((casa) => {
            const esActiva = casa.id === activa.id

            // La tuerca solo donde soy admin. Donde soy miembro no existe.
            // Va aunque haya una sola casa: /casa es el único lugar donde vive
            // el código para invitar, y sin ella quien recién crea su casa no
            // puede sumar a nadie.
            const tuerca =
              casa.rol !== 'admin' ? null : unaSola ? (
                <Link
                  href="/casa"
                  aria-label={`Ajustes de ${casa.nombre}`}
                  onClick={cerrar}
                  className="border-borde-suave active:bg-superficie text-tinta-suave
                             flex w-14 items-center justify-center self-stretch border-l"
                >
                  <IconoTuerca />
                </Link>
              ) : (
                <form action={cambiarCasa} className="border-borde-suave flex border-l">
                  <input type="hidden" name="casaId" value={casa.id} />
                  <input type="hidden" name="destino" value="/casa" />
                  <BotonTuerca nombre={casa.nombre} />
                </form>
              )

            return (
              <li key={casa.id} className="flex items-stretch">
                {unaSola ? (
                  // Con una sola casa no hay nada que elegir: la fila no es un
                  // control. Un botón deshabilitado sería peor que no tenerlo.
                  <span className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                    <Chip casa={casa} />
                    <TextoDeFila casa={casa} linea={rotulo(casa, true)} />
                  </span>
                ) : esActiva ? (
                  // La que ya está activa solo cierra: mandarla al servidor no
                  // cambia la casa, así que la hoja no tendría por qué cerrarse.
                  <button type="button" onClick={cerrar} className={`${FILA} min-w-0 flex-1`}>
                    <Chip casa={casa} />
                    <TextoDeFila casa={casa} linea={rotulo(casa, true)} />
                  </button>
                ) : (
                  <form action={cambiarCasa} className="min-w-0 flex-1">
                    <input type="hidden" name="casaId" value={casa.id} />
                    <input type="hidden" name="destino" value="/" />
                    <FilaCasa casa={casa} />
                  </form>
                )}
                {tuerca}
              </li>
            )
          })}
        </ul>

        <div className="border-borde flex flex-col border-t">
          <Link
            href="/onboarding/unirme"
            onClick={cerrar}
            className="min-h-touch text-marca active:bg-superficie flex items-center px-4 text-base font-semibold"
          >
            Unirme a otra casa
          </Link>
          <Link
            href="/onboarding/crear"
            onClick={cerrar}
            className="min-h-touch text-marca active:bg-superficie flex items-center px-4 text-base font-semibold"
          >
            Crear casa
          </Link>
        </div>
      </Hoja>
    </div>
  )
}
