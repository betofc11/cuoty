import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Cuoty',
  description: 'Finanzas compartidas del hogar y lista de compras.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Sin maximumScale: nunca bloquear el zoom.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#efe9e1' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1613' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
