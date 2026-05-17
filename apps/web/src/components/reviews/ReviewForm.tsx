'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from './StarRating'
import { cn } from '@/lib/utils'

const schema = z.object({
  rating: z.number().min(1, 'Selecciona una calificación').max(5),
  comment: z.string().max(500).optional(),
  transactionType: z.enum(['buy', 'sell']),
})
type FormData = z.infer<typeof schema>

interface ReviewFormProps {
  listingId: string
  reviewedId: string
  reviewedUsername: string
  onSuccess?: () => void
}

export function ReviewForm({ listingId, reviewedId, reviewedUsername, onSuccess }: ReviewFormProps) {
  const [done, setDone] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, transactionType: 'buy' },
  })
  const rating = watch('rating')
  const txType = watch('transactionType')

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('reviews').insert({
      listing_id: listingId,
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      rating: data.rating,
      comment: data.comment || null,
      transaction_type: data.transactionType,
    })

    if (!error) { setDone(true); onSuccess?.() }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
        <p className="font-medium text-white">¡Reseña enviada!</p>
        <p className="text-sm text-zinc-500">Gracias por tu opinión</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <p className="mb-1.5 text-sm font-medium text-zinc-300">¿Cómo calificarías tu experiencia con @{reviewedUsername}?</p>
        <StarRating value={rating} onChange={(v) => setValue('rating', v)} size="lg" />
        {errors.rating && <p className="mt-1 text-xs text-red-400">{errors.rating.message}</p>}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-zinc-300">Fuiste</p>
        <div className="flex gap-2">
          {(['buy', 'sell'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('transactionType', t)}
              className={cn(
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                txType === t ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600',
              )}
            >
              {t === 'buy' ? '🛒 Comprador' : '📦 Vendedor'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">Comentario (opcional)</label>
        <textarea
          {...register('comment')}
          rows={3}
          maxLength={500}
          placeholder="Cuéntanos tu experiencia..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500 resize-none"
        />
        {errors.comment && <p className="mt-1 text-xs text-red-400">{errors.comment.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Publicar reseña
      </button>
    </form>
  )
}
