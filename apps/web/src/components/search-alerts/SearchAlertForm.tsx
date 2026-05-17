'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

const schema = z.object({
  brand: z.enum(['Apple', 'Samsung'], { required_error: 'Selecciona una marca' }),
  modelName: z.string().optional(),
  maxPriceUsd: z.coerce.number().positive().optional(),
  minBattery: z.coerce.number().min(0).max(100).optional(),
  city: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function SearchAlertForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { minBattery: 80 },
  })

  const minBatteryValue = watch('minBattery')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/search-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al crear la alerta')
      setSuccess(true)
      setTimeout(() => onSuccess?.(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-400">Marca *</label>
        <select {...register('brand')} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-600 transition-all">
          <option value="">Seleccionar marca</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
        </select>
        {errors.brand && <p className="text-xs text-red-400">{errors.brand.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-400">Modelo (opcional)</label>
        <input {...register('modelName')} placeholder="iPhone 14 Pro" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Precio máx. (USD)</label>
          <input type="number" {...register('maxPriceUsd')} placeholder="500" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Ciudad</label>
          <input {...register('city')} placeholder="Caracas" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-zinc-400">Batería mínima</label>
          <span className="text-sm font-bold text-blue-400">{minBatteryValue ?? 80}%</span>
        </div>
        <input type="range" min="0" max="100" step="5" {...register('minBattery')} className="w-full h-2 rounded-lg bg-zinc-800 accent-blue-600 cursor-pointer" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> ¡Alerta creada!
        </div>
      )}

      <button type="submit" disabled={loading || success} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Crear alerta
      </button>
    </form>
  )
}
