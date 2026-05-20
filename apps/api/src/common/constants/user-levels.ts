export const LISTING_LIMITS = {
  unverified: 3,
  verified: 10,
  pro: 25,
}

export function getListingLimit(user: { idVerified: boolean; isVerifiedSeller: boolean }): number {
  if (user.isVerifiedSeller) return LISTING_LIMITS.pro
  if (user.idVerified) return LISTING_LIMITS.verified
  return LISTING_LIMITS.unverified
}
