import { Logo } from '@/components/ui/logo'

export const metadata = { title: 'Sin señal' }

/**
 * Respaldo que sirve el service worker cuando no hay red y tampoco hay una
 * versión guardada de la página que se pidió.
 *
 * Es estática a propósito: no consulta nada, porque justamente se muestra
 * cuando no se puede consultar nada.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-6 p-4">
      <Logo />

      <div className="flex flex-col gap-2">
        <h1 className="text-tinta text-xl font-semibold">Sin señal</h1>
        <p className="text-tinta-suave text-base">
          No pudimos cargar esta pantalla. La lista de compras que ya habías abierto sí
          se puede ver sin conexión.
        </p>
      </div>

      <p className="text-tinta-suave text-base">
        Para anotar un gasto, marcar algo como comprado o registrar un abono hace falta
        señal: son cosas que el resto de la casa tiene que ver.
      </p>

      {/* Enlace normal y no un botón con JS: recargar es lo único que hay que
          poder hacer acá, y tiene que funcionar aunque el bundle no cargue. */}
      <a
        href="/compras"
        className="min-h-touch bg-crc flex items-center justify-center rounded-2xl px-5
                   text-base font-semibold text-white"
      >
        Ver la lista de compras
      </a>
      <a
        href="/"
        className="min-h-touch border-borde bg-superficie-alta text-tinta flex items-center
                   justify-center rounded-2xl border px-5 text-base font-semibold"
      >
        Reintentar
      </a>
    </div>
  )
}
