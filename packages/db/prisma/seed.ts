import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const devices = [
  // ─── Apple ────────────────────────────────────────────────────────────────
  { brand: 'Apple', modelName: 'iPhone XR',        modelNumber: 'A2105', releaseYear: 2018, originalStorageOptions: [64, 128, 256],        originalColors: ['Black', 'White', 'Blue', 'Yellow', 'Coral', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone XS',        modelNumber: 'A2097', releaseYear: 2018, originalStorageOptions: [64, 256, 512],         originalColors: ['Space Gray', 'Silver', 'Gold'] },
  { brand: 'Apple', modelName: 'iPhone XS Max',    modelNumber: 'A2101', releaseYear: 2018, originalStorageOptions: [64, 256, 512],         originalColors: ['Space Gray', 'Silver', 'Gold'] },
  { brand: 'Apple', modelName: 'iPhone 11',        modelNumber: 'A2221', releaseYear: 2019, originalStorageOptions: [64, 128, 256],         originalColors: ['Black', 'White', 'Red', 'Yellow', 'Purple', 'Green'] },
  { brand: 'Apple', modelName: 'iPhone 11 Pro',    modelNumber: 'A2215', releaseYear: 2019, originalStorageOptions: [64, 256, 512],         originalColors: ['Space Gray', 'Silver', 'Gold', 'Midnight Green'] },
  { brand: 'Apple', modelName: 'iPhone 11 Pro Max',modelNumber: 'A2218', releaseYear: 2019, originalStorageOptions: [64, 256, 512],         originalColors: ['Space Gray', 'Silver', 'Gold', 'Midnight Green'] },
  { brand: 'Apple', modelName: 'iPhone SE (2020)', modelNumber: 'A2296', releaseYear: 2020, originalStorageOptions: [64, 128, 256],         originalColors: ['Black', 'White', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 12 mini',   modelNumber: 'A2176', releaseYear: 2020, originalStorageOptions: [64, 128, 256],         originalColors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Purple'] },
  { brand: 'Apple', modelName: 'iPhone 12',        modelNumber: 'A2172', releaseYear: 2020, originalStorageOptions: [64, 128, 256],         originalColors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Purple'] },
  { brand: 'Apple', modelName: 'iPhone 12 Pro',    modelNumber: 'A2341', releaseYear: 2020, originalStorageOptions: [128, 256, 512],        originalColors: ['Graphite', 'Silver', 'Gold', 'Pacific Blue'] },
  { brand: 'Apple', modelName: 'iPhone 12 Pro Max',modelNumber: 'A2342', releaseYear: 2020, originalStorageOptions: [128, 256, 512],        originalColors: ['Graphite', 'Silver', 'Gold', 'Pacific Blue'] },
  { brand: 'Apple', modelName: 'iPhone 13 mini',   modelNumber: 'A2628', releaseYear: 2021, originalStorageOptions: [128, 256, 512],        originalColors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 13',        modelNumber: 'A2633', releaseYear: 2021, originalStorageOptions: [128, 256, 512],        originalColors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 13 Pro',    modelNumber: 'A2636', releaseYear: 2021, originalStorageOptions: [128, 256, 512, 1024],  originalColors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'] },
  { brand: 'Apple', modelName: 'iPhone 13 Pro Max',modelNumber: 'A2641', releaseYear: 2021, originalStorageOptions: [128, 256, 512, 1024],  originalColors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'] },
  { brand: 'Apple', modelName: 'iPhone SE (2022)', modelNumber: 'A2595', releaseYear: 2022, originalStorageOptions: [64, 128, 256],         originalColors: ['Midnight', 'Starlight', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 14',        modelNumber: 'A2649', releaseYear: 2022, originalStorageOptions: [128, 256, 512],        originalColors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red', 'Yellow'] },
  { brand: 'Apple', modelName: 'iPhone 14 Plus',   modelNumber: 'A2632', releaseYear: 2022, originalStorageOptions: [128, 256, 512],        originalColors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red', 'Yellow'] },
  { brand: 'Apple', modelName: 'iPhone 14 Pro',    modelNumber: 'A2890', releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024],  originalColors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
  { brand: 'Apple', modelName: 'iPhone 14 Pro Max',modelNumber: 'A2651', releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024],  originalColors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
  { brand: 'Apple', modelName: 'iPhone 15',        modelNumber: 'A3089', releaseYear: 2023, originalStorageOptions: [128, 256, 512],        originalColors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
  { brand: 'Apple', modelName: 'iPhone 15 Plus',   modelNumber: 'A3093', releaseYear: 2023, originalStorageOptions: [128, 256, 512],        originalColors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
  { brand: 'Apple', modelName: 'iPhone 15 Pro',    modelNumber: 'A3101', releaseYear: 2023, originalStorageOptions: [128, 256, 512, 1024],  originalColors: ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 15 Pro Max',modelNumber: 'A3105', releaseYear: 2023, originalStorageOptions: [256, 512, 1024],       originalColors: ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 16',        modelNumber: 'A3287', releaseYear: 2024, originalStorageOptions: [128, 256, 512],        originalColors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'] },
  { brand: 'Apple', modelName: 'iPhone 16 Plus',   modelNumber: 'A3288', releaseYear: 2024, originalStorageOptions: [128, 256, 512],        originalColors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'] },
  { brand: 'Apple', modelName: 'iPhone 16 Pro',    modelNumber: 'A3291', releaseYear: 2024, originalStorageOptions: [128, 256, 512, 1024],  originalColors: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 16 Pro Max',modelNumber: 'A3294', releaseYear: 2024, originalStorageOptions: [256, 512, 1024],       originalColors: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'] },

  // ─── Samsung ──────────────────────────────────────────────────────────────
  { brand: 'Samsung', modelName: 'Galaxy A32',      modelNumber: 'SM-A325F', releaseYear: 2021, originalStorageOptions: [64, 128],         originalColors: ['Awesome Black', 'Awesome Blue', 'Awesome White', 'Awesome Violet'] },
  { brand: 'Samsung', modelName: 'Galaxy A33 5G',   modelNumber: 'SM-A336B', releaseYear: 2022, originalStorageOptions: [128],             originalColors: ['Awesome Black', 'Awesome Blue', 'Awesome White', 'Awesome Peach'] },
  { brand: 'Samsung', modelName: 'Galaxy A34 5G',   modelNumber: 'SM-A346B', releaseYear: 2023, originalStorageOptions: [128, 256],        originalColors: ['Awesome Black', 'Awesome Silver', 'Awesome Violet', 'Awesome Lime'] },
  { brand: 'Samsung', modelName: 'Galaxy A52',      modelNumber: 'SM-A525F', releaseYear: 2021, originalStorageOptions: [128, 256],        originalColors: ['Awesome Black', 'Awesome Blue', 'Awesome White', 'Awesome Violet'] },
  { brand: 'Samsung', modelName: 'Galaxy A52s 5G',  modelNumber: 'SM-A528B', releaseYear: 2021, originalStorageOptions: [128, 256],        originalColors: ['Awesome Black', 'Awesome Blue', 'Awesome White', 'Awesome Mint'] },
  { brand: 'Samsung', modelName: 'Galaxy A53 5G',   modelNumber: 'SM-A536B', releaseYear: 2022, originalStorageOptions: [128, 256],        originalColors: ['Awesome Black', 'Awesome Blue', 'Awesome White', 'Awesome Peach'] },
  { brand: 'Samsung', modelName: 'Galaxy A54 5G',   modelNumber: 'SM-A546B', releaseYear: 2023, originalStorageOptions: [128, 256],        originalColors: ['Awesome Black', 'Awesome White', 'Awesome Violet', 'Awesome Lime'] },
  { brand: 'Samsung', modelName: 'Galaxy A55 5G',   modelNumber: 'SM-A556B', releaseYear: 2024, originalStorageOptions: [128, 256],        originalColors: ['Awesome Navy', 'Awesome Iceblue', 'Awesome Lilac', 'Awesome Lemon'] },
  { brand: 'Samsung', modelName: 'Galaxy S20 FE',   modelNumber: 'SM-G780F', releaseYear: 2020, originalStorageOptions: [128, 256],        originalColors: ['Cloud Navy', 'Cloud Lavender', 'Cloud Mint', 'Cloud White', 'Cloud Orange', 'Cloud Red'] },
  { brand: 'Samsung', modelName: 'Galaxy S21',      modelNumber: 'SM-G991B', releaseYear: 2021, originalStorageOptions: [128, 256],        originalColors: ['Phantom Gray', 'Phantom White', 'Phantom Violet', 'Phantom Pink'] },
  { brand: 'Samsung', modelName: 'Galaxy S21+',     modelNumber: 'SM-G996B', releaseYear: 2021, originalStorageOptions: [128, 256],        originalColors: ['Phantom Black', 'Phantom Silver', 'Phantom Violet', 'Phantom Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S21 Ultra',modelNumber: 'SM-G998B', releaseYear: 2021, originalStorageOptions: [128, 256, 512],   originalColors: ['Phantom Black', 'Phantom Silver', 'Phantom Titanium', 'Phantom Navy', 'Phantom Brown'] },
  { brand: 'Samsung', modelName: 'Galaxy S21 FE 5G',modelNumber: 'SM-G990B', releaseYear: 2022, originalStorageOptions: [128, 256],        originalColors: ['Graphite', 'White', 'Lavender', 'Olive'] },
  { brand: 'Samsung', modelName: 'Galaxy S22',      modelNumber: 'SM-S901B', releaseYear: 2022, originalStorageOptions: [128, 256],        originalColors: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S22+',     modelNumber: 'SM-S906B', releaseYear: 2022, originalStorageOptions: [128, 256],        originalColors: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S22 Ultra',modelNumber: 'SM-S908B', releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Phantom Black', 'Phantom White', 'Burgundy', 'Green'] },
  { brand: 'Samsung', modelName: 'Galaxy S23',      modelNumber: 'SM-S911B', releaseYear: 2023, originalStorageOptions: [128, 256],        originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender'] },
  { brand: 'Samsung', modelName: 'Galaxy S23+',     modelNumber: 'SM-S916B', releaseYear: 2023, originalStorageOptions: [256, 512],        originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender'] },
  { brand: 'Samsung', modelName: 'Galaxy S23 Ultra',modelNumber: 'SM-S918B', releaseYear: 2023, originalStorageOptions: [256, 512, 1024],  originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender'] },
  { brand: 'Samsung', modelName: 'Galaxy S23 FE',   modelNumber: 'SM-S711B', releaseYear: 2023, originalStorageOptions: [128, 256],        originalColors: ['Graphite', 'Cream', 'Mint', 'Purple', 'Indigo'] },
  { brand: 'Samsung', modelName: 'Galaxy S24',      modelNumber: 'SM-S921B', releaseYear: 2024, originalStorageOptions: [128, 256],        originalColors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'] },
  { brand: 'Samsung', modelName: 'Galaxy S24+',     modelNumber: 'SM-S926B', releaseYear: 2024, originalStorageOptions: [256, 512],        originalColors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'] },
  { brand: 'Samsung', modelName: 'Galaxy S24 Ultra',modelNumber: 'SM-S928B', releaseYear: 2024, originalStorageOptions: [256, 512, 1024],  originalColors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'] },
  { brand: 'Samsung', modelName: 'Galaxy Z Fold5',  modelNumber: 'SM-F946B', releaseYear: 2023, originalStorageOptions: [256, 512, 1024],  originalColors: ['Icy Blue', 'Phantom Black', 'Cream'] },
  { brand: 'Samsung', modelName: 'Galaxy Z Flip5',  modelNumber: 'SM-F731B', releaseYear: 2023, originalStorageOptions: [256, 512],        originalColors: ['Mint', 'Lavender', 'Graphite', 'Cream'] },

  // ─── Motorola ─────────────────────────────────────────────────────────────
  { brand: 'Motorola', modelName: 'Moto G9 Play',        modelNumber: 'XT2083', releaseYear: 2020, originalStorageOptions: [64, 128],  originalColors: ['Sapphire Blue', 'Forest Green', 'Rose Gold'] },
  { brand: 'Motorola', modelName: 'Moto G10',             modelNumber: 'XT2127', releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Iridescent Pearl', 'Iridescent Sky'] },
  { brand: 'Motorola', modelName: 'Moto G20',             modelNumber: 'XT2128', releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Breeze', 'Flamingo Pink', 'Night Sky'] },
  { brand: 'Motorola', modelName: 'Moto G30',             modelNumber: 'XT2129', releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Dark Pearl', 'Pastel Sky', 'Phantom Black'] },
  { brand: 'Motorola', modelName: 'Moto G31',             modelNumber: 'XT2173', releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Baby Blue', 'Mineral Grey', 'Meteorite Grey'] },
  { brand: 'Motorola', modelName: 'Moto G32',             modelNumber: 'XT2235', releaseYear: 2022, originalStorageOptions: [64, 128, 256], originalColors: ['Mineral Grey', 'Rose Gold', 'Satin Maroon'] },
  { brand: 'Motorola', modelName: 'Moto G42',             modelNumber: 'XT2233', releaseYear: 2022, originalStorageOptions: [64, 128],  originalColors: ['Atlantic Green', 'Metallic Rosé', 'Meteorite Grey'] },
  { brand: 'Motorola', modelName: 'Moto G52',             modelNumber: 'XT2221', releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Charcoal Grey', 'Ink Blue', 'White Lily'] },
  { brand: 'Motorola', modelName: 'Moto G53 5G',          modelNumber: 'XT2335', releaseYear: 2023, originalStorageOptions: [128],      originalColors: ['Arctic Silver', 'Ink Blue'] },
  { brand: 'Motorola', modelName: 'Moto G54 5G',          modelNumber: 'XT2343', releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Midnight Blue', 'Pearl Blue', 'Mint Green'] },
  { brand: 'Motorola', modelName: 'Moto G62 5G',          modelNumber: 'XT2223', releaseYear: 2022, originalStorageOptions: [128],      originalColors: ['Frosted Blue', 'Midnight Grey'] },
  { brand: 'Motorola', modelName: 'Moto G72',             modelNumber: 'XT2255', releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Meteorite Grey', 'Polar Blue', 'Satin Maroon'] },
  { brand: 'Motorola', modelName: 'Moto G82 5G',          modelNumber: 'XT2225', releaseYear: 2022, originalStorageOptions: [128],      originalColors: ['Atlantic Green', 'Meteorite Grey', 'White Lily'] },
  { brand: 'Motorola', modelName: 'Moto G84 5G',          modelNumber: 'XT2347', releaseYear: 2023, originalStorageOptions: [256],      originalColors: ['Marshmallow Blue', 'Midnight Blue', 'Viva Magenta'] },
  { brand: 'Motorola', modelName: 'Motorola Edge 30',     modelNumber: 'XT2203', releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Aurora Green', 'Meteor Grey', 'Supermoon Silver'] },
  { brand: 'Motorola', modelName: 'Motorola Edge 30 Pro', modelNumber: 'XT2201', releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Cosmos Blue', 'Stardust White'] },
  { brand: 'Motorola', modelName: 'Motorola Edge 40',     modelNumber: 'XT2303', releaseYear: 2023, originalStorageOptions: [256],      originalColors: ['Eclipse Black', 'Lunar Blue', 'Nebraska Grey', 'Viva Magenta'] },
  { brand: 'Motorola', modelName: 'Motorola Edge 40 Pro', modelNumber: 'XT2301', releaseYear: 2023, originalStorageOptions: [256],      originalColors: ['Black Beauty', 'Lunar Blue', 'Interstellar'] },
  { brand: 'Motorola', modelName: 'Moto E13',             modelNumber: 'XT2345', releaseYear: 2023, originalStorageOptions: [64, 128],  originalColors: ['Aurora Black', 'Creamy White', 'Cosmic Black'] },
  { brand: 'Motorola', modelName: 'Moto E32',             modelNumber: 'XT2227', releaseYear: 2022, originalStorageOptions: [64],       originalColors: ['Misty Silver', 'Slate Grey'] },

  // ─── Xiaomi ───────────────────────────────────────────────────────────────
  { brand: 'Xiaomi', modelName: 'Redmi 9',           modelNumber: 'M2004J19G', releaseYear: 2020, originalStorageOptions: [32, 64],   originalColors: ['Carbon Gray', 'Ocean Green', 'Sunset Purple', 'Midnight Black'] },
  { brand: 'Xiaomi', modelName: 'Redmi 9A',          modelNumber: 'M2006C3LG', releaseYear: 2020, originalStorageOptions: [32],       originalColors: ['Granite Gray', 'Peacock Green', 'Sky Blue'] },
  { brand: 'Xiaomi', modelName: 'Redmi 9C',          modelNumber: 'M2006C3MG', releaseYear: 2020, originalStorageOptions: [32, 64],   originalColors: ['Midnight Gray', 'Sunrise Orange', 'Aurora Green'] },
  { brand: 'Xiaomi', modelName: 'Redmi 10',          modelNumber: 'M2101K7BG', releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Carbon Gray', 'Pebble White', 'Sea Blue'] },
  { brand: 'Xiaomi', modelName: 'Redmi 10C',         modelNumber: 'M2203G5HL', releaseYear: 2022, originalStorageOptions: [64, 128],  originalColors: ['Graphite Gray', 'Ocean Blue', 'Mint Green'] },
  { brand: 'Xiaomi', modelName: 'Redmi 12',          modelNumber: 'X23B02IG',  releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Midnight Black', 'Sky Blue', 'Polar Silver'] },
  { brand: 'Xiaomi', modelName: 'Redmi 12C',         modelNumber: 'M22120RN86G',releaseYear: 2023, originalStorageOptions: [64, 128], originalColors: ['Graphite Gray', 'Ocean Blue', 'Mint Green', 'Lavender Purple'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 10',     modelNumber: 'M2101K7AG', releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Aqua Green', 'Gray', 'Pebble White', 'Shadow Black'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 10 Pro', modelNumber: 'M2101K6G',  releaseYear: 2021, originalStorageOptions: [64, 128],  originalColors: ['Dark Nebula', 'Glacier Blue', 'Gradient Bronze'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 11',     modelNumber: 'M2101K7BNY',releaseYear: 2022, originalStorageOptions: [64, 128],  originalColors: ['Graphite Gray', 'Pearl White', 'Star Blue', 'Twilight Blue'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 11 Pro', modelNumber: 'M2102J20SG', releaseYear: 2022, originalStorageOptions: [64, 128], originalColors: ['Forest Green', 'Polar White', 'Star Blue'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 12',     modelNumber: 'M2207Y7NY', releaseYear: 2023, originalStorageOptions: [64, 128],  originalColors: ['Onyx Gray', 'Ice Blue', 'Mint Green'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 12 Pro', modelNumber: 'M2210N0G',  releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Black', 'Blue', 'Polar White'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 13',     modelNumber: 'X23FGO0B',  releaseYear: 2024, originalStorageOptions: [128, 256], originalColors: ['Arctic White', 'Graphite Black', 'Ocean Teal'] },
  { brand: 'Xiaomi', modelName: 'Redmi Note 13 Pro', modelNumber: 'X23C8SA',   releaseYear: 2024, originalStorageOptions: [128, 256], originalColors: ['Aurora Purple', 'Forest Green', 'Midnight Black', 'Ocean Teal'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 11 Lite 5G', modelNumber: 'M2101K9G',  releaseYear: 2021, originalStorageOptions: [128, 256], originalColors: ['Bubblegum Blue', 'Citrus Yellow', 'Jazz Blue', 'Peach Pink', 'Truffle Black'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 11T',        modelNumber: 'M2108K09G', releaseYear: 2021, originalStorageOptions: [128, 256], originalColors: ['Celestial Blue', 'Meteorite Gray', 'Moonlight White'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 11T Pro',    modelNumber: 'M2107K20G', releaseYear: 2021, originalStorageOptions: [128, 256], originalColors: ['Celestial Blue', 'Meteorite Gray', 'Moonlight White'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 12',         modelNumber: 'L12',       releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Blue', 'Gray', 'Green', 'Purple'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 12 Pro',     modelNumber: 'L12P',      releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Blue', 'Gray', 'Green', 'Purple'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 13',         modelNumber: '2211133G',  releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Black', 'Green', 'White'] },
  { brand: 'Xiaomi', modelName: 'Xiaomi 13 Pro',     modelNumber: '2210132G',  releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Ceramic Black', 'Ceramic White', 'Mountain Blue'] },
  { brand: 'Xiaomi', modelName: 'POCO X3 Pro',       modelNumber: 'M2102J20SG',releaseYear: 2021, originalStorageOptions: [128, 256], originalColors: ['Phantom Black', 'Frost Blue', 'Metal Bronze', 'Golden Bronze'] },
  { brand: 'Xiaomi', modelName: 'POCO X4 Pro 5G',    modelNumber: '2201116PG', releaseYear: 2022, originalStorageOptions: [128, 256], originalColors: ['Laser Black', 'Laser Blue', 'Poco Yellow'] },
  { brand: 'Xiaomi', modelName: 'POCO X5 Pro 5G',    modelNumber: '22101320G', releaseYear: 2023, originalStorageOptions: [128, 256], originalColors: ['Astral Black', 'Horizon Blue', 'Poco Yellow'] },
  { brand: 'Xiaomi', modelName: 'POCO M4 Pro',       modelNumber: '21091116AG',releaseYear: 2022, originalStorageOptions: [64, 128],  originalColors: ['Cool Blue', 'Power Black', 'Yellow'] },
  { brand: 'Xiaomi', modelName: 'POCO M5',           modelNumber: '22071219CG',releaseYear: 2022, originalStorageOptions: [64, 128],  originalColors: ['Black', 'Green', 'Yellow'] },

  // ─── Huawei (común en Venezuela) ─────────────────────────────────────────
  { brand: 'Huawei', modelName: 'P30 Lite',   modelNumber: 'MAR-LX1A', releaseYear: 2019, originalStorageOptions: [64, 128, 256], originalColors: ['Midnight Black', 'Pearl White', 'Peacock Blue'] },
  { brand: 'Huawei', modelName: 'P40 Lite',   modelNumber: 'JNY-LX1',  releaseYear: 2020, originalStorageOptions: [128],          originalColors: ['Crush Green', 'Midnight Black', 'Sakura Pink'] },
  { brand: 'Huawei', modelName: 'Y9 Prime',   modelNumber: 'STK-L21',  releaseYear: 2019, originalStorageOptions: [64, 128],      originalColors: ['Emerald Green', 'Midnight Black', 'Sapphire Blue'] },
  { brand: 'Huawei', modelName: 'Nova 9',     modelNumber: 'NAM-AL00', releaseYear: 2021, originalStorageOptions: [128],          originalColors: ['Black', 'Blue', 'Green', 'Pink'] },

  // ─── LG (común en Venezuela) ──────────────────────────────────────────────
  { brand: 'LG', modelName: 'LG K52',  modelNumber: 'LMK520',  releaseYear: 2020, originalStorageOptions: [64],  originalColors: ['Blue', 'Red', 'White'] },
  { brand: 'LG', modelName: 'LG K62',  modelNumber: 'LMK525HA',releaseYear: 2020, originalStorageOptions: [64],  originalColors: ['Blue', 'Red', 'Titan', 'White'] },
  { brand: 'LG', modelName: 'LG K92',  modelNumber: 'LMK920AM',releaseYear: 2020, originalStorageOptions: [128], originalColors: ['Titan'] },
  { brand: 'LG', modelName: 'LG Velvet',modelNumber: 'LM-G900N',releaseYear: 2020, originalStorageOptions: [128],originalColors: ['Aurora Gray', 'Aurora Silver', 'Aurora White', 'Illusion Sunset', 'New Black'] },
]

async function main() {
  console.log('🌱 Seeding device models...')

  let inserted = 0
  let skipped = 0

  for (const device of devices) {
    try {
      const existing = await prisma.deviceModel.findFirst({
        where: { brand: device.brand, modelName: device.modelName },
      })
      if (existing) {
        skipped++
        continue
      }
      await prisma.deviceModel.create({ data: device })
      inserted++
    } catch {
      skipped++
    }
  }

  console.log(`✅ Dispositivos: ${inserted} insertados, ${skipped} ya existían`)

  // Zonas seguras base
  const safeZones = [
    { name: 'Centro Comercial Sambil Caracas', type: 'mall' as const, city: 'Caracas', state: 'Distrito Capital', address: 'Av. Libertador, Chacao', googleMapsUrl: 'https://maps.google.com/?q=Sambil+Caracas', openingHours: { 'lun-dom': '10:00-21:00' } },
    { name: 'Centro Comercial Santa Fe', type: 'mall' as const, city: 'Caracas', state: 'Distrito Capital', address: 'Av. Santa Fe, Prados del Este', openingHours: { 'lun-dom': '10:00-21:00' } },
    { name: 'Centro Comercial El Recreo', type: 'mall' as const, city: 'Caracas', state: 'Distrito Capital', address: 'Av. Casanova, Sabana Grande', openingHours: { 'lun-dom': '10:00-20:00' } },
    { name: 'Centro Comercial Millennium', type: 'mall' as const, city: 'Maracaibo', state: 'Zulia', address: 'Av. 5 de Julio', openingHours: { 'lun-dom': '10:00-21:00' } },
    { name: 'Centro Comercial Lago Mall', type: 'mall' as const, city: 'Maracaibo', state: 'Zulia', address: 'Av. Circunvalación 2', openingHours: { 'lun-dom': '10:00-21:00' } },
  ]

  let zonesInserted = 0
  for (const zone of safeZones) {
    try {
      await prisma.safeZone.create({ data: zone })
      zonesInserted++
    } catch { /* ya existe */ }
  }

  console.log(`✅ Zonas seguras: ${zonesInserted} insertadas`)
  console.log(`\n📱 Total modelos disponibles: ${devices.length}`)
  console.log(`   Apple: ${devices.filter(d => d.brand === 'Apple').length}`)
  console.log(`   Samsung: ${devices.filter(d => d.brand === 'Samsung').length}`)
  console.log(`   Motorola: ${devices.filter(d => d.brand === 'Motorola').length}`)
  console.log(`   Xiaomi: ${devices.filter(d => d.brand === 'Xiaomi').length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
