'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

import { borrarFoto, registrarFoto } from '../acciones'

type FotoVista = { id: string; tipo: 'producto' | 'etiqueta'; url: string | null }

const MAXIMO = 5 * 1024 * 1024
const ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp']

function extension(tipo: string): string {
  if (tipo === 'image/png') return 'png'
  if (tipo === 'image/webp') return 'webp'
  return 'jpg'
}

export function Fotos({
  itemId,
  casaId,
  fotos,
}: {
  itemId: string
  casaId: string
  fotos: FotoVista[]
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [tipo, setTipo] = useState<'producto' | 'etiqueta'>('producto')
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function subir(archivo: File) {
    setError(null)

    if (!ACEPTADOS.includes(archivo.type)) {
      setError('Solo aceptamos JPG, PNG o WEBP. Si es una foto del iPhone, guardala como JPG.')
      return
    }
    if (archivo.size > MAXIMO) {
      setError('La foto pesa más de 5 MB. Sacale una con menos resolución.')
      return
    }

    setSubiendo(true)
    try {
      const supabase = createClient()

      // La primera carpeta ES la casa: la política de Storage lee de ahí
      // a quién pertenece el archivo. Cambiar este formato rompe el acceso.
      const ruta = `${casaId}/${itemId}/${crypto.randomUUID()}.${extension(archivo.type)}`

      const { error: errorSubida } = await supabase.storage
        .from('item-photos')
        .upload(ruta, archivo, { contentType: archivo.type })

      if (errorSubida) {
        setError(errorSubida.message)
        return
      }

      const resultado = await registrarFoto(itemId, ruta, tipo)
      if (resultado.error) {
        // La fila no entró: sacamos el archivo para no dejar basura.
        await supabase.storage.from('item-photos').remove([ruta])
        setError(resultado.error)
        return
      }

      router.refresh()
    } catch {
      setError('No pudimos subir la foto. Revisá tu señal e intentá de nuevo.')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-tinta text-base font-semibold">Fotos</h2>
      <p className="text-tinta-suave text-base">
        Sirven para que quien vaya al super sepa exactamente cuál es. La de la etiqueta es
        para leer la marca y el tamaño.
      </p>

      {fotos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {fotos.map((foto) => (
            <li key={foto.id} className="flex flex-col gap-1">
              {foto.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto.url}
                  alt={foto.tipo === 'etiqueta' ? 'Etiqueta del producto' : 'El producto'}
                  className="border-borde aspect-square w-full rounded-2xl border object-cover"
                />
              ) : (
                <span className="border-borde bg-superficie text-tinta-suave flex aspect-square
                                 w-full items-center justify-center rounded-2xl border text-sm">
                  No se pudo cargar
                </span>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-tinta-suave text-xs capitalize">{foto.tipo}</span>
                <form action={borrarFoto}>
                  <input type="hidden" name="fotoId" value={foto.id} />
                  <input type="hidden" name="itemId" value={itemId} />
                  <button
                    type="submit"
                    className="text-peligro min-h-touch -mr-2 px-2 text-sm font-semibold"
                  >
                    Quitar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <fieldset className="flex gap-2">
        <legend className="sr-only">Qué muestra la foto</legend>
        {(['producto', 'etiqueta'] as const).map((valor) => (
          <label
            key={valor}
            className={`min-h-touch flex flex-1 cursor-pointer items-center justify-center gap-2
                        rounded-2xl border text-base ${
                          tipo === valor
                            ? 'border-crc bg-crc-tenue text-crc font-semibold'
                            : 'border-borde text-tinta-suave'
                        }`}
          >
            <input
              type="radio"
              name="tipoFoto"
              value={valor}
              checked={tipo === valor}
              onChange={() => setTipo(valor)}
              className="sr-only"
            />
            {valor === 'producto' ? 'Del producto' : 'De la etiqueta'}
          </label>
        ))}
      </fieldset>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) void subir(archivo)
        }}
      />

      <button
        type="button"
        disabled={subiendo}
        onClick={() => inputRef.current?.click()}
        className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                   justify-center rounded-2xl border px-4 text-base font-semibold disabled:opacity-60"
      >
        {subiendo ? 'Subiendo…' : 'Agregar foto'}
      </button>

      {error ? <Alert tono="error">{error}</Alert> : null}
    </section>
  )
}
