import { fondoDeTono, tonoDeEtiqueta } from '@/lib/compras/tonos'

const base = 'shrink-0 rounded-md px-[7px] py-1 text-xs leading-none font-semibold'

/** La etiqueta lleva color propio; el tono viene armado desde la consulta. */
export function BadgeEtiqueta({ tono, nombre }: { tono: number; nombre: string }) {
  const color = tonoDeEtiqueta(tono)

  return (
    <span className={base} style={{ color, backgroundColor: fondoDeTono(color) }}>
      {nombre}
    </span>
  )
}

/**
 * La tienda va siempre en neutro. Es a propósito: si compitiera en color
 * con las etiquetas, la fila se volvería un semáforo y ninguno de los dos
 * se leería.
 */
export function BadgeTienda({ nombre }: { nombre: string }) {
  return <span className={`${base} bg-borde-suave text-tinta-suave`}>{nombre}</span>
}
