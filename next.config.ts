import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,

  allowedDevOrigins: [
    'prolonged-perjury-unlivable.ngrok-free.dev',
  ],

  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ]
  },
}

export default nextConfig