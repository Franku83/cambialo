const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'demo'

export function getListingThumbnail(cloudinaryId: string) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,g_center,w_192,h_192,q_auto,f_auto/${cloudinaryId}`
}

export function getListingMain(cloudinaryId: string) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,g_center,w_800,h_600,q_auto,f_auto/${cloudinaryId}`
}

export function getListingGallery(cloudinaryId: string) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,g_center,w_400,h_300,q_auto,f_auto/${cloudinaryId}`
}

export function isCloudinaryUrl(url: string) {
  return url.includes('cloudinary.com')
}

export function getCloudinaryId(url: string) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  return match?.[1] ?? url
}
