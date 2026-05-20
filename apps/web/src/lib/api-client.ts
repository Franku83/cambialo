const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export type ApiError =
  | 'NO_CONNECTION'
  | 'API_DOWN'
  | 'TIMEOUT'
  | `HTTP_${number}`

export class ApiCallError extends Error {
  constructor(
    public readonly code: ApiError,
    message?: string,
  ) {
    super(message ?? code)
  }
}

export async function apiCall<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options ?? {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      if (response.status >= 500) throw new ApiCallError('API_DOWN')
      throw new ApiCallError(`HTTP_${response.status}` as ApiError)
    }

    return response.json() as Promise<T>
  } catch (err) {
    if (err instanceof ApiCallError) throw err

    const errName = (err as Error).name
    if (errName === 'AbortError' || errName === 'TimeoutError') {
      throw new ApiCallError('TIMEOUT')
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiCallError('NO_CONNECTION')
    }
    if ((err as Error).message === 'Failed to fetch') {
      throw new ApiCallError('API_DOWN')
    }

    throw err
  }
}

export function buildListingsQuery(filters: {
  brand?: string
  minPrice?: number
  maxPrice?: number
  minBattery?: number
  condition?: string[]
  city?: string
  verifiedOnly?: boolean
  acceptsOffers?: boolean
  lat?: number
  lng?: number
  rangeKm?: number
  cursor?: string
  limit?: number
  q?: string
}): string {
  const params = new URLSearchParams()

  if (filters.brand) params.set('brand', filters.brand)
  if (filters.q) params.set('q', filters.q)
  if (filters.minPrice !== undefined && !isNaN(filters.minPrice) && filters.minPrice > 0)
    params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice) && filters.maxPrice > 0)
    params.set('maxPrice', String(filters.maxPrice))
  if (filters.minBattery !== undefined && filters.minBattery > 0)
    params.set('minBattery', String(filters.minBattery))
  if (filters.condition?.length) params.set('condition', filters.condition.join(','))
  if (filters.city) params.set('city', filters.city)
  if (filters.verifiedOnly) params.set('verifiedOnly', 'true')
  if (filters.acceptsOffers) params.set('acceptsOffers', 'true')
  if (filters.lat !== undefined && filters.lng !== undefined) {
    params.set('lat', String(filters.lat))
    params.set('lng', String(filters.lng))
    params.set('rangeKm', String(filters.rangeKm ?? 40))
  }
  if (filters.cursor) params.set('cursor', filters.cursor)
  if (filters.limit) params.set('limit', String(filters.limit))

  return params.toString()
}

export const ERROR_MESSAGES: Record<ApiError, string> = {
  NO_CONNECTION: 'Sin conexión a internet.',
  API_DOWN: 'Estamos teniendo problemas técnicos. Intenta en unos minutos.',
  TIMEOUT: 'La respuesta tardó demasiado. Intenta de nuevo.',
  HTTP_401: 'Sesión expirada. Inicia sesión de nuevo.',
  HTTP_403: 'No tienes permiso para realizar esta acción.',
  HTTP_404: 'Recurso no encontrado.',
  HTTP_422: 'Datos inválidos.',
  HTTP_429: 'Demasiadas solicitudes. Espera un momento.',
} as Record<ApiError, string>
