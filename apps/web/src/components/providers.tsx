'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect, type ReactNode } from 'react'
import { initPosthog } from '@/lib/posthog'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { initPosthog() }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time de 60s — apropiado para listings que cambian frecuente
            staleTime: 60 * 1000,
            // Retry reducido para UX más rápida en Venezuela (conexión lenta)
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
