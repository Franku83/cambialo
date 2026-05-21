'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry captures this automatically via instrumentation
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <span className="text-3xl">🔧</span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Algo salió mal
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Nuestro equipo ya fue notificado y está trabajando en esto.
            Puedes intentar de nuevo o volver al inicio.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Volver al inicio
          </a>
        </div>

        {/* Error code */}
        {error.digest && (
          <p className="text-xs text-slate-400">
            Código de error: <code className="font-mono text-slate-500">{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  )
}
