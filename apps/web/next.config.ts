import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // ppr y reactCompiler solo disponibles en Next.js canary
  // experimental: { ppr: true, reactCompiler: true },
}

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
          },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/listings/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'listings',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 5, // 5 minutos
          },
        },
      },
    ],
  },
})(nextConfig)
