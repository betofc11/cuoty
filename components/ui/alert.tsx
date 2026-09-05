type Tono = 'error' | 'ok' | 'aviso'

const tonos: Record<Tono, string> = {
  error: 'border-peligro/40 bg-peligro/10 text-peligro',
  ok: 'border-ok/40 bg-ok/10 text-ok',
  aviso: 'border-borde bg-superficie text-tinta-suave',
}

export function Alert({ tono = 'aviso', children }: { tono?: Tono; children: React.ReactNode }) {
  return (
    <p role={tono === 'error' ? 'alert' : 'status'} className={`rounded-2xl border p-4 text-base ${tonos[tono]}`}>
      {children}
    </p>
  )
}
