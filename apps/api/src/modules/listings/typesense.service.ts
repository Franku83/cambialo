import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as TypesenseClient } from 'typesense'

const COLLECTION_NAME = 'listings'

@Injectable()
export class TypesenseService implements OnModuleInit {
  private readonly logger = new Logger(TypesenseService.name)
  private client: TypesenseClient

  constructor(private readonly config: ConfigService) {
    this.client = new TypesenseClient({
      nodes: [
        {
          host: this.config.get<string>('TYPESENSE_HOST') ?? 'localhost',
          port: Number(this.config.get<string>('TYPESENSE_PORT') ?? 443),
          protocol: this.config.get<string>('TYPESENSE_PROTOCOL') ?? 'https',
        },
      ],
      apiKey: this.config.get<string>('TYPESENSE_API_KEY') ?? '',
      connectionTimeoutSeconds: 5,
    })
  }

  async onModuleInit() {
    await this.initCollection()
  }

  async initCollection() {
    try {
      await this.client.collections(COLLECTION_NAME).retrieve()
      this.logger.log('Typesense collection "listings" already exists')
    } catch {
      this.logger.log('Creating Typesense collection "listings"...')
      await this.client.collections().create({
        name: COLLECTION_NAME,
        fields: [
          { name: 'id',                  type: 'string' },
          { name: 'brand',               type: 'string', facet: true },
          { name: 'model_name',          type: 'string', facet: true },
          { name: 'model_number',        type: 'string', optional: true },
          { name: 'price_usd',           type: 'float',  facet: true },
          { name: 'storage_gb',          type: 'int32',  facet: true },
          { name: 'battery_health',      type: 'int32',  facet: true },
          { name: 'condition',           type: 'string', facet: true },
          { name: 'verification_status', type: 'string', facet: true },
          { name: 'status',              type: 'string', facet: true },
          { name: 'city',                type: 'string', facet: true, optional: true },
          { name: 'state',               type: 'string', facet: true, optional: true },
          { name: 'is_bumped',           type: 'bool',   facet: true },
          { name: 'accepts_offers',      type: 'bool',   facet: true },
          { name: 'cover_photo_url',     type: 'string', optional: true, index: false },
          { name: 'seller_username',     type: 'string', optional: true },
          { name: 'created_at',          type: 'int64' },
          { name: 'price_sort',          type: 'float',  sort: true },
        ],
        default_sorting_field: 'price_sort',
      })
      this.logger.log('Typesense collection "listings" created')
    }
  }

  async indexListing(listing: {
    id: string
    brand: string
    modelName: string
    modelNumber?: string
    priceUsd: number
    storageGb: number
    batteryHealth: number
    condition: string
    verificationStatus: string
    status: string
    city?: string | null
    state?: string | null
    isBumped: boolean
    acceptsOffers: boolean
    coverPhotoUrl?: string | null
    sellerUsername?: string
    createdAt: Date
  }) {
    const doc = {
      id: listing.id,
      brand: listing.brand,
      model_name: listing.modelName,
      model_number: listing.modelNumber ?? '',
      price_usd: listing.priceUsd,
      storage_gb: listing.storageGb,
      battery_health: listing.batteryHealth,
      condition: listing.condition,
      verification_status: listing.verificationStatus,
      status: listing.status,
      ...(listing.city && { city: listing.city }),
      ...(listing.state && { state: listing.state }),
      is_bumped: listing.isBumped,
      accepts_offers: listing.acceptsOffers,
      ...(listing.coverPhotoUrl && { cover_photo_url: listing.coverPhotoUrl }),
      ...(listing.sellerUsername && { seller_username: listing.sellerUsername }),
      created_at: Math.floor(listing.createdAt.getTime() / 1000),
      price_sort: listing.priceUsd,
    }

    await this.client.collections(COLLECTION_NAME).documents().upsert(doc)
  }

  async deleteListing(id: string) {
    try {
      await this.client.collections(COLLECTION_NAME).documents(id).delete()
    } catch {
      // Puede no existir aún — no es error fatal
    }
  }
}
