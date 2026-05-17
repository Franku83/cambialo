// Utilidades compartidas entre web y api
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TM-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  const date = new Date()
  const dateStr = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `${code}-${dateStr}`
}

export function calculateReputationScore(data: {
  idVerified: boolean
  positiveReviews: number
  negativeReviews: number
  verifiedListings: number
  monthsOnPlatform: number
}): number {
  let score = 0
  if (data.idVerified) score += 20
  score += Math.min(data.positiveReviews * 5, 40)
  score -= data.negativeReviews * 10
  score += Math.min(data.verifiedListings * 2, 20)
  score += Math.min(data.monthsOnPlatform, 10)
  return Math.max(0, Math.min(100, score))
}
