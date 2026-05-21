'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
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

  const handleVerify = useCallback(async (verifyCode: string) => {
    if (!factorId || verifyCode.length !== 6 || verifying) return
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
      code: verifyCode,
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
  }, [factorId, verifying, attempts, next, router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Icon + Title */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <ShieldCheck className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Verificación en dos pasos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Abre tu app de autenticación e ingresa el código de 6 dígitos.
          </p>
        </div>
      </div>

      {/* Code input */}
      <div className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setCode(val)
            if (val.length === 6) void handleVerify(val)
          }}
          placeholder="000000"
          autoFocus
          disabled={verifying}
          style={{
            fontSize: '32px',
            letterSpacing: '12px',
            fontVariantNumeric: 'tabular-nums',
          }}
          className="w-full rounded-xl border-2 border-slate-200 bg-white py-4 text-center font-bold text-slate-900 transition-colors focus:border-green-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)] disabled:opacity-50"
        />

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-red-600 font-medium">{error}</p>
        )}

        {/* Last attempt warning */}
        {attempts >= 2 && (
          <p className="text-center text-xs text-amber-600 font-medium">
            ⚠️ Último intento disponible. Si falla, tu sesión se cerrará.
          </p>
        )}

        {/* Verify button */}
        <button
          onClick={() => void handleVerify(code)}
          disabled={verifying || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
          {verifying ? 'Verificando...' : 'Verificar'}
        </button>

        {/* Sign out link */}
        <button
          onClick={() => void handleSignOut()}
          className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Usar otra cuenta
        </button>
      </div>
    </div>
  )
}

export default function Verify2FAPageWrapper() {
  return <Suspense><Verify2FAPage /></Suspense>
}
