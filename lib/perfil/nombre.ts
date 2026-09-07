/**
 * Tope del nombre visible del perfil. Vive acá y no en la Server Action porque
 * un archivo `'use server'` solo puede exportar funciones async — el formulario
 * necesita el número para su `maxLength` y no puede sacarlo de allá.
 *
 * Tiene que seguir igual al `check` de `profiles` en la base: si se cambia uno,
 * se cambian los dos.
 */
export const LARGO_MAXIMO_NOMBRE = 60
