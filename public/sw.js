/*
 * Service worker de Cuoty.
 *
 * Va en `public/` como JS plano y no como módulo del bundle: un service worker
 * lo pide el navegador directo desde la raíz del sitio, sin pasar por Next.
 *
 * Qué hace y qué NO hace, porque acá lo que se omite importa tanto:
 *
 *  - Estáticos (`/_next/static`, `/icons`): cache primero. Llevan hash en el
 *    nombre, así que nunca cambian de contenido y no hay que revalidarlos.
 *
 *  - Navegaciones: red primero, y si no hay red se sirve lo último guardado.
 *    Es lo que deja ver la lista de compras en el súper sin señal.
 *
 *  - NADA de Supabase, ni `/auth`, ni peticiones que no sean GET. Los datos y
 *    la sesión nunca se guardan acá.
 *
 *  - No hay escrituras sin conexión. Marcar algo como comprado necesita red a
 *    propósito: una cola de cambios que se sincroniza sola es otra función
 *    entera, y hacerla a medias significa que alguien tacha el pan, se va del
 *    súper y el resto de la casa nunca se enteró.
 *
 * El caché de páginas guarda HTML de sesión iniciada. Se borra entero al caer
 * en /login, que es el momento en que o se cerró sesión o nunca la hubo.
 */

const VERSION = 'v1'
const CACHE_ESTATICO = `cuoty-estatico-${VERSION}`
const CACHE_PAGINAS = `cuoty-paginas-${VERSION}`
const RESPALDO = '/offline'

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_PAGINAS)
      // `reload` evita que se guarde una copia vieja del propio navegador.
      await cache.add(new Request(RESPALDO, { cache: 'reload' }))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys()
      await Promise.all(
        nombres
          .filter((n) => n.startsWith('cuoty-') && !n.endsWith(VERSION))
          .map((n) => caches.delete(n)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (evento) => {
  if (evento.data?.tipo === 'limpiar-paginas') {
    evento.waitUntil(caches.delete(CACHE_PAGINAS))
  }
})

function esEstatico(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')
}

function seDebeIgnorar(peticion, url) {
  // Solo lo nuestro: Supabase y cualquier otro origen quedan fuera.
  if (url.origin !== self.location.origin) return true
  if (peticion.method !== 'GET') return true
  if (url.pathname.startsWith('/auth/')) return true

  // Las cargas parciales de React traen los mismos datos que el HTML pero con
  // otra forma. Guardarlas bajo la URL de la página la envenena.
  if (url.searchParams.has('_rsc')) return true
  if (peticion.headers.get('RSC') === '1') return true

  return false
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  const url = new URL(peticion.url)

  if (seDebeIgnorar(peticion, url)) return

  if (esEstatico(url)) {
    evento.respondWith(
      (async () => {
        const guardado = await caches.match(peticion)
        if (guardado) return guardado

        const respuesta = await fetch(peticion)
        if (respuesta.ok) {
          const cache = await caches.open(CACHE_ESTATICO)
          await cache.put(peticion, respuesta.clone())
        }
        return respuesta
      })(),
    )
    return
  }

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      (async () => {
        try {
          const respuesta = await fetch(peticion)

          // Solo se guarda un 200 propio. Un redirect al login guardado acá
          // dejaría al usuario dando vueltas sin poder entrar.
          if (respuesta.ok && respuesta.type === 'basic') {
            const cache = await caches.open(CACHE_PAGINAS)
            await cache.put(peticion, respuesta.clone())
          }
          return respuesta
        } catch {
          const guardado = await caches.match(peticion)
          if (guardado) return guardado

          const respaldo = await caches.match(RESPALDO)
          if (respaldo) return respaldo

          return new Response('Sin señal.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }
      })(),
    )
  }
})
