import { FormNombre } from '@/components/perfil/form-nombre'
import { BackLink } from '@/components/ui/back-link'
import { SelectorTema } from '@/components/ui/selector-tema'
import { misCasas, perfilActual, requireUser } from '@/lib/auth/session'
import { colorDeCasa, inicialDeCasa } from '@/lib/casas/color'
import { temaActual } from '@/lib/tema'

export default async function CuentaPage() {
  const { user } = await requireUser()
  const { nombre } = await perfilActual()
  const casas = await misCasas()
  const tema = await temaActual()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/">Volver</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">{nombre || 'Mi cuenta'}</h1>
        <p className="text-tinta-suave text-base break-all">{user.email}</p>
      </header>

      {/* Vale para todos, no solo para quien entró por correo: el que viene de
          Google trae el nombre de la cuenta de Google y puede no ser el que
          quiere que le vean en la casa. */}
      <section className="flex flex-col gap-3">
        {/* «Perfil» y no «Tu nombre»: el campo de abajo ya se llama así y la
            palabra repetida dos veces seguidas se lee como un error. */}
        <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
          Perfil
        </h2>
        <FormNombre
          valorInicial={nombre}
          textoBoton="Guardar"
          hint="Así te ven los demás en la casa: en los saldos y en cada abono."
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
          {casas.length === 1 ? 'Mi casa' : 'Mis casas'}
        </h2>
        <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
          {casas.map((casa) => (
            <li key={casa.id} className="flex items-center gap-3 p-4">
              <span
                aria-hidden="true"
                style={{ backgroundColor: colorDeCasa(casa.id) }}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl
                           text-base font-semibold text-white"
              >
                {inicialDeCasa(casa.nombre)}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-tinta truncate text-base font-medium">
                  {casa.nombre}
                </span>
                <span className="text-tinta-suave text-sm">
                  {casa.rol === 'admin' ? 'Administrás esta casa' : 'Sos miembro'}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-tinta-suave text-sm">
          El rol es por casa: podés ser admin en una y miembro en otra.
        </p>
      </section>

      <SelectorTema actual={tema} />

      <form action="/auth/signout" method="post" className="mt-auto">
        <button
          type="submit"
          className="min-h-touch border-borde bg-superficie-alta text-peligro w-full
                     rounded-2xl border px-5 text-base font-semibold"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}
