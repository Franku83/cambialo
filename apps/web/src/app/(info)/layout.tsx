import { Header } from '@/components/layout/Header'
import { Suspense } from 'react'
import Link from 'next/link'

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<header className="sticky top-0 z-40 border-b border-slate-200 bg-white h-14" />}>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-white">
        {children}
      </main>
      <footer className="border-t border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <Link href="/" className="text-lg font-bold text-green-600">Cambialo</Link>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <Link href="/explore" className="hover:text-slate-700">Explorar</Link>
              <Link href="/sell" className="hover:text-slate-700">Publicar</Link>
              <Link href="/safe-zones" className="hover:text-slate-700">Zonas seguras</Link>
              <Link href="/about" className="hover:text-slate-700">Quiénes somos</Link>
              <Link href="/faq" className="hover:text-slate-700">FAQ</Link>
              <Link href="/roadmap" className="hover:text-slate-700">Roadmap</Link>
            </div>
            <p className="text-xs text-slate-400">© 2026 Cambialo</p>
          </div>
        </div>
      </footer>
    </>
  )
}
