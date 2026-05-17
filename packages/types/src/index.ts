// Stub de tipos de base de datos — se reemplaza con los generados por Supabase CLI
// `npx supabase gen types typescript --project-id <id> > packages/types/src/database.types.ts`
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          username: string
          full_name: string
          avatar_url: string | null
          id_verified: boolean
          id_document: string | null
          reputation_score: number
          total_sales: number
          total_purchases: number
          is_verified_seller: boolean
          verified_seller_until: string | null
          is_banned: boolean
          ban_reason: string | null
          location_city: string | null
          location_state: string | null
          whatsapp_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['users']['Row']>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      listings: {
        Row: {
          id: string
          seller_id: string
          device_model_id: string
          price_usd: number
          storage_gb: number
          color: string
          battery_health: number
          condition: ListingCondition
          imei_last4: string
          has_icloud_lock: boolean
          has_google_lock: boolean
          has_repairs: boolean
          repair_details: string | null
          includes_box: boolean
          includes_charger: boolean
          includes_earphones: boolean
          description: string | null
          verification_status: VerificationStatus
          verification_code: string | null
          verification_expires_at: string | null
          verified_at: string | null
          status: ListingStatus
          is_bumped: boolean
          bump_expires_at: string | null
          views_count: number
          saves_count: number
          accepts_offers: boolean
          min_offer_usd: number | null
          city: string | null
          state: string | null
          meet_at_mall: boolean
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['listings']['Row']>
        Update: Partial<Database['public']['Tables']['listings']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          data: Record<string, unknown> | null
          is_read: boolean
          push_sent_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      listing_photos: {
        Row: {
          id: string
          listing_id: string
          cloudinary_url: string
          cloudinary_id: string
          width: number | null
          height: number | null
          is_verification_photo: boolean
          is_cover: boolean
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['listing_photos']['Row']>
        Update: Partial<Database['public']['Tables']['listing_photos']['Row']>
      }
      safe_zones: {
        Row: {
          id: string
          name: string
          type: SafeZoneType
          address: string | null
          city: string
          state: string
          latitude: number | null
          longitude: number | null
          google_maps_url: string | null
          opening_hours: Record<string, string> | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['safe_zones']['Row']>
        Update: Partial<Database['public']['Tables']['safe_zones']['Row']>
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          transaction_type: TransactionType
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reviews']['Row']>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
      device_models: {
        Row: {
          id: string
          brand: string
          model_name: string
          model_number: string
          release_year: number | null
          original_storage_options: number[]
          original_colors: string[]
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['device_models']['Row']>
        Update: Partial<Database['public']['Tables']['device_models']['Row']>
      }
      saved_listings: {
        Row: { user_id: string; listing_id: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['saved_listings']['Row']>
        Update: Partial<Database['public']['Tables']['saved_listings']['Row']>
      }
    }
    Views: {
      public_profiles: {
        Row: PublicProfile
      }
    }
    Functions: Record<string, unknown>
    Enums: {
      listing_condition: ListingCondition
      listing_status: ListingStatus
      verification_status: VerificationStatus
      notification_type: NotificationType
      safe_zone_type: SafeZoneType
      transaction_type: TransactionType
    }
  }
}

// ─── Enums de dominio ────────────────────────────────────────────────────────

export type UserRole = 'user' | 'moderator' | 'admin'
export type ListingCondition = 'mint' | 'good' | 'fair' | 'poor'
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'
export type ListingStatus = 'draft' | 'active' | 'paused' | 'sold' | 'expired' | 'removed'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired'
export type NotificationType =
  | 'new_offer'
  | 'price_drop'
  | 'search_match'
  | 'verification_approved'
  | 'verification_rejected'
  | 'review_received'
  | 'listing_expired'
export type SafeZoneType = 'mall' | 'bank' | 'police' | 'other'
export type TransactionType = 'buy' | 'sell'

// ─── Interfaces de dominio ────────────────────────────────────────────────────

export interface PublicProfile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  id_verified: boolean
  reputation_score: number
  total_sales: number
  total_purchases: number
  is_verified_seller: boolean
  location_city: string | null
  location_state: string | null
  created_at: string
}

export interface ListingWithDetails {
  id: string
  price_usd: number
  storage_gb: number
  color: string
  battery_health: number
  condition: ListingCondition
  verification_status: VerificationStatus
  status: ListingStatus
  is_bumped: boolean
  city: string | null
  state: string | null
  accepts_offers: boolean
  description: string | null
  created_at: string
  seller: PublicProfile
  device_model: {
    id: string
    brand: string
    model_name: string
    model_number: string
    image_url: string | null
  }
  photos: {
    id: string
    cloudinary_url: string
    width: number | null
    height: number | null
    is_cover: boolean
    sort_order: number
  }[]
}

export interface ListingFilters {
  brand?: string
  model?: string
  minPrice?: number
  maxPrice?: number
  minBattery?: number
  condition?: ListingCondition[]
  city?: string
  hasRepairs?: boolean
  verifiedOnly?: boolean
  acceptsOffers?: boolean
  cursor?: string
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  total: number
}
