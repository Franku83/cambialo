import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/database/prisma.service'

const PROHIBITED_WORDS = [
  // Fraude / estafa
  'estafa', 'scam', 'fraud', 'garantia_cambialo', 'verificado_cambialo',
  // Contacto externo sospechoso (evitar bypasses)
  'telegram', 't.me',
  // Contenido adulto / inapropiado
  'puta', 'mierda', 'coño', 'verga', 'marico',
]

interface AutoCheckResult {
  passed: boolean
  flags: string[]
}

@Injectable()
export class AutoModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async checkListing(listingId: string): Promise<AutoCheckResult> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        imeiLast4: true,
        deviceModelId: true,
        priceUsd: true,
        storageGb: true,
        description: true,
      },
    })

    if (!listing) return { passed: false, flags: ['listing_not_found'] }

    const [imeiFlag, priceFlag, wordsFlag] = await Promise.all([
      this.checkImeiDuplicate(listingId, listing.imeiLast4, listing.deviceModelId),
      this.checkPriceRange(listing.priceUsd as unknown as number, listing.deviceModelId, listing.storageGb),
      Promise.resolve(this.checkProhibitedWords(listing.description ?? '')),
    ])

    const flags = [imeiFlag, priceFlag, wordsFlag].filter(Boolean) as string[]
    return { passed: flags.length === 0, flags }
  }

  private async checkImeiDuplicate(
    listingId: string,
    imeiLast4: string,
    deviceModelId: string,
  ): Promise<string | null> {
    const existing = await this.prisma.listing.findFirst({
      where: {
        imeiLast4,
        deviceModelId,
        id: { not: listingId },
        status: { in: ['active', 'paused', 'draft'] },
      },
      select: { id: true },
    })
    return existing ? 'possible_imei_duplicate' : null
  }

  private async checkPriceRange(
    priceUsd: number,
    deviceModelId: string,
    storageGb: number,
  ): Promise<string | null> {
    const index = await this.prisma.priceIndex.findUnique({
      where: { deviceModelId_storageGb: { deviceModelId, storageGb } },
      select: { avgPrice: true },
    })
    if (!index) return null // sin índice no podemos comparar

    const avg = Number(index.avgPrice)
    // Flag si el precio es menor al 40% del promedio (posible fraude/señuelo)
    if (priceUsd < avg * 0.4) return 'price_suspiciously_low'
    return null
  }

  private checkProhibitedWords(text: string): string | null {
    const normalized = text.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, '')
    for (const word of PROHIBITED_WORDS) {
      if (normalized.includes(word)) return `prohibited_word:${word}`
    }
    return null
  }

  /** Aplica el resultado del check al listing: aprueba o pone en revisión manual */
  async applyCheck(listingId: string): Promise<void> {
    const result = await this.checkListing(listingId)

    if (result.passed) {
      // Sin flags → pasar directo a pending_review normal (moderación manual como antes)
      return
    }

    // Con flags → marcar con nota interna pero no bloquear automáticamente
    // Los moderadores verán los flags en la cola
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        // Guardamos los flags en el campo description como nota temporal
        // (en producción real habría un campo adminNotes)
        description: (await this.prisma.listing
          .findUnique({ where: { id: listingId }, select: { description: true } })
          .then(l => l?.description ?? ''))
          + `\n\n[AUTO-MOD FLAGS: ${result.flags.join(', ')}]`,
      },
    }).catch(() => null)
  }
}
