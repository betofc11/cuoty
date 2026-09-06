import type { Metadata, Viewport } from 'next'

import { siteUrl } from '@/lib/site'
import { claseDeTema, temaActual, FONDO_CLARO, FONDO_OSCURO } from '@/lib/tema'

import { RegistrarServiceWorker } from './registrar-sw'

import './globals.css'

const NOMBRE = 'Cuoty'
const DESCRIPCION = 'Finanzas compartidas del hogar y lista de compras.'

export const metadata: Metadata = {
  // Vuelve absolutas las URLs relativas de abajo (Open Graph las exige así).
  metadataBase: new URL(siteUrl()),

  applicationName: NOMBRE,
  title: {
    default: 'Cuoty · finanzas compartidas del hogar',
    template: '%s · Cuoty',
  },
  description: DESCRIPCION,

  // El `<link rel="manifest">` NO va acá: lo inyecta `app/manifest.ts` por
  // convención de archivo. Declararlo también saca dos etiquetas.

  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  // iOS no lee el manifest: `display: standalone` no lo instala sin esto. Es lo
  // que hace que al abrirla desde la pantalla de inicio no salga Safari.
  appleWebApp: {
    capable: true,
    title: NOMBRE,
    // `default` deja que iOS pinte la barra de estado con el theme-color y
    // elija el color de texto legible — así sirve en claro y en oscuro. Con
    // `black-translucent` el texto queda blanco fijo, ilegible sobre #efe9e1.
    statusBarStyle: 'default',
  },

  // `appleWebApp.capable` solo emite `mobile-web-app-capable`, el nombre nuevo.
  // iOS 16.4+ ya lee `display: standalone` del manifest, pero abajo de esa
  // versión el único que abre en standalone es este. Sale junto al moderno,
  // así que Chrome no tira el aviso de obsoleto.
  other: { 'apple-mobile-web-app-capable': 'yes' },

  // La app está llena de montos. Sin esto Safari convierte cifras y fechas en
  // enlaces de teléfono y las pinta de azul.
  formatDetection: { telephone: false, date: false, address: false, email: false },

  openGraph: {
    type: 'website',
    siteName: NOMBRE,
    title: 'Cuoty · finanzas compartidas del hogar',
    description: DESCRIPCION,
    url: '/',
    locale: 'es_CR',
    images: [{ url: '/icons/icon-1024.png', width: 1024, height: 1024, alt: NOMBRE }],
  },

  // Es la app de una casa, no un sitio público: que no la indexe nadie.
  // Si algún día hay landing, esto se borra.
  robots: { index: false, follow: false },
}

export async function generateViewport(): Promise<Viewport> {
  const tema = await temaActual()

  return {
    width: 'device-width',
    initialScale: 1,
    // Sin maximumScale: nunca bloquear el zoom.

    // Instalada, la app ocupa la pantalla completa: sin `cover`, las variables
    // `env(safe-area-inset-*)` valen 0 y el `pb-[env(safe-area-inset-bottom)]` de
    // las tabs no hace nada — la barra inferior queda bajo el indicador de inicio.
    viewportFit: 'cover',

    // Si el usuario forzó un tema, el theme-color tiene que ser ese y no el del
    // sistema. Con el par de media queries, quien elige oscuro con el teléfono
    // en claro termina con la barra de estado clara sobre una app oscura.
    themeColor:
      tema === 'claro'
        ? FONDO_CLARO
        : tema === 'oscuro'
          ? FONDO_OSCURO
          : [
              { media: '(prefers-color-scheme: light)', color: FONDO_CLARO },
              { media: '(prefers-color-scheme: dark)', color: FONDO_OSCURO },
            ],
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = await temaActual()

  return (
    // La clase sale ya resuelta del servidor: no hay script que corrija el tema
    // después de pintar, así que no hay parpadeo al abrir.
    <html lang="es-CR" className={claseDeTema(tema)}>
      <body className="min-h-dvh antialiased">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  )
}
