import type { ComponentProps } from 'react'

type Variante = 'primario' | 'secundario'

const base =
  'min-h-touch flex w-full items-center justify-center gap-2 rounded-2xl px-5 ' +
  'text-base font-semibold transition disabled:opacity-60'

const variantes: Record<Variante, string> = {
  primario: 'bg-crc text-white active:brightness-95',
  secundario: 'border-borde bg-superficie-alta text-tinta border active:brightness-95',
}

export function Button({
  variante = 'primario',
  className = '',
  ...props
}: ComponentProps<'button'> & { variante?: Variante }) {
  return <button className={`${base} ${variantes[variante]} ${className}`} {...props} />
}
