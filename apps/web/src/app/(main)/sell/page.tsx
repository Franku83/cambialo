'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Search, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSellStore } from '@/store/sell.store'
import StepIndicator from '@/components/sell/StepIndicator'
import ConditionGuide from '@/components/sell/ConditionGuide'
import AccessoriesChecklist from '@/components/sell/AccessoriesChecklist'
import { PhotoUploader } from '@/components/sell/PhotoUploader'
import { cn, formatPrice } from '@/lib/utils'
import type { ListingCondition } from '@cambialo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const STEPS = [
  { label: 'Dispositivo' },
  { label: 'Condición' },
  { label: 'Precio' },
  { label: 'Fotos' },
  { label: 'Publicar' },
]

const STORAGE_OPTIONS = [64, 128, 256, 512, 1024]

// ─── Schemas Zod por paso ───────────────────────────────────────────────────

const step1Schema = z.object({
  deviceModelId: z.string().min(1, 'Selecciona un modelo'),
  storageGb: z.number({ required_error: 'Selecciona el almacenamiento' }).min(1),
  imeiLast4: z
    .string()
    .length(4, 'Deben ser exactamente 4 dígitos')
    .regex(/^\d{4}$/, 'Solo dígitos'),
})

const step2Schema = z.object({
  condition: z.enum(['mint', 'good', 'fair', 'poor'] as const, {
    required_error: 'Selecciona la condición del equipo',
  }),
  batteryHealth: z.number().min(0).max(100),
})

const step3Schema = z.object({
  priceUsd: z.number({ required_error: 'El precio es requerido' }).min(1, 'El precio mínimo es $1'),
  city: z.string().min(2, 'Ciudad requerida'),
})

type Step1Form = z.infer<typeof step1Schema>
type Step2Form = z.infer<typeof step2Schema>
type Step3Form = z.infer<typeof step3Schema>

interface DeviceModel {
  id: string
  brand: string
  modelName: string
  originalStorageOptions: number[]
}

// ─── Paso 1: Dispositivo ────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const { step1, updateStep1 } = useSellStore()
  const [query, setQuery] = useState(step1.modelName ?? '')
  const [models, setModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<DeviceModel | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      deviceModelId: step1.deviceModelId ?? '',
      storageGb: step1.storageGb ?? 128,
      imeiLast4: step1.imeiLast4 ?? '',
    },
  })

  const storageGb = watch('storageGb')

  const searchModels = useCallback(async (q: string) => {
    if (q.length < 2) return setModels([])
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/device-models?search=${encodeURIComponent(q)}&limit=10`)
      if (res.ok) setModels((await res.json()) as DeviceModel[])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void searchModels(query), 300)
    return () => clearTimeout(t)
  }, [query, searchModels])

  const selectModel = (m: DeviceModel) => {
    setSelected(m)
    setQuery(`${m.brand} ${m.modelName}`)
    setModels([])
    setValue('deviceModelId', m.id)
  }

  const onSubmit: (data: Step1Form) => Promise<void> = async (data) => {
    updateStep1({
      deviceModelId: data.deviceModelId,
      storageGb: data.storageGb,
      imeiLast4: data.imeiLast4,
      brand: selected?.brand ?? step1.brand ?? '',
      modelName: selected?.modelName ?? step1.modelName ?? '',
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Modelo del equipo <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: iPhone 14 Pro, Samsung S23..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
          )}
        </div>
        {models.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectModel(m)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                <span>{m.brand} {m.modelName}</span>
              </button>
            ))}
          </div>
        )}
        {errors.deviceModelId && (
          <p className="mt-1 text-xs text-red-400">{errors.deviceModelId.message}</p>
        )}
      </div>

      {/* Almacenamiento */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Almacenamiento <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(selected?.originalStorageOptions ?? STORAGE_OPTIONS).map((gb) => (
            <button
              key={gb}
              type="button"
              onClick={() => setValue('storageGb', gb)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                storageGb === gb
                  ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600',
              )}
            >
              {gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`}
            </button>
          ))}
        </div>
        {errors.storageGb && (
          <p className="mt-1 text-xs text-red-400">{errors.storageGb.message}</p>
        )}
      </div>

      {/* IMEI */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Últimos 4 dígitos del IMEI <span className="text-red-400">*</span>
        </label>
        <p className="mb-2 text-xs text-zinc-500">
          En tu teléfono: Ajustes → General → Información (o *#06#)
        </p>
        <input
          {...register('imeiLast4')}
          placeholder="Ej: 4589"
          maxLength={4}
          className="w-40 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 px-4 text-center text-lg font-mono text-zinc-100 outline-none focus:border-blue-500 tracking-widest"
        />
        {errors.imeiLast4 && (
          <p className="mt-1 text-xs text-red-400">{errors.imeiLast4.message}</p>
        )}
        <p className="mt-1 text-xs text-zinc-600">
          Solo los últimos 4 dígitos para privacidad
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Continuar
      </button>
    </form>
  )
}

// ─── Paso 2: Condición ──────────────────────────────────────────────────────

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { step2, updateStep2 } = useSellStore()
  const [condition, setCondition] = useState<ListingCondition | null>(
    (step2.condition as ListingCondition) ?? null,
  )
  const [battery, setBattery] = useState(step2.batteryHealth ?? 85)
  const [hasRepairs, setHasRepairs] = useState(step2.hasRepairs ?? false)
  const [repairDetails, setRepairDetails] = useState(step2.repairDetails ?? '')
  const [hasIcloud, setHasIcloud] = useState(step2.hasIcloudLock ?? false)
  const [hasGoogle, setHasGoogle] = useState(step2.hasGoogleLock ?? false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    if (!condition) return setError('Selecciona la condición del equipo')
    if (battery < 0 || battery > 100) return setError('La batería debe estar entre 0 y 100')
    setError(null)
    updateStep2({
      condition,
      batteryHealth: battery,
      hasRepairs,
      repairDetails,
      hasIcloudLock: hasIcloud,
      hasGoogleLock: hasGoogle,
      includesBox: step2.includesBox ?? false,
      includesCharger: step2.includesCharger ?? false,
      includesEarphones: step2.includesEarphones ?? false,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-300">
          Condición del equipo <span className="text-red-400">*</span>
        </p>
        <ConditionGuide value={condition} onChange={setCondition} />
        {error && !condition && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Batería */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Salud de la batería: <span className="text-white font-bold">{battery}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={battery}
          onChange={(e) => setBattery(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-600">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Encuéntralo en Ajustes → Batería → Estado de la batería
        </p>
      </div>

      {/* Reparaciones */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-200">¿Ha sido reparado?</p>
            <p className="text-xs text-zinc-500">Pantalla, batería, cámara, etc.</p>
          </div>
          <button
            type="button"
            onClick={() => setHasRepairs(!hasRepairs)}
            className={cn(
              'relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors',
              hasRepairs ? 'bg-blue-600' : 'bg-zinc-700',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                hasRepairs ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
        </div>
        {hasRepairs && (
          <textarea
            value={repairDetails}
            onChange={(e) => setRepairDetails(e.target.value)}
            placeholder="Describe qué fue reparado, dónde y cuándo..."
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500"
          />
        )}
      </div>

      {/* Locks */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-zinc-300">Estado de bloqueos</p>
        {[
          { label: 'iCloud Lock activo', hint: 'El equipo solicita Apple ID al encender', val: hasIcloud, set: setHasIcloud },
          { label: 'Google/FRP Lock activo', hint: 'El equipo solicita cuenta Google al restablecer', val: hasGoogle, set: setHasGoogle },
        ].map(({ label, hint, val, set }) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div>
              <p className="text-sm text-zinc-200">{label}</p>
              <p className="text-xs text-zinc-500">{hint}</p>
            </div>
            <button
              type="button"
              onClick={() => set(!val)}
              className={cn(
                'relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors',
                val ? 'bg-red-500' : 'bg-zinc-700',
              )}
            >
              <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200', val ? 'translate-x-4' : 'translate-x-0')} />
            </button>
          </div>
        ))}
      </div>

      {/* Accesorios */}
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-300">Accesorios incluidos</p>
        <AccessoriesChecklist
          includesBox={step2.includesBox ?? false}
          onBoxChange={(v) => updateStep2({ includesBox: v })}
          includesCharger={step2.includesCharger ?? false}
          onChargerChange={(v) => updateStep2({ includesCharger: v })}
          includesEarphones={step2.includesEarphones ?? false}
          onEarphonesChange={(v) => updateStep2({ includesEarphones: v })}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

// ─── Paso 3: Precio ─────────────────────────────────────────────────────────

function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { step3, updateStep3 } = useSellStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      priceUsd: step3.priceUsd ?? 0,
      city: step3.city ?? '',
    },
  })

  const priceUsd = watch('priceUsd')
  const acceptsOffers = step3.acceptsOffers ?? false
  const meetAtMall = step3.meetAtMall ?? true

  const onSubmit: (data: Step3Form) => Promise<void> = async (data) => {
    updateStep3({ ...data, acceptsOffers, meetAtMall })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Precio */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Precio en USD <span className="text-red-400">*</span>
        </label>
        <p className="mb-2 text-xs text-zinc-500">Precio fijo visible — sin "precio al privado"</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
          <input
            {...register('priceUsd', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min={1}
            placeholder="650"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-7 pr-4 text-lg font-bold text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
        {priceUsd > 0 && (
          <p className="mt-1 text-xs text-zinc-500">
            Mostrará: <span className="font-medium text-white">{formatPrice(priceUsd)}</span>
          </p>
        )}
        {errors.priceUsd && (
          <p className="mt-1 text-xs text-red-400">{errors.priceUsd.message}</p>
        )}
      </div>

      {/* Acepta ofertas */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-200">Acepta ofertas</p>
          <button
            type="button"
            onClick={() => updateStep3({ acceptsOffers: !acceptsOffers })}
            className={cn(
              'relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors',
              acceptsOffers ? 'bg-blue-600' : 'bg-zinc-700',
            )}
          >
            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200', acceptsOffers ? 'translate-x-4' : 'translate-x-0')} />
          </button>
        </div>
        {acceptsOffers && (
          <div className="mt-3">
            <label className="text-xs text-zinc-500">Oferta mínima ($)</label>
            <input
              type="number"
              value={step3.minOfferUsd ?? ''}
              onChange={(e) => updateStep3({ minOfferUsd: Number(e.target.value) })}
              placeholder="500"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Ciudad */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Ciudad <span className="text-red-400">*</span>
        </label>
        <input
          {...register('city')}
          placeholder="Ej: Caracas"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 px-4 text-sm text-zinc-100 outline-none focus:border-blue-500"
        />
        {errors.city && (
          <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>
        )}
      </div>

      {/* Encuentro en CC */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <p className="text-sm font-medium text-zinc-200">Disponible para encuentro en CC</p>
          <p className="text-xs text-zinc-500">Centro comercial o banco como punto seguro</p>
        </div>
        <button
          type="button"
          onClick={() => updateStep3({ meetAtMall: !meetAtMall })}
          className={cn(
            'relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors',
            meetAtMall ? 'bg-blue-600' : 'bg-zinc-700',
          )}
        >
          <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200', meetAtMall ? 'translate-x-4' : 'translate-x-0')} />
        </button>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 hover:text-white">
          Atrás
        </button>
        <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
          Continuar
        </button>
      </div>
    </form>
  )
}

// ─── Paso 4: Fotos + Verificación ───────────────────────────────────────────

function Step4({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { listingId, photos, step4, addPhoto, updatePhoto, removePhoto, setVerificationCode } = useSellStore()
  const [generatingCode, setGeneratingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Countdown del código
  useEffect(() => {
    if (!step4.verificationExpiresAt) return
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((step4.verificationExpiresAt!.getTime() - Date.now()) / 1000),
      )
      setTimeLeft(remaining)
      if (remaining === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [step4.verificationExpiresAt])

  const generateCode = async () => {
    if (!listingId) return
    setGeneratingCode(true)
    setCodeError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_URL}/api/v1/verification/${listingId}/generate-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) throw new Error('Error generando el código')
      const data = await res.json() as { code: string; expiresAt: string }
      setVerificationCode(data.code, new Date(data.expiresAt))
    } catch {
      setCodeError('No se pudo generar el código. Intenta de nuevo.')
    } finally {
      setGeneratingCode(false)
    }
  }

  const uploadedCount = photos.filter((p) => p.uploadedId && !p.error).length
  const hasVerificationPhoto = photos.some((p) => p.isVerification && p.uploadedId)
  const canContinue = uploadedCount >= 4 && hasVerificationPhoto

  const requiredPhotos = [
    { label: 'Parte delantera', hint: 'Pantalla apagada, bien iluminada' },
    { label: 'Parte trasera', hint: 'Cámara y logo visibles' },
    { label: 'Pantalla encendida', hint: 'Ajustes → Información del equipo (IMEI visible)' },
  ]

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-6">
      {/* Fotos estándar */}
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-300">
          Fotos requeridas (mínimo 3 + verificación)
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {requiredPhotos.map((rp, i) => (
            <PhotoUploader
              key={i}
              listingId={listingId ?? ''}
              label={rp.label}
              hint={rp.hint}
              isVerification={false}
              onUploaded={(data) => {
                const id = `photo-${i}-${Date.now()}`
                addPhoto({ id, file: new File([], ''), preview: data.cloudinaryUrl, isVerification: false, uploadedId: data.id, cloudinaryUrl: data.cloudinaryUrl, uploading: false })
              }}
              onRemoved={(photoId) => removePhoto(photoId)}
            />
          ))}
        </div>
      </div>

      {/* Código de verificación */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-600/5 p-5">
        <h3 className="mb-1 font-semibold text-white">Foto de verificación</h3>
        <p className="mb-4 text-sm text-zinc-400">
          Escribe el código en un papel y fotografía el equipo junto al papel.
          Esto demuestra que el equipo está en tus manos.
        </p>

        {step4.verificationCode ? (
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <span className="font-mono text-xl font-bold tracking-widest text-blue-400">
                {step4.verificationCode}
              </span>
              {timeLeft !== null && (
                <span className={cn('text-sm font-mono', timeLeft < 300 ? 'text-red-400' : 'text-zinc-400')}>
                  {formatTime(timeLeft)}
                </span>
              )}
            </div>
            {timeLeft === 0 && (
              <p className="mt-2 text-xs text-red-400">Código expirado — genera uno nuevo</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void generateCode()}
            disabled={generatingCode || !listingId}
            className="mb-4 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {generatingCode && <Loader2 className="h-4 w-4 animate-spin" />}
            Generar código de verificación
          </button>
        )}

        {codeError && <p className="mb-3 text-xs text-red-400">{codeError}</p>}

        {step4.verificationCode && (
          <PhotoUploader
            listingId={listingId ?? ''}
            label="Foto con código en papel"
            hint="Equipo sostenido junto al papel con el código escrito en LETRA IMPRENTA"
            isVerification={true}
            onUploaded={(data) => {
              const id = `verif-${Date.now()}`
              addPhoto({ id, file: new File([], ''), preview: data.cloudinaryUrl, isVerification: true, uploadedId: data.id, cloudinaryUrl: data.cloudinaryUrl, uploading: false })
            }}
            onRemoved={(photoId) => removePhoto(photoId)}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 hover:text-white">
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-40 hover:bg-blue-700"
        >
          Continuar {!canContinue && `(${uploadedCount}/3 fotos)`}
        </button>
      </div>
    </div>
  )
}

// ─── Paso 5: Preview + Submit ────────────────────────────────────────────────

function Step5({ onBack }: { onBack: () => void }) {
  const { step1, step2, step3, listingId } = useSellStore()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePublish = async () => {
    if (!listingId) return
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_URL}/api/v1/verification/${listingId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? 'Error al publicar')
      }
      router.push(`/listings/${listingId}?published=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  const conditionLabels: Record<string, string> = {
    mint: 'Nuevo', good: 'Buen estado', fair: 'Regular', poor: 'Con detalles',
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h3 className="font-semibold text-white">Resumen del listing</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Equipo</span>
            <span className="text-zinc-200">{step1.brand} {step1.modelName} {step1.storageGb}GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Condición</span>
            <span className="text-zinc-200">{conditionLabels[step2.condition ?? ''] ?? '–'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Batería</span>
            <span className="text-zinc-200">{step2.batteryHealth}%</span>
          </div>
          <div className="flex justify-between border-t border-zinc-800 pt-2">
            <span className="text-zinc-500">Precio</span>
            <span className="text-xl font-bold text-white">{formatPrice(step3.priceUsd ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Ciudad</span>
            <span className="text-zinc-200">{step3.city ?? '–'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500">
        Tu listing quedará en estado <strong className="text-white">Pendiente de verificación</strong>.
        Un moderador revisará tus fotos en máx. 2 horas y recibirás una notificación.
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={submitting} className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 disabled:opacity-40 hover:text-white">
          Atrás
        </button>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={submitting}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60 hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar a verificación
        </button>
      </div>
    </div>
  )
}

// ─── Page principal ──────────────────────────────────────────────────────────

export default function SellPage() {
  const { currentStep, nextStep, prevStep, step1, step2, step3, listingId, setListingId, reset } =
    useSellStore()
  const [creatingDraft, setCreatingDraft] = useState(false)

  // Crear el draft al terminar el paso 1
  const handleStep1Next = async () => {
    if (listingId) return nextStep() // ya existe el draft

    setCreatingDraft(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login?redirectTo=/sell'
        return
      }

      const res = await fetch(`${API_URL}/api/v1/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          deviceModelId: step1.deviceModelId,
          storageGb: step1.storageGb,
          imeiLast4: step1.imeiLast4,
          // Defaults for required fields — se actualizan en pasos siguientes
          priceUsd: 1,
          color: 'No especificado',
          batteryHealth: step2.batteryHealth ?? 85,
          condition: step2.condition ?? 'good',
        }),
      })

      if (!res.ok) throw new Error('Error creando borrador')
      const data = await res.json() as { id: string }
      setListingId(data.id)
      nextStep()
    } catch {
      // El error se muestra inline en el paso 1 si necesario
    } finally {
      setCreatingDraft(false)
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {currentStep === 1 && (
        <Step1 onNext={() => void handleStep1Next()} />
      )}
      {currentStep === 2 && (
        <Step2 onNext={nextStep} onBack={prevStep} />
      )}
      {currentStep === 3 && (
        <Step3 onNext={nextStep} onBack={prevStep} />
      )}
      {currentStep === 4 && (
        <Step4 onNext={nextStep} onBack={prevStep} />
      )}
      {currentStep === 5 && (
        <Step5 onBack={prevStep} />
      )}

      {creatingDraft && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-900 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-400">Creando borrador...</p>
          </div>
        </div>
      )}
    </div>
  )
}
