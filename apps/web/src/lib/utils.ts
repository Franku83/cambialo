import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea precio en USD con separador de miles */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Formatea batería con color semántico */
export function getBatteryColor(health: number): string {
  if (health >= 85) return 'text-green-600'
  if (health >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

/** Trunca texto con ellipsis */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

/** Genera link de WhatsApp con mensaje prellenado */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`
}

/** Genera mensaje pre-llenado para contactar vendedor */
export function generateContactMessage(listing: {
  model: string
  price: number
  id: string
}): string {
  return `Hola, vi tu ${listing.model} en Cambialo por ${formatPrice(listing.price)}. ¿Sigue disponible? (Ref: ${listing.id.slice(-6).toUpperCase()})`
}
