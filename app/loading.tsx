export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-4 p-4 py-5"
    >
      <span className="sr-only">Cargando…</span>
      <div className="bg-superficie h-14 animate-pulse rounded-2xl" />
      <div className="bg-superficie h-28 animate-pulse rounded-2xl" />
      <div className="bg-superficie h-28 animate-pulse rounded-2xl" />
    </div>
  )
}
