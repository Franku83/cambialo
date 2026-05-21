import type { MetadataRoute } from 'next'
import { modelToSlug } from '@/lib/slug'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const APP_URL = 'https://cambialo.app'

function safeDate(value: unknown): Date {
  if (!value) return new Date()
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? new Date() : d
}

async function getDeviceModels(): Promise<{ brand: string; modelName: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/device-models`, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

async function getActiveListings(): Promise<{ id: string; updatedAt?: string; createdAt?: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings?limit=1000`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.listings ?? data ?? []
  } catch { return [] }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${APP_URL}/explore`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${APP_URL}/apple`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/samsung`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/roadmap`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${APP_URL}/safe-zones`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const [deviceModels, listings] = await Promise.all([getDeviceModels(), getActiveListings()])

  const modelPages: MetadataRoute.Sitemap = deviceModels
    .filter((m) => m.brand && m.modelName)
    .map((model) => ({
      url: `${APP_URL}/${model.brand.toLowerCase()}/${modelToSlug(model.modelName)}`,
      lastModified: safeDate(model.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

  const listingPages: MetadataRoute.Sitemap = listings
    .filter((l) => l.id)
    .slice(0, 1000)
    .map((listing) => ({
      url: `${APP_URL}/listings/${listing.id}`,
      lastModified: safeDate(listing.updatedAt ?? listing.createdAt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

  return [...staticPages, ...modelPages, ...listingPages]
}
