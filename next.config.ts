import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // El build falla si hay errores de tipo. No lo aflojes.
    ignoreBuildErrors: false,
  },
}

export default nextConfig
