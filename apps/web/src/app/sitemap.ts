import type { MetadataRoute } from 'next'
import { modelToSlug } from '@/lib/slug'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const APP_URL = 'https://cambialo.app'

async function getDeviceModels(): Promise<{ brand: string; modelName: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/device-models`, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

async function getActiveListings(): Promise<{ id: string; updatedAt: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/listings?limit=1000&status=active`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.listings ?? data ?? []
  } catch { return [] }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${APP_URL}/explore`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${APP_URL}/apple`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/samsung`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/roadmap`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${APP_URL}/safe-zones`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]

  const [deviceModels, listings] = await Promise.all([getDeviceModels(), getActiveListings()])

  const modelPages: MetadataRoute.Sitemap = deviceModels.map((model) => ({
    url: `${APP_URL}/${model.brand.toLowerCase()}/${modelToSlug(model.modelName)}`,
    lastModified: new Date(model.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  const listingPages: MetadataRoute.Sitemap = listings.slice(0, 1000).map((listing) => ({
    url: `${APP_URL}/listings/${listing.id}`,
    lastModified: new Date(listing.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...modelPages, ...listingPages]
}
