import { unstable_isUnrecognizedActionError, unstable_rethrow } from 'next/navigation'

export type Aviso = { texto: string; recargar?: boolean }

/**
 * Qué decir cuando la llamada a una Server Action se cae. Los errores de la
 * base no llegan acá: las acciones los devuelven como `{ error }`. Lo que
 * llega es todo lo que pasa antes de que la acción corra, y no todo es falta
 * de señal:
 *
 * - Un redirect (la sesión venció y `requireUser` manda al login). Next ya
 *   está navegando: devuelve `null` para no pintar un aviso que dura un
 *   instante.
 * - Un deploy nuevo con la app abierta: el id de la acción ya no existe en el
 *   servidor y cada toque va a fallar igual hasta recargar. Reintentar no
 *   sirve, así que el aviso lo dice y trae el botón.
 * - El resto: sin red, un 5xx, una respuesta que no es de Next. `onLine` solo
 *   es confiable cuando dice false; en iOS da true con señal débil, así que
 *   el texto genérico no culpa a la señal.
 */
export function avisoDeFallo(e: unknown, verbo: string): Aviso | null {
  try {
    unstable_rethrow(e)
  } catch {
    return null
  }

  if (unstable_isUnrecognizedActionError(e)) {
    return { texto: 'Hay una versión nueva de Cuoty. Recargá para seguir.', recargar: true }
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { texto: `No se pudo ${verbo}: no hay señal. Probá de nuevo cuando vuelva.` }
  }
  return { texto: `No se pudo ${verbo}. Probá de nuevo; si sigue, recargá la página.` }
}
