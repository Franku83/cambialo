import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/kyc/',
          '/setup-2fa/',
          '/verify-2fa/',
          '/register/complete/',
          '/profile/edit/',
          '/sell/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://cambialo.app/sitemap.xml',
  }
}
