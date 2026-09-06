'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-5 p-6">
      <h1 className="text-tinta text-xl font-semibold">No se pudo cargar</h1>
      <p className="text-tinta-suave text-base">
        Puede ser la señal. Probá de nuevo; si sigue igual, salí y volvé a entrar.
      </p>
      <button
        type="button"
        onClick={reset}
        className="min-h-touch bg-crc w-full rounded-2xl px-5 text-base font-semibold text-white"
      >
        Reintentar
      </button>
    </div>
  )
}
