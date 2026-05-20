import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://cambialo.app'),
  title: {
    default: 'Cambialo — Smartphones verificados en Venezuela',
    template: '%s | Cambialo',
  },
  description:
    'Compra y vende iPhones y Samsung verificados en Venezuela. Precios reales, identidad verificada, sin estafas. El marketplace de confianza.',
  keywords: [
    'smartphones venezuela',
    'iphone venezuela',
    'samsung venezuela',
    'comprar celular venezuela',
    'vender celular venezuela',
    'marketplace venezuela',
    'iphone usado venezuela',
    'cambialo',
    'celulares verificados venezuela',
  ],
  authors: [{ name: 'Cambialo' }],
  creator: 'Cambialo',
  publisher: 'Cambialo',
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    url: 'https://cambialo.app',
    siteName: 'Cambialo',
    title: 'Cambialo — Smartphones verificados en Venezuela',
    description: 'Compra y vende iPhones y Samsung verificados. Sin estafas, sin precios ocultos.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cambialo — Marketplace verificado de smartphones en Venezuela',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cambialo — Smartphones verificados en Venezuela',
    description: 'Compra y vende iPhones y Samsung verificados. Sin estafas, sin precios ocultos.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'YR7rcSnU_FGByckWNboyQMbQNXr_L2kNvjRRBSJHyLo',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cambialo',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cambialo',
  url: 'https://cambialo.app',
  logo: 'https://cambialo.app/icons/icon-512.png',
  description: 'Marketplace verificado de smartphones en Venezuela',
  foundingDate: '2026',
  areaServed: 'VE',
  sameAs: [] as string[],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
