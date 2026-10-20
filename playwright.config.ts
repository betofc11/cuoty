import { defineConfig } from '@playwright/test'

/*
 * Pruebas de punta a punta: la app de verdad, compilada como en producción,
 * contra un Supabase falso que vive en memoria (`tests/e2e/falso/`). No tocan
 * el proyecto real ni usuarios reales.
 *
 * El build lleva la URL del falso adentro (las `NEXT_PUBLIC_*` se escriben en
 * el bundle al compilar), así que después de correr esto hay que volver a
 * compilar antes de un `next start` contra Supabase de verdad. Vercel compila
 * por su cuenta y no se entera.
 *
 * Un solo worker: el falso es uno solo y cada prueba lo reinicia.
 */

const SUPABASE = 'http://localhost:54399'
const APP = 'http://localhost:3100'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: APP,
    // El iPhone de referencia (390×844), con toques en vez de clics.
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'es-CR',
    timezoneId: 'America/Costa_Rica',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'iphone', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'node tests/e2e/falso/supabase.mjs',
      url: `${SUPABASE}/__tabla/houses`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx next build && npx next start -p 3100',
      url: `${APP}/login`,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: SUPABASE,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'clave-de-prueba',
        NEXT_PUBLIC_SITE_URL: APP,
      },
    },
  ],
})
