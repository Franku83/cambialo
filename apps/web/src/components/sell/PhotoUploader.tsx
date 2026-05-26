'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const MAX_DIMENSION = 1200
const MAX_SIZE_MB = 10

interface PhotoUploaderProps {
  listingId: string
  label: string
  hint?: string
  isVerification?: boolean
  onUploaded: (data: {
    id: string
    cloudinaryUrl: string
    width: number | null
    height: number | null
  }) => void
  onRemoved?: (photoId: string) => void
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

export function PhotoUploader({
  listingId,
  label,
  hint,
  isVerification = false,
  onUploaded,
  onRemoved,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${MAX_SIZE_MB} MB`)
      return
    }

    setError(null)
    setStatus('compressing')
    setProgress(10)
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      const compressed = await compressImage(file)
      setStatus('uploading')
      setProgress(40)

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No hay sesión activa')

      const formData = new FormData()
      formData.append('photo', new File([compressed], file.name, { type: 'image/jpeg' }))

      const res = await fetch(
        `${API_URL}/api/v1/listings/${listingId}/photos?isVerification=${isVerification}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        },
      )

      setProgress(90)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? 'Error al subir la foto')
      }

      const data = await res.json() as { id: string; cloudinaryUrl: string; width: number | null; height: number | null }
      setUploadedId(data.id)
      setStatus('done')
      setProgress(100)
      onUploaded(data)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setProgress(0)
    }
  }

  const handleRemove = async () => {
    if (uploadedId && onRemoved) {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(`${API_URL}/api/v1/listings/${listingId}/photos/${uploadedId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => null)
      }
      onRemoved(uploadedId)
    }
    setPreview(null)
    setUploadedId(null)
    setStatus('idle')
    setError(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isLoading = status === 'compressing' || status === 'uploading'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {status === 'done' && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" /> Subida
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}

      <div
        className={cn(
          'relative rounded-xl border-2 transition-colors overflow-hidden bg-white',
          status === 'done'
            ? 'border-emerald-600/40'
            : status === 'error'
            ? 'border-red-500/40'
            : 'border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/30',
        )}
      >
        {preview ? (
          <div className="relative aspect-[4/3]">
            <Image src={preview} alt={label} fill className="object-cover" />

            {/* Progress overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-300">
                  {status === 'compressing' ? 'Comprimiendo...' : 'Subiendo...'}
                </p>
              </div>
            )}

            {/* Remove button */}
            {!isLoading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 py-8 text-slate-400 hover:text-slate-500"
          >
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="text-sm font-medium">Toca para subir</span>
            <span className="text-xs text-slate-400">JPG · PNG · máx. {MAX_SIZE_MB} MB</span>
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={isVerification ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}
