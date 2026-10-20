import Link from 'next/link'

import { SaldoPar } from '@/components/dinero/saldo'
import { Avatar } from '@/components/ui/avatar'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
import { inicialDe, personasDeLaCasa, tonoDe } from '@/lib/casas/personas'
import { formatMoney, isZero } from '@/lib/money'
import { saldosDeLaCasa } from '@/lib/saldos/consultas'

async function nombreDelAdmin(): Promise<string> {
  const { supabase } = await requireUser()
  const { activa } = await contextoDeCasa()

  const { data } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('house_id', activa.id)
    .eq('role', 'admin')
    .is('left_at', null)
    .order('joined_at')
    .limit(1)
    .maybeSingle()

  if (!data) return 'quien administra la casa'

  const { data: perfil } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.user_id)
    .maybeSingle()

  return perfil?.display_name || 'quien administra la casa'
}

export default async function SaldosPage() {
  const { activa } = await contextoDeCasa()
  const [saldos, personas] = await Promise.all([saldosDeLaCasa(), personasDeLaCasa()])
  const esAdmin = activa.rol === 'admin'
  const admin = esAdmin ? null : await nombreDelAdmin()

  return (
    <div className="flex flex-col gap-5">
      <OfflineBanner />

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">
          {esAdmin ? 'Saldos de la casa' : 'Mi saldo'}
        </h1>
        <p className="text-tinta-suave text-base">
          {esAdmin
            ? 'Cuando un miembro te pasa la plata, lo registrás acá.'
            : `${admin} registra los abonos cuando le pasás la plata.`}
        </p>
      </header>

      {/* Una lista y no una tarjeta con dos botones por persona: en una casa de
          cinco eran diez botones grandes, y lo que se vino a ver (cuánto debe
          cada quien) quedaba chico entre ellos. La fila abre los movimientos. */}
      <ul className="border-borde bg-superficie divide-borde-suave divide-y rounded-2xl border">
        {saldos.map((s) => {
          const alDia = isZero(s.saldo.CRC) && isZero(s.saldo.USD)

          return (
            <li key={s.membershipId} className="flex items-stretch">
              {/* El saldo va en su propia línea y no a la derecha del nombre: con
                  «Abonar» al lado, en 390pt el nombre quedaba en 60px y se cortaba. */}
              <Link
                href={`/saldos/${s.membershipId}`}
                className="active:bg-superficie-alta flex min-w-0 flex-1 items-center gap-3 p-4"
              >
                <span className="self-start">
                  <Avatar
                    inicial={inicialDe(s.nombre)}
                    tono={tonoDe(personas, s.membershipId)}
                    tamano="grande"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* Sin `truncate`: un nombre largo pasa a dos líneas antes que
                      perder el apellido. */}
                  <span className="text-tinta text-base font-semibold break-words">
                    {s.nombre}
                    {s.esYo ? ' (vos)' : ''}
                  </span>
                  <SaldoPar par={s.saldo} tamano="normal" />
                  <span className="text-tinta-suave text-sm">
                    {isZero(s.cargo.CRC) && isZero(s.cargo.USD)
                      ? 'Sin cargos todavía'
                      : `Abonó ${formatMoney(s.abonado.CRC)} de ${formatMoney(s.cargo.CRC)}`}
                  </span>
                </span>
                <span aria-hidden="true" className="text-tinta-suave shrink-0 text-base">
                  ›
                </span>
              </Link>

              {/* Invariante 3: registrar abonos es exclusivo del admin.
                  Al miembro no se le muestra apagado — no existe. */}
              {esAdmin && !alDia ? (
                <Link
                  href={`/saldos/${s.membershipId}/abonar`}
                  aria-label={`Registrar un abono de ${s.nombre}`}
                  className="border-borde-suave active:bg-superficie-alta text-marca flex
                             min-h-touch shrink-0 items-center border-l px-4 text-base font-semibold"
                >
                  Abonar
                </Link>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
