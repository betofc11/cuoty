import { notFound } from 'next/navigation'

import { BackLink } from '@/components/ui/back-link'
import { contextoDeCasa } from '@/lib/casas/activa'
import { detalleDeSaldo } from '@/lib/saldos/consultas'

import { FormAbono } from './form-abono'

export default async function AbonarPage({
  params,
}: {
  params: Promise<{ membershipId: string }>
}) {
  const { membershipId } = await params
  const { activa } = await contextoDeCasa()

  // Invariante 3: el miembro no tiene ninguna acción de pago, ni siquiera por URL.
  if (activa.rol !== 'admin') notFound()

  const detalle = await detalleDeSaldo(membershipId)
  if (!detalle) notFound()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col gap-5 p-4 py-5">
      <BackLink href={`/saldos/${membershipId}`}>Volver</BackLink>

      <header className="flex flex-col gap-1">
        <h1 className="text-tinta text-xl font-semibold">Abono de {detalle.nombre}</h1>
        <p className="text-tinta-suave text-base">
          Se acredita a su saldo total, no a un mes ni a un gasto.
        </p>
      </header>

      <FormAbono
        membershipId={detalle.membershipId}
        nombre={detalle.nombre}
        saldo={detalle.saldo}
        porMes={detalle.porMes.map((m) => ({
          periodoId: m.periodoId,
          mes: m.mes,
          saldo: m.saldo,
        }))}
      />
    </div>
  )
}
