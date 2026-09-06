import Link from 'next/link'

import { SaldoPar } from '@/components/dinero/saldo'
import { Shell } from '@/components/shell/shell'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { requireUser } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'
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
  const saldos = await saldosDeLaCasa()
  const esAdmin = activa.rol === 'admin'
  const admin = esAdmin ? null : await nombreDelAdmin()

  return (
    <Shell>
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

        <ul className="flex flex-col gap-3">
          {saldos.map((s) => {
            const alDia = isZero(s.saldo.CRC) && isZero(s.saldo.USD)

            return (
              <li
                key={s.membershipId}
                className="border-borde bg-superficie flex flex-col gap-3 rounded-2xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-tinta truncate text-base font-semibold">
                      {s.nombre}
                      {s.esYo ? ' (vos)' : ''}
                    </span>
                    <span className="text-tinta-suave text-sm">
                      {isZero(s.cargo.CRC) && isZero(s.cargo.USD)
                        ? 'Sin cargos todavía'
                        : `Abonó ${formatMoney(s.abonado.CRC)} de ${formatMoney(s.cargo.CRC)}`}
                    </span>
                  </span>
                  <SaldoPar par={s.saldo} tamano="normal" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/saldos/${s.membershipId}`}
                    className="min-h-touch border-borde bg-superficie-alta text-tinta flex
                               flex-1 items-center justify-center rounded-2xl border px-4
                               text-base font-semibold"
                  >
                    Ver movimientos
                  </Link>

                  {/* Invariante 3: registrar abonos es exclusivo del admin.
                      Al miembro no se le muestra apagado — no existe. */}
                  {esAdmin && !alDia ? (
                    <Link
                      href={`/saldos/${s.membershipId}/abonar`}
                      className="min-h-touch bg-crc flex flex-1 items-center justify-center
                                 rounded-2xl px-4 text-base font-semibold text-white"
                    >
                      Registrar abono
                    </Link>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>

        {esAdmin ? (
          <p className="text-tinta-suave text-sm">
            Los miembros no registran abonos: solo ven su saldo y lo que ya les
            acreditaste.
          </p>
        ) : (
          <p className="text-tinta-suave text-sm">
            Podés ver cada abono que te registraron, con la fecha, el monto y quién lo
            anotó.
          </p>
        )}
      </div>
    </Shell>
  )
}
