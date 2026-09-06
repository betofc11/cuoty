import { cambiarTema } from '@/app/acciones/tema'
import type { Tema } from '@/lib/tema'

const OPCIONES: { valor: Tema; texto: string }[] = [
  { valor: 'sistema', texto: 'Sistema' },
  { valor: 'claro', texto: 'Claro' },
  { valor: 'oscuro', texto: 'Oscuro' },
]

/**
 * Server Component a propósito: los `<button name="tema" value="…">` mandan su
 * propio valor, así que no hace falta estado ni JavaScript. Funciona igual con
 * la conexión caída a medias, que es cuando más se agradece.
 */
export function SelectorTema({ actual }: { actual: Tema }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-tinta-suave text-sm font-semibold tracking-wide uppercase">
        Apariencia
      </h2>

      <form
        action={cambiarTema}
        role="group"
        aria-label="Tema"
        className="border-borde bg-superficie grid grid-cols-3 gap-1 rounded-2xl border p-1"
      >
        {OPCIONES.map((o) => {
          const activo = actual === o.valor
          return (
            <button
              key={o.valor}
              type="submit"
              name="tema"
              value={o.valor}
              aria-pressed={activo}
              className={`min-h-touch flex items-center justify-center rounded-xl text-base font-medium ${
                activo ? 'bg-superficie-alta text-tinta shadow-sm' : 'text-tinta-suave'
              }`}
            >
              {o.texto}
            </button>
          )
        })}
      </form>

      <p className="text-tinta-suave text-sm">
        «Sistema» sigue la configuración del teléfono y cambia solo de noche.
      </p>
    </section>
  )
}
