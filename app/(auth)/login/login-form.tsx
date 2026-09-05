'use client'

import { useActionState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { OfflineBanner } from '@/components/ui/offline-banner'

import { enviarEnlace, entrarConGoogle, type EstadoLogin } from './actions'

function IconoGoogle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  )
}

export function LoginForm({ errorInicial }: { errorInicial?: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoLogin, FormData>(
    enviarEnlace,
    {},
  )

  if (estado.enviadoA) {
    return (
      <div className="flex flex-col gap-6">
        <Alert tono="ok">
          Te mandamos un enlace a <strong>{estado.enviadoA}</strong>.
        </Alert>
        <p className="text-tinta-suave text-base">
          Abrilo desde este mismo teléfono. Si no llega en un par de minutos, revisá el
          correo no deseado.
        </p>
        <form action={accion}>
          <input type="hidden" name="correo" value={estado.enviadoA} />
          <Button variante="secundario" type="submit" disabled={pendiente}>
            {pendiente ? 'Enviando…' : 'Reenviar el enlace'}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner />

      {errorInicial ? <Alert tono="error">{errorInicial}</Alert> : null}
      {estado.error ? <Alert tono="error">{estado.error}</Alert> : null}

      <form action={accion} className="flex flex-col gap-4">
        <Field
          id="correo"
          name="correo"
          type="email"
          label="Tu correo"
          placeholder="vos@ejemplo.com"
          autoComplete="email"
          inputMode="email"
          required
          hint="Te mandamos un enlace para entrar. No hay contraseña que recordar."
        />
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Enviando…' : 'Enviarme el enlace'}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="bg-borde h-px flex-1" />
        <span className="text-tinta-suave text-sm">o</span>
        <span className="bg-borde h-px flex-1" />
      </div>

      <form action={entrarConGoogle}>
        <Button variante="secundario" type="submit">
          <IconoGoogle />
          Continuar con Google
        </Button>
      </form>
    </div>
  )
}
