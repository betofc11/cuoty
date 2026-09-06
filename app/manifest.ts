import type { MetadataRoute } from 'next'

/**
 * Se sirve en `/manifest.webmanifest` y Next inyecta solo el `<link rel="manifest">`.
 * Por eso `proxy.ts` deja esa ruta fuera del matcher: el manifest lo pide el
 * navegador sin cookies y pasarlo por el refresco de sesión no aporta nada.
 *
 * Es un archivo `.ts` y no un `.json` en `public/` para que `npm run typecheck`
 * agarre los errores — un manifest mal escrito no falla, solo deja de instalar.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Cuoty · finanzas compartidas del hogar',
    short_name: 'Cuoty',
    description: 'Finanzas compartidas del hogar y lista de compras.',
    lang: 'es-CR',
    dir: 'ltr',
    categories: ['finance', 'productivity', 'shopping'],

    // `standalone` es lo que hace que se abra sin barra de direcciones, como
    // una app. `scope` mantiene adentro toda navegación bajo "/": sin él, un
    // enlace externo abriría el navegador encima de la app instalada.
    display: 'standalone',
    start_url: '/',
    scope: '/',

    // Sin `orientation`: fijarla en portrait rompe WCAG 1.3.4 y el layout ya
    // aguanta landscape (va centrado a 390px).

    // `background_color` es el splash mientras carga: tiene que ser el mismo
    // `--fondo` del body o se ve un parpadeo de color al abrir.
    background_color: '#efe9e1',
    theme_color: '#efe9e1',

    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android recorta el ícono a la forma del launcher. El maskable trae el
      // margen de seguridad para que no le corte el logo.
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],

    // Atajos del menú largo sobre el ícono instalado.
    shortcuts: [
      { name: 'Anotar un gasto', short_name: 'Nuevo gasto', url: '/gastos/nuevo' },
      { name: 'Lista de compras', short_name: 'Compras', url: '/compras' },
      { name: 'Saldos de la casa', short_name: 'Saldos', url: '/saldos' },
    ],
  }
}
