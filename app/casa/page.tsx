import { BackLink } from '@/components/ui/back-link'
import { Alert } from '@/components/ui/alert'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { colorDeCasa, inicialDeCasa } from '@/lib/casas/color'

import { CopiarCodigo } from './copiar-codigo'

export default async function CasaPage() {
  const { supabase, user } = await requireUser()
  const { activa } = await contextoDeCasa()

  const [{ data: casa }, { data: membresias }] = await Promise.all([
    supabase.from('houses').select('join_code').eq('id', activa.id).single(),
    supabase
      .from('memberships')
      .select('id, role, user_id, joined_at')
      .eq('house_id', activa.id)
      .is('left_at', null)
      .order('joined_at'),
  ])

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', (membresias ?? []).map((m) => m.user_id))

  const nombrePorId = new Map((perfiles ?? []).map((p) => [p.id, p.display_name]))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-6 p-4 py-5">
      <BackLink href="/">Volver</BackLink>

      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          style={{ backgroundColor: colorDeCasa(activa.id) }}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl
                     font-semibold text-white"
        >
          {inicialDeCasa(activa.nombre)}
        </span>
        <span className="flex min-w-0 flex-col">
          <h1 className="text-tinta truncate text-xl font-semibold">{activa.nombre}</h1>
          <span className="text-tinta-suave text-sm">
            {activa.rol === 'admin' ? 'Administrás esta casa' : 'Sos miembro'}
          </span>
        </span>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
          Código para entrar
        </h2>
        {casa ? (
          <>
            <p className="border-borde bg-superficie text-tinta rounded-2xl border p-5
                          text-center text-2xl font-semibold tracking-widest">
              {casa.join_code}
            </p>
            <CopiarCodigo codigo={casa.join_code} />
            <p className="text-tinta-suave text-sm">
              Quien tenga este código entra sin aprobación, y queda registrado abajo con
              la fecha. No expira.
            </p>
          </>
        ) : (
          <Alert tono="error">No pudimos leer el código de la casa.</Alert>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
          Quiénes están
        </h2>
        <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
          {(membresias ?? []).map((m) => {
            const nombre = nombrePorId.get(m.user_id) || 'Sin nombre'
            const soyYo = m.user_id === user.id

            return (
              <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                <span className="flex min-w-0 flex-col">
                  <span className="text-tinta truncate text-base font-medium">
                    {nombre}
                    {soyYo ? ' (vos)' : ''}
                  </span>
                  <span className="text-tinta-suave text-sm">
                    Entró el{' '}
                    {new Date(m.joined_at).toLocaleDateString('es-CR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'America/Costa_Rica',
                    })}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                    m.role === 'admin' ? 'bg-crc-tenue text-crc' : 'text-tinta-suave'
                  }`}
                >
                  {m.role === 'admin' ? 'Admin' : 'Miembro'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-tinta-suave text-sm">
        Cambiar el nombre, rotar el código y sacar miembros llegan más adelante.
      </p>
    </div>
  )
}
