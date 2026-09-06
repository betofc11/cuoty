'use client'

import { useState } from 'react'

export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles: el código está a la vista igual.
      setCopiado(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="min-h-touch border-borde bg-superficie-alta text-tinta w-full rounded-2xl
                 border px-5 text-base font-semibold"
    >
      {copiado ? 'Copiado' : 'Copiar el código'}
    </button>
  )
}
