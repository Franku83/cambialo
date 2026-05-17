import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Catálogo base de dispositivos — los más comunes en Venezuela
  const devices = [
    // iPhones
    { brand: 'Apple', modelName: 'iPhone 11', modelNumber: 'A2221', releaseYear: 2019, originalStorageOptions: [64, 128, 256], originalColors: ['Black', 'White', 'Red', 'Yellow', 'Purple', 'Green'] },
    { brand: 'Apple', modelName: 'iPhone 12', modelNumber: 'A2172', releaseYear: 2020, originalStorageOptions: [64, 128, 256], originalColors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Purple'] },
    { brand: 'Apple', modelName: 'iPhone 13', modelNumber: 'A2633', releaseYear: 2021, originalStorageOptions: [128, 256, 512], originalColors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'] },
    { brand: 'Apple', modelName: 'iPhone 13 Pro', modelNumber: 'A2636', releaseYear: 2021, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'] },
    { brand: 'Apple', modelName: 'iPhone 14', modelNumber: 'A2649', releaseYear: 2022, originalStorageOptions: [128, 256, 512], originalColors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red', 'Yellow'] },
    { brand: 'Apple', modelName: 'iPhone 14 Pro', modelNumber: 'A2890', releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
    { brand: 'Apple', modelName: 'iPhone 15', modelNumber: 'A3089', releaseYear: 2023, originalStorageOptions: [128, 256, 512], originalColors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
    { brand: 'Apple', modelName: 'iPhone 15 Pro', modelNumber: 'A3101', releaseYear: 2023, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'] },
    // Samsung
    { brand: 'Samsung', modelName: 'Galaxy S21', modelNumber: 'SM-G991B', releaseYear: 2021, originalStorageOptions: [128, 256], originalColors: ['Phantom Gray', 'Phantom White', 'Phantom Violet', 'Phantom Pink'] },
    { brand: 'Samsung', modelName: 'Galaxy S22', modelNumber: 'SM-S901B', releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold'] },
    { brand: 'Samsung', modelName: 'Galaxy S23', modelNumber: 'SM-S911B', releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender'] },
    { brand: 'Samsung', modelName: 'Galaxy A54', modelNumber: 'SM-A546B', releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Awesome Black', 'Awesome White', 'Awesome Violet', 'Awesome Lime'] },
  ]

  for (const device of devices) {
    await prisma.deviceModel.upsert({
      where: { id: device.modelName }, // No hay unique en modelName, se usa upsert con create
      update: {},
      create: device,
    }).catch(async () => {
      // Si falla el upsert, crear directamente
      await prisma.deviceModel.create({ data: device })
    })
  }

  // Zonas seguras base — Caracas
  const safeZones = [
    { name: 'Centro Comercial Sambil Caracas', type: 'mall' as const, city: 'Caracas', state: 'Distrito Capital', address: 'Av. Libertador, Chacao', googleMapsUrl: 'https://maps.google.com/?q=Sambil+Caracas', openingHours: { 'lun-dom': '10:00-21:00' } },
    { name: 'Centro Comercial Santa Fe', type: 'mall' as const, city: 'Caracas', state: 'Distrito Capital', address: 'Av. Santa Fe, Prados del Este', openingHours: { 'lun-dom': '10:00-21:00' } },
    { name: 'Centro Comercial El Recreo', type: 'mall' as const, city: 'Caracas', state: 'Distrito Capital', address: 'Av. Casanova, Sabana Grande', openingHours: { 'lun-dom': '10:00-20:00' } },
    { name: 'Centro Comercial Millennium', type: 'mall' as const, city: 'Maracaibo', state: 'Zulia', address: 'Av. 5 de Julio', openingHours: { 'lun-dom': '10:00-21:00' } },
    { name: 'Centro Comercial Lago Mall', type: 'mall' as const, city: 'Maracaibo', state: 'Zulia', address: 'Av. Circunvalación 2', openingHours: { 'lun-dom': '10:00-21:00' } },
  ]

  for (const zone of safeZones) {
    await prisma.safeZone.create({ data: zone }).catch(() => {})
  }

  console.log('✅ Seed completado')
  console.log(`   - ${devices.length} modelos de dispositivos`)
  console.log(`   - ${safeZones.length} zonas seguras`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
