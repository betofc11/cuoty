'use client'

import { useActionState, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { OfflineBanner } from '@/components/ui/offline-banner'

import {
  enviarCodigo,
  entrarConGoogle,
  verificarCodigo,
  type EstadoCodigo,
  type EstadoLogin,
} from './actions'

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
  const [envio, accionEnviar, enviando] = useActionState<EstadoLogin, FormData>(
    enviarCodigo,
    {},
  )
  const [codigo, accionVerificar, verificando] = useActionState<EstadoCodigo, FormData>(
    verificarCodigo,
    {},
  )

  // Escotilla para el dedo que se equivocó al escribir el correo: sin esto, una
  // letra de más deja a la persona esperando un código que nunca va a llegar.
  const [otroCorreo, setOtroCorreo] = useState(false)
  const esperandoCodigo = Boolean(envio.enviadoA) && !otroCorreo

  // Controlado y no `defaultValue`: React 19 limpia los campos del formulario
  // después de correr la acción, así que ante cualquier error —el tope de envíos,
  // sobre todo— el correo recién escrito se borraba y había que tipearlo entero
  // otra vez en el teléfono. Un `defaultValue` nuevo no lo arregla: el input ya
  // está montado y React no le vuelve a mirar ese atributo.
  const [correo, setCorreo] = useState('')

  if (esperandoCodigo) {
    return (
      <div className="flex flex-col gap-6">
        <OfflineBanner />

        <Alert tono="ok">
          Te mandamos un código a{' '}
          {/* `break-all` además del `break-words` de Alert: un correo largo es
              una sola palabra sin espacios, y el punto final suelto al cortarse
              parecía un error de dedo — por eso tampoco lleva. */}
          <strong className="break-all">{envio.enviadoA}</strong>
        </Alert>

        {codigo.error ? <Alert tono="error">{codigo.error}</Alert> : null}
        {envio.error ? <Alert tono="error">{envio.error}</Alert> : null}

        <form action={accionVerificar} className="flex flex-col gap-4">
          <input type="hidden" name="correo" value={envio.enviadoA} />
          <Field
            id="codigo"
            name="codigo"
            label="El código del correo"
            // Con esto iOS ofrece el código sobre el teclado apenas llega el
            // correo: no hay que salir de la app ni acordarse del número.
            autoComplete="one-time-code"
            inputMode="numeric"
            // 10 y no 6: «Email OTP Length» se configura en Supabase entre 6 y
            // 10, y este proyecto la tiene en 8. Con `maxLength={6}` el campo
            // cortaba el código bueno y no dejaba entrar. Ni el largo ni el
            // texto de abajo dicen cuántos son: eso lo manda el panel, no el
            // código, y una cifra equivocada acá confunde más que ayudar.
            maxLength={10}
            required
            autoFocus
            className="text-center text-2xl font-semibold tracking-[0.5em]"
            hint="Si no llega en un par de minutos, revisá el correo no deseado."
          />
          <Button type="submit" disabled={verificando}>
            {verificando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <div className="flex flex-col gap-3">
          <form action={accionEnviar}>
            <input type="hidden" name="correo" value={envio.enviadoA} />
            <Button variante="secundario" type="submit" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Reenviar el código'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setOtroCorreo(true)}
            className="min-h-touch text-crc text-base font-semibold"
          >
            Usar otro correo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner />

      {errorInicial ? <Alert tono="error">{errorInicial}</Alert> : null}
      {envio.error ? <Alert tono="error">{envio.error}</Alert> : null}

      <form action={accionEnviar} className="flex flex-col gap-4">
        <Field
          id="correo"
          name="correo"
          type="email"
          label="Tu correo"
          placeholder="vos@ejemplo.com"
          autoComplete="email"
          inputMode="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          hint="Te mandamos un código para entrar. No hay contraseña que recordar, y si es tu primera vez la cuenta se crea sola."
        />
        <Button
          type="submit"
          disabled={enviando}
          // Vuelve al paso del código cuando termine este envío. Va en el botón
          // y no en un `onSubmit` del form para no pelear con el `action`.
          onClick={() => setOtroCorreo(false)}
        >
          {enviando ? 'Enviando…' : 'Enviarme el código'}
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
