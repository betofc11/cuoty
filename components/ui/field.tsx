import type { ComponentProps } from 'react'

export function Field({
  label,
  hint,
  id,
  // Sale del spread a propósito: con `{...props}` después del `className` de
  // abajo, pasarle uno propio BORRABA los estilos base en vez de sumarse.
  className = '',
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string }) {
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-tinta text-base font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={`min-h-touch border-borde bg-superficie-alta text-tinta
                   placeholder:text-tinta-suave focus:border-crc rounded-2xl border
                   px-4 text-base outline-none ${className}`}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-tinta-suave text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
