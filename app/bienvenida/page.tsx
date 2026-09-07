import { redirect } from 'next/navigation'

import { FormNombre } from '@/components/perfil/form-nombre'
import { Logo } from '@/components/ui/logo'
import { perfilActual, requireUser } from '@/lib/auth/session'

export const metadata = { title: '¿Cómo te llamás?' }

/**
 * Primer paso de quien entra por correo: Google trae el nombre, el código no.
 * Sin esto la persona quedaba con el pedazo de su dirección —«eucerdas»— en la
 * lista de saldos de toda la casa.
 */
export default async function BienvenidaPage() {
  const { user } = await requireUser()
  const { nombre } = await perfilActual()

  // Ya tiene nombre: acá no pinta nada.
  if (nombre) redirect('/')

  return (
    <>
      <header className="flex flex-col gap-3">
        <Logo />
        <h1 className="text-tinta text-2xl font-semibold">¿Cómo te llamás?</h1>
        <p className="text-tinta-suave text-base">
          Es lo único que falta. Así te ven los demás en la casa: en los saldos y en
          cada abono que se registre.
        </p>
      </header>

      <FormNombre
        textoBoton="Continuar"
        seguir
        enfocar
        hint="Con el nombre de pila alcanza."
      />

      <footer className="border-borde flex items-center justify-between gap-3 border-t pt-4">
        <span className="text-tinta-suave truncate text-sm">{user.email}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="min-h-touch text-crc px-2 text-base font-semibold">
            Salir
          </button>
        </form>
      </footer>
    </>
  )
}
