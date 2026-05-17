'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  cloudinaryUrl: string
  width: number | null
  height: number | null
  isCover: boolean
}

interface ListingGalleryProps {
  photos: Photo[]
  alt: string
}

export function ListingGallery({ photos, alt }: ListingGalleryProps) {
  const [current, setCurrent] = useState(0)

  if (!photos.length) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-zinc-900 text-5xl">
        📱
      </div>
    )
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length)
  const next = () => setCurrent((c) => (c + 1) % photos.length)

  return (
    <div className="space-y-3">
      {/* Imagen principal */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
          >
            <Image
              src={photos[current]!.cloudinaryUrl}
              alt={`${alt} — foto ${current + 1}`}
              fill
              priority={current === 0}
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {/* Flechas de navegación */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Contador */}
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
            {current + 1}/{photos.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setCurrent(i)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === current ? 'border-blue-500' : 'border-zinc-800 hover:border-zinc-600',
              )}
            >
              <Image
                src={photo.cloudinaryUrl}
                alt={`Foto ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
