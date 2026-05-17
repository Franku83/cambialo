'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReviewCard } from './ReviewCard'
import { Loader2 } from 'lucide-react'

interface ReviewsListProps {
  userId: string
  apiUrl?: string
}

interface Review {
  id: string; rating: number; comment: string | null; transactionType: 'buy' | 'sell'; createdAt: string
  reviewer: { username: string; avatarUrl: string | null }
}

interface ReviewsResponse {
  data: Review[]; total: number; page: number; totalPages: number; averageRating: number | null
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function ReviewsList({ userId }: ReviewsListProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['reviews', userId, page],
    queryFn: async () => {
      const res = await fetch(`${API}/api/v1/reviews/user/${userId}?page=${page}&limit=10`)
      if (!res.ok) throw new Error('Error cargando reseñas')
      return res.json() as Promise<ReviewsResponse>
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!data?.data.length) {
    return <p className="py-6 text-center text-sm text-zinc-600">Sin reseñas aún</p>
  }

  return (
    <div className="space-y-3">
      {data.data.map((r) => (
        <ReviewCard
          key={r.id}
          rating={r.rating}
          comment={r.comment}
          transactionType={r.transactionType}
          createdAt={r.createdAt}
          reviewer={r.reviewer}
        />
      ))}
      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 disabled:opacity-40 hover:border-zinc-700"
          >
            Anterior
          </button>
          <span className="flex items-center text-xs text-zinc-600">{page}/{data.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 disabled:opacity-40 hover:border-zinc-700"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
