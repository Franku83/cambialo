'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2 } from 'lucide-react'

function Verify2FAPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.find((f) => f.status === 'verified')
      if (totp) setFactorId(totp.id)
      setLoading(false)
    })
  }, [])

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return
    setVerifying(true)
    setError(null)

    const supabase = createClient()
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeErr || !challenge) {
      setError('Error al crear el desafío. Intenta de nuevo.')
      setVerifying(false)
      return
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })

    setVerifying(false)

    if (verifyErr) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 3) {
        await supabase.auth.signOut()
        router.push('/login?error=too_many_attempts')
        return
      }
      setError(`Código incorrecto. ${3 - newAttempts} intento(s) restante(s).`)
      setCode('')
      return
    }

    router.push(next)
    router.refresh()
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )

  return (
    <div className="mx-auto max-w-sm px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <ShieldCheck className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="text-xl font-bold text-slate-900">Verificación en dos pasos</h1>
        <p className="text-sm text-slate-500">
          Abre tu app de autenticación y escribe el código de 6 dígitos.
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          autoFocus
          className="w-full rounded-xl border border-slate-200 bg-white py-4 text-center text-3xl font-mono tracking-widest text-slate-900 focus:border-green-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
        />
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button
          onClick={() => void handleVerify()}
          disabled={verifying || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
          {verifying ? 'Verificando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

export default function Verify2FAPageWrapper() {
  return <Suspense><Verify2FAPage /></Suspense>
}
