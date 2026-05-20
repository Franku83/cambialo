'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function Setup2FAPage() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Cambialo Admin' })
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Error al generar el QR.'); setLoading(false); return }
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setLoading(false)
      })
  }, [])

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return
    setVerifying(true)
    setError(null)
    const supabase = createClient()
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setError('Error al crear el desafío.'); setVerifying(false); return }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })

    setVerifying(false)
    if (verifyError) { setError('Código incorrecto. Intenta de nuevo.'); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )

  if (done) return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center space-y-4">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
      <h2 className="text-xl font-bold text-slate-900">2FA activado correctamente</h2>
      <p className="text-sm text-slate-500">Redirigiendo al dashboard...</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-sm px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <ShieldCheck className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="text-xl font-bold text-slate-900">Configura la verificación en dos pasos</h1>
        <p className="text-sm text-slate-500">
          Tu rol requiere 2FA. Escanea el código QR con Google Authenticator o Authy.
        </p>
      </div>

      {qrCode && (
        <div className="flex justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Image src={qrCode} alt="QR Code 2FA" width={192} height={192} unoptimized />
          </div>
        </div>
      )}

      {secret && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <p className="text-xs text-slate-500 mb-1">O ingresa la clave manual:</p>
          <code className="text-xs font-mono text-slate-700 break-all">{secret}</code>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Código de verificación</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-2xl font-mono tracking-widest text-slate-900 focus:border-green-500 focus:outline-none"
        />
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button
          onClick={() => void handleVerify()}
          disabled={verifying || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
          {verifying ? 'Verificando...' : 'Activar 2FA'}
        </button>
      </div>
    </div>
  )
}
