import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white h-14" />
      }>
        <Header />
      </Suspense>
      <main>{children}</main>
    </>
  )
}
