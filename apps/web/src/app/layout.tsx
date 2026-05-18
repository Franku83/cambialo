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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://cambialo.com'),
  title: {
    default: 'Cambialo — Smartphones Verificados en Venezuela',
    template: '%s | Cambialo',
  },
  description:
    'Compra y vende smartphones con verificación anti-fraude. La plataforma de confianza para el mercado de celulares en Venezuela.',
  keywords: ['smartphones', 'venezuela', 'compra venta', 'iphone', 'samsung', 'verificado'],
  authors: [{ name: 'Cambialo' }],
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    siteName: 'Cambialo',
  },
  twitter: {
    card: 'summary_large_image',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
