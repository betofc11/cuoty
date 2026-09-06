/**
 * Corre una vez al arrancar el servidor.
 *
 * La importación va DENTRO del `if`: `process.env.NEXT_RUNTIME` se reemplaza en
 * tiempo de build, así que en el bundle de Edge la rama entera se elimina y
 * `node:tls` no llega ahí. Con el guard afuera, el bundler la incluía igual y
 * el archivo fallaba completo.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { arreglarAlmacenDeCAs } = await import('./lib/tls-fix')
    arreglarAlmacenDeCAs()
  }
}
