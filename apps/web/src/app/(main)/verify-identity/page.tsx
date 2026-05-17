'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

type Step = 'intro' | 'document' | 'selfie' | 'review' | 'done'

interface UploadedFile {
  file: File
  preview: string
}

export default function VerifyIdentityPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [docFile, setDocFile] = useState<UploadedFile | null>(null)
  const [selfieFile, setSelfieFile] = useState<UploadedFile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: UploadedFile) => void,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10 MB')
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
    if (!docFile || !selfieFile) return
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('idDocument', docFile.file)
    formData.append('selfie', selfieFile.file)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/users/me/identity-verification`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        },
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Error al enviar los documentos')
      }

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'document', label: 'Documento' },
    { id: 'selfie', label: 'Selfie' },
    { id: 'review', label: 'Revisión' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">¡Documentos enviados!</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Revisaremos tu documentación en las próximas <strong className="text-white">24 horas</strong>.
            Te notificaremos cuando tu identidad esté verificada.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-8">
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-5">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Verifica tu identidad</h1>
          <p className="text-zinc-400 text-sm mb-6">
            La verificación de identidad aumenta la confianza de los compradores en tu perfil
            y te da acceso al badge <strong className="text-white">Identidad Verificada</strong>.
          </p>

          <div className="space-y-3 mb-8">
            {[
              { icon: '🪪', title: 'Cédula o pasaporte', desc: 'Foto clara del documento vigente' },
              { icon: '🤳', title: 'Selfie con documento', desc: 'Sostén el documento junto a tu cara' },
              { icon: '🔒', title: 'Datos seguros', desc: 'Los documentos se almacenan encriptados y solo los revisan moderadores' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('document')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Comenzar verificación
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < currentStepIndex
                    ? 'bg-green-600 text-white'
                    : i === currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs ${
                  i === currentStepIndex ? 'text-white font-medium' : 'text-zinc-500'
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-zinc-800" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 'document' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Foto del documento</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Sube una foto clara de tu <strong className="text-white">cédula de identidad o pasaporte</strong>.
              Asegúrate de que todos los datos sean legibles.
            </p>

            <div
              onClick={() => docInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors ${
                docFile
                  ? 'border-green-600/50'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {docFile ? (
                <div className="relative">
                  <img src={docFile.preview} alt="Documento" className="w-full aspect-video object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDocFile(null) }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Upload className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-zinc-300">Toca para subir foto</p>
                  <p className="text-xs text-zinc-600 mt-1">JPG o PNG, máximo 10 MB</p>
                </div>
              )}
            </div>

            <input
              ref={docInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setDocFile)}
            />

            <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-500 space-y-1">
              <p>✓ Documento en buen estado y vigente</p>
              <p>✓ Todos los datos visibles sin reflejos</p>
              <p>✓ Fondo claro y buena iluminación</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('intro')}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => docFile && setStep('selfie')}
                disabled={!docFile}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 'selfie' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Selfie con documento</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Tómate una foto sosteniendo tu documento de identidad junto a tu cara.
              Ambos deben ser claramente visibles.
            </p>

            <div
              onClick={() => selfieInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors ${
                selfieFile
                  ? 'border-green-600/50'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {selfieFile ? (
                <div className="relative">
                  <img src={selfieFile.preview} alt="Selfie" className="w-full aspect-square object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelfieFile(null) }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Camera className="w-10 h-10 text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-zinc-300">Toca para sacar foto</p>
                  <p className="text-xs text-zinc-600 mt-1">Usa la cámara frontal</p>
                </div>
              )}
            </div>

            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setSelfieFile)}
            />

            <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-500 space-y-1">
              <p>✓ Rostro completamente visible</p>
              <p>✓ Documento legible junto a tu cara</p>
              <p>✓ Buena iluminación, sin obstrucciones</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('document')}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => selfieFile && setStep('review')}
                disabled={!selfieFile}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 'review' && docFile && selfieFile && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Revisa antes de enviar</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Confirma que las fotos sean nítidas y los datos visibles.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Documento de identidad</p>
                <img
                  src={docFile.preview}
                  alt="Documento"
                  className="w-full aspect-video object-cover rounded-xl border border-zinc-800"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">Selfie con documento</p>
                <img
                  src={selfieFile.preview}
                  alt="Selfie"
                  className="w-full aspect-video object-cover rounded-xl border border-zinc-800"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-500 mb-6">
              🔒 Tus documentos se guardan encriptados. Solo moderadores de Cambialo
              tienen acceso para verificar tu identidad.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('selfie')}
                disabled={isSubmitting}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-40 rounded-xl text-sm transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar documentos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
