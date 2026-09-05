/**
 * URL base de la app. La necesitan los enlaces de correo y el callback de
 * OAuth, que se arman en el servidor y tienen que ser absolutos.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}
