/**
 * Supabase devuelve los errores de auth en inglés y con jerga. Acá se traducen
 * a algo que un miembro de la casa pueda entender.
 */
export function mensajeDeAuth(bruto: string): string {
  const m = bruto.toLowerCase()

  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Probaste muchas veces seguidas. Esperá un momento y volvé a intentar.'
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Google todavía no está habilitado en este proyecto.'
  }
  if (m.includes('expired') || m.includes('otp_expired')) {
    return 'El enlace ya venció. Pedí uno nuevo.'
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Ese correo no parece válido.'
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return 'Este proyecto no está aceptando cuentas nuevas.'
  }
  if (m.includes('fetch') || m.includes('network')) {
    return 'No pudimos conectarnos. Revisá tu señal e intentá de nuevo.'
  }

  return 'No se pudo completar. Intentá de nuevo.'
}
