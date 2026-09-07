/**
 * Supabase devuelve los errores de auth en inglés y con jerga. Acá se traducen
 * a algo que un miembro de la casa pueda entender.
 */
export function mensajeDeAuth(bruto: string): string {
  const m = bruto.toLowerCase()

  // «For security purposes, you can only request this after 47 seconds.» Es la
  // espera obligatoria entre dos envíos, no un castigo por insistir: merece un
  // mensaje distinto al del tope por hora.
  if (m.includes('for security purposes') || m.includes('only request this after')) {
    return 'Acabamos de mandarte uno. Esperá unos segundos y volvé a pedirlo.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Probaste muchas veces seguidas. Esperá un momento y volvé a intentar.'
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Google todavía no está habilitado en este proyecto.'
  }
  // Supabase manda el mismo «Token has expired or is invalid» para el código mal
  // escrito y para el vencido, a propósito: distinguirlos le diría a quien está
  // probando al azar cuándo acertó el código pero llegó tarde. Un solo mensaje
  // tiene que cubrir los dos.
  if (
    m.includes('expired') ||
    m.includes('otp_expired') ||
    (m.includes('invalid') && (m.includes('token') || m.includes('otp')))
  ) {
    return 'Ese código no sirve. Puede estar mal escrito o ya vencido: pedí uno nuevo.'
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
