import posthog from 'posthog-js'

export function initPosthog() {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'production') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage',
  })
}

export const track = {
  listingViewed: (listingId: string, model: string) =>
    posthog.capture('listing_viewed', { listingId, model }),

  whatsappClicked: (listingId: string) =>
    posthog.capture('whatsapp_clicked', { listingId }),

  listingPublished: (model: string, condition: string) =>
    posthog.capture('listing_published', { model, condition }),

  searchPerformed: (query: string, filters: object) =>
    posthog.capture('search_performed', { query, ...filters }),

  kycStarted: () =>
    posthog.capture('kyc_started'),

  kycCompleted: () =>
    posthog.capture('kyc_completed'),

  tradeInSimulated: (model: string, estimatedValue: number) =>
    posthog.capture('tradein_simulated', { model, estimatedValue }),

  filterApplied: (filterType: string) =>
    posthog.capture('filter_applied', { filterType }),
}
