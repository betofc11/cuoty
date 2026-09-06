/**
 * URL base de la app. La necesitan los enlaces de correo y el callback de
 * OAuth, que se arman en el servidor y tienen que ser absolutos.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  // Red de seguridad en Vercel si alguien olvida la variable de arriba. El
  // dominio de producción primero: `VERCEL_URL` es el de ESTE deploy y cambia
  // en cada push, así que nunca va a estar en las Redirect URLs de Supabase.
  const produccion = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (produccion) return `https://${produccion}`

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}
