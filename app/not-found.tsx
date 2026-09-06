import Link from 'next/link'

export const metadata = { title: 'No encontramos eso' }

/**
 * Se ve, entre otros, al abrir un gasto o un item que alguien más borró desde
 * otro teléfono. Por eso el texto no acusa de haber escrito mal la dirección.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-tinta text-xl font-semibold">No encontramos eso</h1>
        <p className="text-tinta-suave text-base">
          Puede que lo hayan borrado desde otro teléfono, o que el enlace ya no sirva.
        </p>
      </div>

      <Link
        href="/"
        className="min-h-touch bg-crc flex items-center justify-center rounded-2xl px-5
                   text-base font-semibold text-white"
      >
        Ir al inicio
      </Link>
    </div>
  )
}
