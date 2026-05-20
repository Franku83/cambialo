'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  Phone,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type KycStatus = 'loading' | 'none' | 'pending' | 'approved' | 'rejected'

interface UploadedFile {
  file: File
  preview: string
}

function KycPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const [loading, setLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState<KycStatus>('loading')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  
  // Wizard steps: 1 = Doc, 2 = Selfie, 3 = WhatsApp, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [docFile, setDocFile] = useState<UploadedFile | null>(null)
  const [selfieFile, setSelfieFile] = useState<UploadedFile | null>(null)
  const [phone, setPhone] = useState('+58')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const docInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const fetchKycStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirectTo=/kyc')
        return
      }

      const res = await fetch(`${API_URL}/api/v1/kyc/status`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Error al obtener el estado de verificación')
      }

      const data = await res.json() as { status: string; rejectionReason?: string }
      const statusStr = data.status as KycStatus
      setKycStatus(statusStr)
      if (statusStr === 'rejected' && data.rejectionReason) {
        setRejectionReason(data.rejectionReason)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red. Intenta de nuevo.')
      setKycStatus('none')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchKycStatus()
  }, [])

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: UploadedFile) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10 MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes (JPG, PNG)')
      return
    }

    setError(null)
    const preview = URL.createObjectURL(file)
    setter({ file, preview })
  }

  const handleSubmit = async () => {
    if (!docFile || !selfieFile) {
      setError('Por favor, sube todos los documentos requeridos.')
      return
    }
    if (!phone || phone.trim() === '' || phone === '+58') {
      setError('Por favor, ingresa un número de WhatsApp válido.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sesión expirada. Inicia sesión nuevamente.')
      }

      const formData = new FormData()
      formData.append('documentFront', docFile.file)
      formData.append('selfie', selfieFile.file)
      formData.append('whatsappNumber', phone.trim())

      const res = await fetch(`${API_URL}/api/v1/kyc/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message ?? 'Error al enviar la solicitud.')
      }

      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red al enviar documentos.')
    } finally {
      setSubmitting(false)
    }
  }

  const startVerification = () => {
    setKycStatus('none')
    setStep(1)
    setDocFile(null)
    setSelfieFile(null)
    setPhone('+58')
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-sm text-slate-500 font-medium">Verificando tu estado de identidad...</p>
      </div>
    )
  }

  if (kycStatus === 'approved') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <ShieldCheck className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">¡Ya estás verificado!</h1>
          <p className="text-slate-500 text-sm">
            Tu identidad ha sido confirmada con éxito. Ya cuentas con el badge verificado en tus listings.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98]"
        >
          Ir al Dashboard
        </button>
      </div>
    )
  }

  if (kycStatus === 'pending') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Tu solicitud está en revisión ⏳</h1>
          <p className="text-slate-500 text-sm">
            Estamos revisando tus documentos de identidad. Este proceso tarda típicamente menos de 4 horas.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full rounded-xl bg-slate-800 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-900 active:scale-[0.98]"
        >
          Volver al Dashboard
        </button>
      </div>
    )
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 font-display">Verificación Rechazada</h1>
          <p className="text-slate-600 text-sm bg-red-50 border border-red-100 rounded-xl p-4 mt-2">
            Motivo: {rejectionReason ?? 'Tus documentos no cumplen con los requisitos de legibilidad o validez.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={startVerification}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98]"
          >
            Reintentar verificación
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  // WIZARD FLOW (when kycStatus === 'none' or user clicked retry)
  const steps = [
    { label: 'Doc', active: step >= 1 },
    { label: 'Selfie', active: step >= 2 },
    { label: 'WA', active: step >= 3 },
    { label: 'Listo', active: step >= 4 },
  ]

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-8">
        
        {reason === 'listing_limit' && kycStatus === 'none' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold">Alcanzaste el límite de listings</strong>
              <p className="text-xs text-amber-700 mt-0.5">
                Verifica tu identidad para poder publicar hasta 10 listings y obtener el badge de vendedor verificado.
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar & Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">Verifica tu identidad</h1>
            <span className="text-xs font-semibold text-slate-400">Paso {step} de 4</span>
          </div>

          {/* Progress display: [●]──[●]──[○]──[○] */}
          <div className="flex items-center justify-between px-2">
            {steps.map((s, idx) => (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                      s.active
                        ? 'bg-green-600 border-green-600 text-white shadow-sm shadow-green-200'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    {s.active && idx < step - 1 ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wider ${
                      s.active ? 'text-green-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] -mt-5 mx-2 transition-all duration-300 ${
                      step > idx + 1 ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* STEP 1: FRONT DOCUMENT PHOTO */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-slate-900">Paso 1: Foto del documento (cédula/pasaporte)</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Sube una foto legible de la parte frontal de tu documento de identidad oficial.
              </p>
            </div>

            <div
              onClick={() => docInputRef.current?.click()}
              className={`group border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
                docFile
                  ? 'border-green-500 bg-green-50/20'
                  : 'border-slate-300 hover:border-green-500 hover:bg-slate-50/50'
              }`}
            >
              {docFile ? (
                <div className="relative aspect-video w-full bg-slate-100">
                  <img
                    src={docFile.preview}
                    alt="Vista previa del documento"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDocFile(null)
                    }}
                    className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Upload className="h-9 w-9 text-slate-400 group-hover:text-green-600 transition-colors mb-2.5" />
                  <p className="text-sm font-semibold text-slate-700">Toca para seleccionar foto</p>
                  <p className="text-xs text-slate-400 mt-1">Formatos JPG, PNG (máx. 10MB)</p>
                </div>
              )}
            </div>

            <input
              ref={docInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setDocFile)}
            />

            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                💡 <strong>Instrucciones:</strong> Asegúrate de que sea legible y sin brillo. Evita reflejos de luces y sombras pronunciadas sobre los datos.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!docFile}
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELFIE WITH DOCUMENT */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-slate-900">Paso 2: Selfie sosteniendo el documento</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Tómate una selfie de frente sosteniendo el mismo documento justo al lado de tu rostro.
              </p>
            </div>

            <div
              onClick={() => selfieInputRef.current?.click()}
              className={`group border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
                selfieFile
                  ? 'border-green-500 bg-green-50/20'
                  : 'border-slate-300 hover:border-green-500 hover:bg-slate-50/50'
              }`}
            >
              {selfieFile ? (
                <div className="relative aspect-video w-full bg-slate-100">
                  <img
                    src={selfieFile.preview}
                    alt="Vista previa del selfie"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelfieFile(null)
                    }}
                    className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Camera className="h-9 w-9 text-slate-400 group-hover:text-green-600 transition-colors mb-2.5" />
                  <p className="text-sm font-semibold text-slate-700">Toca para abrir cámara / subir selfie</p>
                  <p className="text-xs text-slate-400 mt-1">Usa buena iluminación natural</p>
                </div>
              )}
            </div>

            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setSelfieFile)}
            />

            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                🤳 <strong>Instrucciones:</strong> Sostén tu documento junto a tu cara sin tapar ninguna facción de tu rostro ni los datos de la identificación.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                disabled={!selfieFile}
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WHATSAPP NUMBER */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-slate-900">Paso 3: Número WhatsApp</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Ingresa tu número de contacto de WhatsApp para fines de comunicación y verificación del listing.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="whatsapp" className="text-xs font-semibold text-slate-500">
                Número de teléfono (con prefijo del país)
              </label>
              <div className="relative">
                <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="whatsapp"
                  type="tel"
                  placeholder="+58 412 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-green-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)] transition-all font-mono"
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 text-xs text-slate-500 leading-relaxed space-y-1">
              <p>✓ Prefijo internacional incluido (ej. +58 para Venezuela)</p>
              <p>✓ Solo números sin guiones, puntos ni espacios especiales</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                disabled={submitting || !phone || phone.trim() === '' || phone === '+58'}
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Solicitud
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-display">Tu solicitud está en revisión</h2>
              <p className="text-slate-500 text-sm leading-relaxed px-2">
                Hemos recibido tus datos con éxito. Recibirás una notificación en menos de 4 horas respecto al estado de tu verificación.
              </p>
            </div>

            <button
              onClick={() => {
                router.push('/dashboard')
                router.refresh()
              }}
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98]"
            >
              Ir al Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default function KycPageWrapper() {
  return (
    <Suspense>
      <KycPage />
    </Suspense>
  )
}
