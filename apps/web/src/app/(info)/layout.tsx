import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Suspense } from 'react'

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<header className="sticky top-0 z-40 border-b border-slate-200 bg-white h-14" />}>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-white">
        {children}
      </main>
      <Footer />
    </>
  )
}
