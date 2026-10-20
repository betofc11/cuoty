import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // El build falla si hay errores de tipo. No lo aflojes.
    ignoreBuildErrors: false,
  },
  // Sin esto, `next dev` le agrega a CLAUDE.md un bloque de reglas propio cada
  // vez que arranca. CLAUDE.md lo escribimos nosotros.
  agentRules: false,
}

export default nextConfig
