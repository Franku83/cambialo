import React from 'react'

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Publicar equipo</h1>
          <p className="text-slate-500 text-sm">
            Completa todos los pasos para publicar tu equipo en el marketplace
          </p>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
