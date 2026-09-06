'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { OfflineBanner } from '@/components/ui/offline-banner'
import type { EstadoGasto } from '@/app/gastos/acciones'
import type { CurrencyCode } from '@/lib/money'

export type ListaOpcion = { id: string; nombre: string }

export type GastoExistente = {
  id: string
  nombre: string
  monto: string
  moneda: CurrencyCode
  listaId: string
  fechaCobro: string | null
}

/** Cobros desde `desde` hasta `hasta`, ambos inclusive. Formato 'YYYY-MM'. */
function cuantosCobros(desde: string, hasta: string): number {
  const [a1, m1] = desde.split('-').map(Number)
  const [a2, m2] = hasta.split('-').map(Number)
  if (!a1 || !m1 || !a2 || !m2) return 0
  return (a2 - a1) * 12 + (m2 - m1) + 1
}

export function FormGasto({
  accion,
  listas,
  periodoId,
  mesInicio,
  gasto,
  etiquetaEnvio,
}: {
  accion: (prev: EstadoGasto, formData: FormData) => Promise<EstadoGasto>
  listas: ListaOpcion[]
  periodoId?: string
  /** 'YYYY-MM' del mes al que se carga. Solo hace falta al crear. */
  mesInicio?: string
  gasto?: GastoExistente
  etiquetaEnvio: string
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoGasto, FormData>(accion, {})
  const [moneda, setMoneda] = useState<CurrencyCode>(gasto?.moneda ?? 'CRC')
  const [recurrente, setRecurrente] = useState(false)
  const [ultimoCobro, setUltimoCobro] = useState('')

  const editando = Boolean(gasto)
  const cobros = mesInicio && ultimoCobro ? cuantosCobros(mesInicio, ultimoCobro) : 0

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <OfflineBanner />
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      {gasto ? <input type="hidden" name="gastoId" value={gasto.id} /> : null}
      {periodoId ? <input type="hidden" name="periodoId" value={periodoId} /> : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="nombre" className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={gasto?.nombre ?? ''}
          placeholder="Electricidad ICE"
          maxLength={60}
          required
          autoFocus={!editando}
          className="min-h-touch border-borde bg-superficie-alta text-tinta
                     placeholder:text-tinta-suave focus:border-crc rounded-2xl border px-4
                     text-base outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="monto" className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Monto
        </label>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`text-2xl font-semibold ${moneda === 'CRC' ? 'text-crc' : 'text-usd'}`}
          >
            {moneda === 'CRC' ? '₡' : '$'}
          </span>
          <input
            id="monto"
            name="monto"
            defaultValue={gasto?.monto ?? ''}
            inputMode="decimal"
            placeholder={moneda === 'CRC' ? '38.400' : '15,99'}
            required
            className="min-h-touch border-borde bg-superficie-alta text-tinta
                       placeholder:text-tinta-suave focus:border-crc w-full rounded-2xl border
                       px-4 text-xl font-semibold outline-none"
          />
        </div>

        {/* La moneda de un gasto es inmutable: al editar se muestra, no se cambia. */}
        {editando ? (
          <>
            <input type="hidden" name="moneda" value={moneda} />
            <p className="text-tinta-suave text-sm">
              En {moneda === 'CRC' ? 'colones' : 'dólares'}. La moneda no se puede cambiar:
              si está mal, anulá el gasto y creá otro.
            </p>
          </>
        ) : (
          <fieldset className="flex gap-2">
            <legend className="sr-only">Moneda</legend>
            {(['CRC', 'USD'] as const).map((m) => (
              <label
                key={m}
                className={`min-h-touch flex flex-1 cursor-pointer items-center justify-center
                            rounded-2xl border text-base font-semibold ${
                              moneda === m
                                ? m === 'CRC'
                                  ? 'border-crc bg-crc-tenue text-crc'
                                  : 'border-usd bg-usd-tenue text-usd'
                                : 'border-borde text-tinta-suave'
                            }`}
              >
                <input
                  type="radio"
                  name="moneda"
                  value={m}
                  checked={moneda === m}
                  onChange={() => setMoneda(m)}
                  className="sr-only"
                />
                {m}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="listaId" className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Lista
        </label>
        <select
          id="listaId"
          name="listaId"
          defaultValue={gasto?.listaId ?? listas[0]?.id ?? ''}
          required
          className="min-h-touch border-borde bg-superficie-alta text-tinta focus:border-crc
                     rounded-2xl border px-4 text-base outline-none"
        >
          {listas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
        <p className="text-tinta-suave text-sm">
          Se reparte con los porcentajes de esa lista.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="fechaCobro" className="text-tinta-suave text-xs font-semibold tracking-wide uppercase">
          Fecha de cobro
        </label>
        <input
          id="fechaCobro"
          name="fechaCobro"
          type="date"
          defaultValue={gasto?.fechaCobro ?? ''}
          className="min-h-touch border-borde bg-superficie-alta text-tinta focus:border-crc
                     rounded-2xl border px-4 text-base outline-none"
        />
        <p className="text-tinta-suave text-sm">
          Opcional, y solo para vos: cuándo hay que pagarle al proveedor. Nadie abona un
          gasto suelto.
        </p>
      </div>

      {/* Editar una plantilla es otro flujo: acá solo al crear. */}
      {!editando ? (
        <div className="border-borde bg-superficie flex flex-col gap-3 rounded-2xl border p-4">
          <label className="min-h-touch flex cursor-pointer items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="text-tinta text-base font-medium">Es recurrente</span>
              <span className="text-tinta-suave text-sm">
                Se cobra todos los meses hasta que digás
              </span>
            </span>
            <input
              type="checkbox"
              name="recurrente"
              checked={recurrente}
              onChange={(e) => setRecurrente(e.target.checked)}
              className="accent-crc size-6 shrink-0"
            />
          </label>

          {recurrente ? (
            <div className="border-borde-suave flex flex-col gap-2 border-t pt-3">
              <label
                htmlFor="ultimoCobro"
                className="text-tinta-suave text-xs font-semibold tracking-wide uppercase"
              >
                Último cobro
              </label>
              <input
                id="ultimoCobro"
                name="ultimoCobro"
                type="month"
                min={mesInicio}
                value={ultimoCobro}
                onChange={(e) => setUltimoCobro(e.target.value)}
                className="min-h-touch border-borde bg-superficie-alta text-tinta
                           focus:border-crc rounded-2xl border px-4 text-base outline-none"
              />
              <p className="text-tinta-suave text-sm">
                Ese mes se cobra también. Después deja de aparecer.
              </p>

              {ultimoCobro && cobros > 0 ? (
                <>
                  <p className="text-tinta text-sm font-medium">
                    Se cobra {cobros} {cobros === 1 ? 'vez' : 'veces'}, contando este mes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUltimoCobro('')}
                    className="min-h-touch text-crc self-start text-base font-semibold"
                  >
                    Quitar la fecha final
                  </button>
                </>
              ) : (
                <p className="text-tinta text-sm font-medium">
                  Sin fecha final: se cobra todos los meses hasta que lo termines.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={pendiente}>
        {pendiente
          ? 'Guardando…'
          : recurrente
            ? 'Agregar gasto recurrente'
            : etiquetaEnvio}
      </Button>
    </form>
  )
}
