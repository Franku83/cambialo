import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface OGListing {
  id: string
  priceUsd: string
  storageGb: number
  batteryHealth: number
  condition: string
  verificationStatus: string
  deviceModel: { brand: string; modelName: string }
  photos: { cloudinaryUrl: string }[]
  seller: { username: string }
  city: string | null
}

function formatPriceOG(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const CONDITION_LABEL: Record<string, string> = {
  mint: 'Nuevo',
  good: 'Buen estado',
  fair: 'Regular',
  poor: 'Con detalles',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let listing: OGListing | null = null
  try {
    const res = await fetch(`${API_URL}/api/v1/listings/${id}`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) listing = await res.json() as OGListing
  } catch { /* usa fallback */ }

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: '#0a0a0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: 'white', fontSize: 48, fontWeight: 700 }}>Cambialo</div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  const coverUrl = listing.photos[0]?.cloudinaryUrl
  const price = formatPriceOG(Number(listing.priceUsd))
  const condLabel = CONDITION_LABEL[listing.condition] ?? listing.condition
  const isVerified = listing.verificationStatus === 'verified'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0a0a0b',
          display: 'flex',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Foto izquierda */}
        <div style={{ width: '500px', height: '630px', background: '#18181b', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {!coverUrl && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '120px' }}>
              📱
            </div>
          )}
        </div>

        {/* Contenido derecho */}
        <div style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px' }}>
              T
            </div>
            <span style={{ color: '#71717a', fontSize: '16px' }}>Cambialo</span>
          </div>

          {/* Modelo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: '#71717a', fontSize: '18px' }}>{listing.deviceModel.brand}</div>
            <div style={{ color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1.1 }}>
              {listing.deviceModel.modelName}
            </div>
            <div style={{ color: '#52525b', fontSize: '18px' }}>{listing.storageGb} GB · {listing.city ?? 'Venezuela'}</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#71717a', fontSize: '13px' }}>Precio</span>
              <span style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700 }}>{price}</span>
            </div>
            <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#71717a', fontSize: '13px' }}>Batería</span>
              <span style={{ color: listing.batteryHealth >= 85 ? '#22c55e' : listing.batteryHealth >= 70 ? '#eab308' : '#ef4444', fontSize: '28px', fontWeight: 700 }}>{listing.batteryHealth}%</span>
            </div>
            <div style={{ background: '#18181b', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#71717a', fontSize: '13px' }}>Condición</span>
              <span style={{ color: 'white', fontSize: '20px', fontWeight: 600 }}>{condLabel}</span>
            </div>
          </div>

          {/* Badge verificado */}
          {isVerified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#052e16', borderRadius: '10px', padding: '10px 16px', width: 'fit-content' }}>
              <span style={{ color: '#22c55e', fontSize: '18px' }}>✓</span>
              <span style={{ color: '#22c55e', fontSize: '15px', fontWeight: 600 }}>Verificado por Cambialo</span>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
