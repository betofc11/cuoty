import { perfilActual } from '@/lib/auth/session'
import { contextoDeCasa } from '@/lib/casas/activa'

import { ID_ACCION_DE_PIE } from './accion-de-pie'
import { Navbar } from './navbar'
import { Tabs } from './tabs'

/**
 * El marco de las cuatro pestañas. Lo monta `app/(tabs)/layout.tsx`, así que
 * no se vuelve a pintar al cambiar de pestaña: solo cambia el `main`. Cuando
 * vivía dentro de cada página, el `loading.tsx` de la raíz lo reemplazaba
 * entero en cada toque y la barra de pestañas desaparecía mientras cargaba.
 *
 * Las barras van a todo el ancho y solo su contenido se limita a `max-w-app`:
 * en un iPhone más ancho que la columna, las barras cortadas dejaban franjas
 * del fondo a los costados.
 */
export async function Shell({ children }: { children: React.ReactNode }) {
  const { nombre } = await perfilActual()
  const { activa, casas } = await contextoDeCasa()

  // `contextoDeCasa` ya exigió el nombre, así que acá siempre hay algo. El `?`
  // es por si el perfil trae un nombre que empieza con algo raro.
  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar activa={activa} casas={casas} inicial={inicial || '?'} />

      <main className="max-w-app mx-auto w-full flex-1 px-4 py-5">{children}</main>

      {/* La acción de la página y las tabs comparten el sticky: si cada una
          lleva el suyo, la de abajo tapa a la de arriba en vez de apilarse. El
          `div` vacío lo llena `<AccionDePie>` desde la página que tenga una. */}
      <div className="border-borde bg-superficie-alta sticky bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)]">
        <div id={ID_ACCION_DE_PIE} />
        <Tabs />
      </div>
    </div>
  )
}
