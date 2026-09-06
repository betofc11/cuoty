/** Falla temprano y con un mensaje claro si falta configuración. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copiá .env.example a .env.local y llenalo.`,
    )
  }
  return value
}

/*
 * Son funciones, no constantes, a propósito. Como constantes, la validación
 * corría al evaluar el módulo, y el build de Next evalúa cada ruta para leer su
 * configuración: sin las variables presentes, `next build` reventaba antes de
 * compilar nada. Como funciones, el error aparece cuando alguien de verdad
 * pide un cliente.
 *
 * La referencia literal a `process.env.NEXT_PUBLIC_*` tiene que quedarse acá
 * escrita completa: es lo que Next reemplaza por el valor al compilar el bundle
 * del browser. Con `process.env[nombre]` deja de funcionar.
 */

export function supabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

export function supabasePublishableKey(): string {
  return required(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
