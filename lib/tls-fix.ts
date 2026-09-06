import tls from 'node:tls'

/**
 * Parche para un defecto de Node 26.3.0 (build de Homebrew).
 *
 * En esa versión el almacén de CAs POR DEFECTO no valida cadenas públicas:
 * `tls.connect()` sin `ca` falla con «unable to get local issuer certificate»
 * contra cualquier host, incluido example.com. Pero pasarle a mano exactamente
 * los mismos certificados que devuelve `tls.getCACertificates('default')` sí
 * valida. Mismo conjunto, resultado distinto: el store por defecto está mal
 * construido.
 *
 * Sin esto, TODA llamada del servidor a Supabase se cae —login, callback de
 * OAuth, cualquier consulta— con un error que parece de red y manda a buscar
 * proxies corporativos donde no los hay.
 *
 * NO afloja ninguna verificación: se reconstruye el mismo store con los mismos
 * certificados. El arreglo de fondo es cambiar de versión de Node; cuando eso
 * pase, borrá este archivo y su llamada en `instrumentation.ts`.
 *
 * Este módulo importa `node:tls`, así que solo puede cargarse desde el runtime
 * de Node. Vive aparte justamente para que el bundler no lo arrastre a Edge.
 */
export function arreglarAlmacenDeCAs(): void {
  const api = tls as unknown as {
    getCACertificates?: (t: string) => string[]
    setDefaultCACertificates?: (certs: string[]) => void
  }

  if (!api.getCACertificates || !api.setDefaultCACertificates) return

  try {
    api.setDefaultCACertificates([
      ...api.getCACertificates('bundled'),
      // Las que agregue el entorno vía NODE_EXTRA_CA_CERTS.
      ...api.getCACertificates('extra'),
    ])
  } catch (e) {
    console.warn('[cuoty] no se pudo reconstruir el almacén de CAs:', e)
  }
}
