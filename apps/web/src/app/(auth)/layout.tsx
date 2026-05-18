import React from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-green-600 tracking-tight">Cambialo</h1>
            <p className="mt-1 text-sm text-slate-500">Smartphones verificados en Venezuela</p>
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
