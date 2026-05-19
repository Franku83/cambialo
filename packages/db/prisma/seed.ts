import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const devices = [
  // ─── Apple — iPhone 7 → iPhone 17 ────────────────────────────────────────
  { brand: 'Apple', modelName: 'iPhone 7',             modelNumber: 'A1778', releaseYear: 2016, originalStorageOptions: [32, 128, 256],        originalColors: ['Black', 'Jet Black', 'Silver', 'Gold', 'Rose Gold', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 7 Plus',        modelNumber: 'A1784', releaseYear: 2016, originalStorageOptions: [32, 128, 256],        originalColors: ['Black', 'Jet Black', 'Silver', 'Gold', 'Rose Gold', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 8',             modelNumber: 'A1905', releaseYear: 2017, originalStorageOptions: [64, 256],             originalColors: ['Silver', 'Space Gray', 'Gold', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 8 Plus',        modelNumber: 'A1897', releaseYear: 2017, originalStorageOptions: [64, 256],             originalColors: ['Silver', 'Space Gray', 'Gold', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone X',             modelNumber: 'A1901', releaseYear: 2017, originalStorageOptions: [64, 256],             originalColors: ['Silver', 'Space Gray'] },
  { brand: 'Apple', modelName: 'iPhone XS',            modelNumber: 'A2097', releaseYear: 2018, originalStorageOptions: [64, 256, 512],        originalColors: ['Silver', 'Space Gray', 'Gold'] },
  { brand: 'Apple', modelName: 'iPhone XS Max',        modelNumber: 'A2101', releaseYear: 2018, originalStorageOptions: [64, 256, 512],        originalColors: ['Silver', 'Space Gray', 'Gold'] },
  { brand: 'Apple', modelName: 'iPhone XR',            modelNumber: 'A2105', releaseYear: 2018, originalStorageOptions: [64, 128, 256],        originalColors: ['Black', 'White', 'Blue', 'Yellow', 'Coral', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 11',            modelNumber: 'A2221', releaseYear: 2019, originalStorageOptions: [64, 128, 256],        originalColors: ['Black', 'White', 'Green', 'Yellow', 'Purple', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 11 Pro',        modelNumber: 'A2215', releaseYear: 2019, originalStorageOptions: [64, 256, 512],        originalColors: ['Silver', 'Space Gray', 'Gold', 'Midnight Green'] },
  { brand: 'Apple', modelName: 'iPhone 11 Pro Max',    modelNumber: 'A2218', releaseYear: 2019, originalStorageOptions: [64, 256, 512],        originalColors: ['Silver', 'Space Gray', 'Gold', 'Midnight Green'] },
  { brand: 'Apple', modelName: 'iPhone SE (2da Gen)',  modelNumber: 'A2275', releaseYear: 2020, originalStorageOptions: [64, 128, 256],        originalColors: ['Black', 'White', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 12',            modelNumber: 'A2403', releaseYear: 2020, originalStorageOptions: [64, 128, 256],        originalColors: ['Black', 'White', 'Blue', 'Green', 'Purple', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 12 Mini',       modelNumber: 'A2399', releaseYear: 2020, originalStorageOptions: [64, 128, 256],        originalColors: ['Black', 'White', 'Blue', 'Green', 'Purple', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 12 Pro',        modelNumber: 'A2407', releaseYear: 2020, originalStorageOptions: [128, 256, 512],       originalColors: ['Silver', 'Graphite', 'Gold', 'Pacific Blue'] },
  { brand: 'Apple', modelName: 'iPhone 12 Pro Max',    modelNumber: 'A2411', releaseYear: 2020, originalStorageOptions: [128, 256, 512],       originalColors: ['Silver', 'Graphite', 'Gold', 'Pacific Blue'] },
  { brand: 'Apple', modelName: 'iPhone 13',            modelNumber: 'A2633', releaseYear: 2021, originalStorageOptions: [128, 256, 512],       originalColors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 13 Mini',       modelNumber: 'A2628', releaseYear: 2021, originalStorageOptions: [128, 256, 512],       originalColors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Green', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 13 Pro',        modelNumber: 'A2636', releaseYear: 2021, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Silver', 'Graphite', 'Gold', 'Sierra Blue', 'Alpine Green'] },
  { brand: 'Apple', modelName: 'iPhone 13 Pro Max',    modelNumber: 'A2641', releaseYear: 2021, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Silver', 'Graphite', 'Gold', 'Sierra Blue', 'Alpine Green'] },
  { brand: 'Apple', modelName: 'iPhone SE (3ra Gen)',  modelNumber: 'A2782', releaseYear: 2022, originalStorageOptions: [64, 128, 256],        originalColors: ['Midnight', 'Starlight', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 14',            modelNumber: 'A2882', releaseYear: 2022, originalStorageOptions: [128, 256, 512],       originalColors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Yellow', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 14 Plus',       modelNumber: 'A2886', releaseYear: 2022, originalStorageOptions: [128, 256, 512],       originalColors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Yellow', 'Red'] },
  { brand: 'Apple', modelName: 'iPhone 14 Pro',        modelNumber: 'A2890', releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
  { brand: 'Apple', modelName: 'iPhone 14 Pro Max',    modelNumber: 'A2894', releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
  { brand: 'Apple', modelName: 'iPhone 15',            modelNumber: 'A3089', releaseYear: 2023, originalStorageOptions: [128, 256, 512],       originalColors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
  { brand: 'Apple', modelName: 'iPhone 15 Plus',       modelNumber: 'A3093', releaseYear: 2023, originalStorageOptions: [128, 256, 512],       originalColors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
  { brand: 'Apple', modelName: 'iPhone 15 Pro',        modelNumber: 'A3101', releaseYear: 2023, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 15 Pro Max',    modelNumber: 'A3105', releaseYear: 2023, originalStorageOptions: [256, 512, 1024],      originalColors: ['Black Titanium', 'White Titanium', 'Blue Titanium', 'Natural Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 16',            modelNumber: 'A3287', releaseYear: 2024, originalStorageOptions: [128, 256, 512],       originalColors: ['Black', 'White', 'Teal', 'Pink', 'Ultramarine'] },
  { brand: 'Apple', modelName: 'iPhone 16 Plus',       modelNumber: 'A3291', releaseYear: 2024, originalStorageOptions: [128, 256, 512],       originalColors: ['Black', 'White', 'Teal', 'Pink', 'Ultramarine'] },
  { brand: 'Apple', modelName: 'iPhone 16 Pro',        modelNumber: 'A3293', releaseYear: 2024, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 16 Pro Max',    modelNumber: 'A3297', releaseYear: 2024, originalStorageOptions: [256, 512, 1024],      originalColors: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'] },
  { brand: 'Apple', modelName: 'iPhone 16e',           modelNumber: 'A3400', releaseYear: 2025, originalStorageOptions: [128, 256, 512],       originalColors: ['Black', 'White'] },
  { brand: 'Apple', modelName: 'iPhone 17',            modelNumber: 'A3800', releaseYear: 2025, originalStorageOptions: [256, 512],            originalColors: ['Black', 'White', 'Lavender', 'Mist Blue', 'Sage'] },
  { brand: 'Apple', modelName: 'iPhone 17 Air',        modelNumber: 'A3810', releaseYear: 2025, originalStorageOptions: [256, 512],            originalColors: ['Black', 'White', 'Sky Blue'] },
  { brand: 'Apple', modelName: 'iPhone 17 Pro',        modelNumber: 'A3820', releaseYear: 2025, originalStorageOptions: [256, 512, 1024],      originalColors: ['Black', 'White', 'Cosmic Orange', 'Natural'] },
  { brand: 'Apple', modelName: 'iPhone 17 Pro Max',    modelNumber: 'A3830', releaseYear: 2025, originalStorageOptions: [256, 512, 1024, 2048], originalColors: ['Black', 'White', 'Cosmic Orange', 'Natural'] },

  // ─── Samsung — Serie S (S7 → S26) ─────────────────────────────────────────
  { brand: 'Samsung', modelName: 'Galaxy S7',          modelNumber: 'SM-G930F',  releaseYear: 2016, originalStorageOptions: [32, 64],           originalColors: ['Black Onyx', 'White Pearl', 'Gold Platinum', 'Silver Titanium'] },
  { brand: 'Samsung', modelName: 'Galaxy S7 Edge',     modelNumber: 'SM-G935F',  releaseYear: 2016, originalStorageOptions: [32, 64, 128],       originalColors: ['Black Onyx', 'White Pearl', 'Gold Platinum', 'Silver Titanium', 'Blue Coral', 'Pink Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S8',          modelNumber: 'SM-G950F',  releaseYear: 2017, originalStorageOptions: [64],               originalColors: ['Midnight Black', 'Orchid Gray', 'Arctic Silver', 'Coral Blue', 'Maple Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S8+',         modelNumber: 'SM-G955F',  releaseYear: 2017, originalStorageOptions: [64],               originalColors: ['Midnight Black', 'Orchid Gray', 'Arctic Silver', 'Coral Blue', 'Maple Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S9',          modelNumber: 'SM-G960F',  releaseYear: 2018, originalStorageOptions: [64, 128, 256],      originalColors: ['Midnight Black', 'Titanium Gray', 'Coral Blue', 'Lilac Purple'] },
  { brand: 'Samsung', modelName: 'Galaxy S9+',         modelNumber: 'SM-G965F',  releaseYear: 2018, originalStorageOptions: [64, 128, 256],      originalColors: ['Midnight Black', 'Titanium Gray', 'Coral Blue', 'Lilac Purple', 'Sunrise Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S10e',        modelNumber: 'SM-G970F',  releaseYear: 2019, originalStorageOptions: [128, 256],          originalColors: ['Prism Black', 'Prism White', 'Prism Blue', 'Prism Green', 'Canary Yellow', 'Flamingo Pink'] },
  { brand: 'Samsung', modelName: 'Galaxy S10',         modelNumber: 'SM-G973F',  releaseYear: 2019, originalStorageOptions: [128, 512],          originalColors: ['Prism Black', 'Prism White', 'Prism Blue', 'Prism Green'] },
  { brand: 'Samsung', modelName: 'Galaxy S10+',        modelNumber: 'SM-G975F',  releaseYear: 2019, originalStorageOptions: [128, 512, 1024],    originalColors: ['Prism Black', 'Prism White', 'Prism Blue', 'Prism Green', 'Ceramic Black', 'Ceramic White'] },
  { brand: 'Samsung', modelName: 'Galaxy S10 5G',      modelNumber: 'SM-G977B',  releaseYear: 2019, originalStorageOptions: [256, 512],          originalColors: ['Majestic Black', 'Royal Gold', 'Crown Silver'] },
  { brand: 'Samsung', modelName: 'Galaxy S20',         modelNumber: 'SM-G980F',  releaseYear: 2020, originalStorageOptions: [128],              originalColors: ['Cosmic Gray', 'Cloud Blue', 'Cloud Pink', 'Cloud White'] },
  { brand: 'Samsung', modelName: 'Galaxy S20+',        modelNumber: 'SM-G985F',  releaseYear: 2020, originalStorageOptions: [128, 256],          originalColors: ['Cosmic Gray', 'Cloud Blue', 'Cosmic Black', 'Cloud White', 'Aura Red'] },
  { brand: 'Samsung', modelName: 'Galaxy S20 Ultra',   modelNumber: 'SM-G988B',  releaseYear: 2020, originalStorageOptions: [128, 256, 512],     originalColors: ['Cosmic Gray', 'Cosmic Black', 'Cloud White'] },
  { brand: 'Samsung', modelName: 'Galaxy S20 FE',      modelNumber: 'SM-G780F',  releaseYear: 2020, originalStorageOptions: [128, 256],          originalColors: ['Cloud Navy', 'Cloud Lavender', 'Cloud Mint', 'Cloud White', 'Cloud Orange', 'Cloud Red'] },
  { brand: 'Samsung', modelName: 'Galaxy S21',         modelNumber: 'SM-G991B',  releaseYear: 2021, originalStorageOptions: [128, 256],          originalColors: ['Phantom Gray', 'Phantom White', 'Phantom Pink', 'Phantom Violet', 'Phantom Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S21+',        modelNumber: 'SM-G996B',  releaseYear: 2021, originalStorageOptions: [128, 256],          originalColors: ['Phantom Black', 'Phantom Silver', 'Phantom Violet', 'Phantom Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S21 Ultra',   modelNumber: 'SM-G998B',  releaseYear: 2021, originalStorageOptions: [128, 256, 512],     originalColors: ['Phantom Black', 'Phantom Silver', 'Phantom Titanium', 'Phantom Navy', 'Phantom Brown'] },
  { brand: 'Samsung', modelName: 'Galaxy S21 FE',      modelNumber: 'SM-G990B',  releaseYear: 2022, originalStorageOptions: [128, 256],          originalColors: ['Graphite', 'White', 'Lavender', 'Olive'] },
  { brand: 'Samsung', modelName: 'Galaxy S22',         modelNumber: 'SM-S901B',  releaseYear: 2022, originalStorageOptions: [128, 256],          originalColors: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold', 'Sky Blue', 'Violet', 'Cream', 'Graphite'] },
  { brand: 'Samsung', modelName: 'Galaxy S22+',        modelNumber: 'SM-S906B',  releaseYear: 2022, originalStorageOptions: [128, 256],          originalColors: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold', 'Sky Blue', 'Violet', 'Cream', 'Graphite'] },
  { brand: 'Samsung', modelName: 'Galaxy S22 Ultra',   modelNumber: 'SM-S908B',  releaseYear: 2022, originalStorageOptions: [128, 256, 512, 1024], originalColors: ['Phantom Black', 'Phantom White', 'Green', 'Burgundy', 'Sky Blue', 'Violet', 'Graphite', 'Red'] },
  { brand: 'Samsung', modelName: 'Galaxy S23',         modelNumber: 'SM-S911B',  releaseYear: 2023, originalStorageOptions: [128, 256],          originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender', 'Graphite', 'Lime', 'Red', 'Sky Blue'] },
  { brand: 'Samsung', modelName: 'Galaxy S23+',        modelNumber: 'SM-S916B',  releaseYear: 2023, originalStorageOptions: [256, 512],          originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender', 'Graphite', 'Lime', 'Red', 'Sky Blue'] },
  { brand: 'Samsung', modelName: 'Galaxy S23 Ultra',   modelNumber: 'SM-S918B',  releaseYear: 2023, originalStorageOptions: [256, 512, 1024],    originalColors: ['Phantom Black', 'Cream', 'Green', 'Lavender', 'Graphite', 'Lime', 'Red', 'Sky Blue'] },
  { brand: 'Samsung', modelName: 'Galaxy S23 FE',      modelNumber: 'SM-S711B',  releaseYear: 2023, originalStorageOptions: [128, 256],          originalColors: ['Graphite', 'Cream', 'Mint', 'Purple', 'Tangerine', 'Indigo'] },
  { brand: 'Samsung', modelName: 'Galaxy S24',         modelNumber: 'SM-S921B',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow', 'Jade Green', 'Sapphire Blue', 'Sandstone Orange'] },
  { brand: 'Samsung', modelName: 'Galaxy S24+',        modelNumber: 'SM-S926B',  releaseYear: 2024, originalStorageOptions: [256, 512],          originalColors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow', 'Jade Green', 'Sapphire Blue', 'Sandstone Orange'] },
  { brand: 'Samsung', modelName: 'Galaxy S24 Ultra',   modelNumber: 'SM-S928B',  releaseYear: 2024, originalStorageOptions: [256, 512, 1024],    originalColors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow', 'Titanium Green', 'Titanium Blue', 'Titanium Orange'] },
  { brand: 'Samsung', modelName: 'Galaxy S24 FE',      modelNumber: 'SM-S721B',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Graphite', 'Blue', 'Mint', 'Yellow', 'Gray'] },
  { brand: 'Samsung', modelName: 'Galaxy S25',         modelNumber: 'SM-S931B',  releaseYear: 2025, originalStorageOptions: [128, 256, 512],     originalColors: ['Icy Blue', 'Mint', 'Navy', 'Silver Shadow', 'Blue Black', 'Coral Red', 'Pink Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S25+',        modelNumber: 'SM-S936B',  releaseYear: 2025, originalStorageOptions: [256, 512],          originalColors: ['Icy Blue', 'Mint', 'Navy', 'Silver Shadow', 'Blue Black', 'Coral Red', 'Pink Gold'] },
  { brand: 'Samsung', modelName: 'Galaxy S25 Ultra',   modelNumber: 'SM-S938B',  releaseYear: 2025, originalStorageOptions: [256, 512, 1024],    originalColors: ['Titanium Silver Blue', 'Titanium Black', 'Titanium White Silver', 'Titanium Jade Green', 'Titanium Pink Gold', 'Titanium Jet Black'] },
  { brand: 'Samsung', modelName: 'Galaxy S25 Edge',    modelNumber: 'SM-S937B',  releaseYear: 2025, originalStorageOptions: [256, 512],          originalColors: ['Titanium Icy Blue', 'Titanium Silver', 'Titanium Jet Black'] },
  { brand: 'Samsung', modelName: 'Galaxy S26',         modelNumber: 'SM-S941B',  releaseYear: 2026, originalStorageOptions: [128, 256, 512],     originalColors: ['Black', 'White', 'Blue', 'Green'] },
  { brand: 'Samsung', modelName: 'Galaxy S26+',        modelNumber: 'SM-S946B',  releaseYear: 2026, originalStorageOptions: [256, 512],          originalColors: ['Black', 'White', 'Blue', 'Green'] },
  { brand: 'Samsung', modelName: 'Galaxy S26 Ultra',   modelNumber: 'SM-S948B',  releaseYear: 2026, originalStorageOptions: [256, 512, 1024],    originalColors: ['Titanium Black', 'Titanium White', 'Titanium Blue', 'Titanium Green'] },

  // ─── Samsung — Serie A ────────────────────────────────────────────────────
  { brand: 'Samsung', modelName: 'Galaxy A03',         modelNumber: 'SM-A035F',  releaseYear: 2021, originalStorageOptions: [32, 64],           originalColors: ['Black', 'Blue', 'Red', 'White'] },
  { brand: 'Samsung', modelName: 'Galaxy A03s',        modelNumber: 'SM-A037F',  releaseYear: 2021, originalStorageOptions: [32, 64],           originalColors: ['Black', 'Blue', 'White'] },
  { brand: 'Samsung', modelName: 'Galaxy A04s',        modelNumber: 'SM-A047F',  releaseYear: 2022, originalStorageOptions: [32, 64, 128],       originalColors: ['Black', 'White', 'Green', 'Copper'] },
  { brand: 'Samsung', modelName: 'Galaxy A05',         modelNumber: 'SM-A055F',  releaseYear: 2023, originalStorageOptions: [64, 128],           originalColors: ['Black', 'Silver', 'Light Blue', 'Light Green'] },
  { brand: 'Samsung', modelName: 'Galaxy A05s',        modelNumber: 'SM-A057F',  releaseYear: 2023, originalStorageOptions: [64, 128],           originalColors: ['Black', 'White', 'Light Green', 'Light Violet'] },
  { brand: 'Samsung', modelName: 'Galaxy A06',         modelNumber: 'SM-A065F',  releaseYear: 2024, originalStorageOptions: [64, 128],           originalColors: ['Black', 'Gold', 'Light Blue'] },
  { brand: 'Samsung', modelName: 'Galaxy A13',         modelNumber: 'SM-A135F',  releaseYear: 2022, originalStorageOptions: [32, 64, 128],       originalColors: ['Black', 'White', 'Blue', 'Peach'] },
  { brand: 'Samsung', modelName: 'Galaxy A14',         modelNumber: 'SM-A145F',  releaseYear: 2023, originalStorageOptions: [64, 128],           originalColors: ['Black', 'Silver', 'Light Green', 'Dark Red'] },
  { brand: 'Samsung', modelName: 'Galaxy A15',         modelNumber: 'SM-A155F',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Black', 'Blue', 'Light Blue', 'Yellow', 'Light Green'] },
  { brand: 'Samsung', modelName: 'Galaxy A16',         modelNumber: 'SM-A165F',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Black', 'Gold', 'Light Green', 'Light Blue'] },
  { brand: 'Samsung', modelName: 'Galaxy A23',         modelNumber: 'SM-A235F',  releaseYear: 2022, originalStorageOptions: [64, 128],           originalColors: ['Black', 'White', 'Blue', 'Peach'] },
  { brand: 'Samsung', modelName: 'Galaxy A24',         modelNumber: 'SM-A245F',  releaseYear: 2023, originalStorageOptions: [128],              originalColors: ['Black', 'Light Green', 'Dark Red'] },
  { brand: 'Samsung', modelName: 'Galaxy A25',         modelNumber: 'SM-A256B',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Black', 'Blue', 'Yellow', 'Light Blue'] },
  { brand: 'Samsung', modelName: 'Galaxy A26',         modelNumber: 'SM-A266B',  releaseYear: 2025, originalStorageOptions: [128, 256],          originalColors: ['Black', 'Blue', 'White', 'Light Green'] },
  { brand: 'Samsung', modelName: 'Galaxy A33 5G',      modelNumber: 'SM-A336B',  releaseYear: 2022, originalStorageOptions: [128],              originalColors: ['Awesome Black', 'Awesome White', 'Awesome Blue', 'Awesome Peach'] },
  { brand: 'Samsung', modelName: 'Galaxy A34 5G',      modelNumber: 'SM-A346B',  releaseYear: 2023, originalStorageOptions: [128, 256],          originalColors: ['Awesome Black', 'Awesome Silver', 'Awesome Violet', 'Awesome Lime'] },
  { brand: 'Samsung', modelName: 'Galaxy A35',         modelNumber: 'SM-A356B',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Awesome Black', 'Awesome Iceblue', 'Awesome Lilac', 'Awesome Lemon'] },
  { brand: 'Samsung', modelName: 'Galaxy A36',         modelNumber: 'SM-A366B',  releaseYear: 2025, originalStorageOptions: [128, 256],          originalColors: ['Black', 'Blue', 'White', 'Lavender'] },
  { brand: 'Samsung', modelName: 'Galaxy A53 5G',      modelNumber: 'SM-A536B',  releaseYear: 2022, originalStorageOptions: [128, 256],          originalColors: ['Awesome Black', 'Awesome White', 'Awesome Blue', 'Awesome Peach'] },
  { brand: 'Samsung', modelName: 'Galaxy A54 5G',      modelNumber: 'SM-A546B',  releaseYear: 2023, originalStorageOptions: [128, 256],          originalColors: ['Awesome Black', 'Awesome White', 'Awesome Violet', 'Awesome Lime'] },
  { brand: 'Samsung', modelName: 'Galaxy A55',         modelNumber: 'SM-A556B',  releaseYear: 2024, originalStorageOptions: [128, 256],          originalColors: ['Awesome Black', 'Awesome Iceblue', 'Awesome Lilac', 'Awesome Lemon'] },
  { brand: 'Samsung', modelName: 'Galaxy A56',         modelNumber: 'SM-A566B',  releaseYear: 2025, originalStorageOptions: [128, 256],          originalColors: ['Black', 'Blue', 'White', 'Light Green'] },
  { brand: 'Samsung', modelName: 'Galaxy A73',         modelNumber: 'SM-A736B',  releaseYear: 2022, originalStorageOptions: [128, 256],          originalColors: ['Awesome Black', 'Awesome White', 'Awesome Blue', 'Awesome Mint'] },

  // ─── Samsung — Foldables ──────────────────────────────────────────────────
  { brand: 'Samsung', modelName: 'Galaxy Z Fold5',     modelNumber: 'SM-F946B',  releaseYear: 2023, originalStorageOptions: [256, 512, 1024],    originalColors: ['Icy Blue', 'Phantom Black', 'Cream'] },
  { brand: 'Samsung', modelName: 'Galaxy Z Flip5',     modelNumber: 'SM-F731B',  releaseYear: 2023, originalStorageOptions: [256, 512],          originalColors: ['Mint', 'Lavender', 'Graphite', 'Cream'] },
  { brand: 'Samsung', modelName: 'Galaxy Z Fold6',     modelNumber: 'SM-F956B',  releaseYear: 2024, originalStorageOptions: [256, 512, 1024],    originalColors: ['Crafted Black', 'Pink', 'Silver Shadow'] },
  { brand: 'Samsung', modelName: 'Galaxy Z Flip6',     modelNumber: 'SM-F741B',  releaseYear: 2024, originalStorageOptions: [256, 512],          originalColors: ['Silver Shadow', 'Yellow', 'Blue', 'White', 'Mint', 'Peach'] },
]

async function main() {
  console.log('🌱 Seeding device models...')

  let inserted = 0
  let updated = 0

  for (const device of devices) {
    const existing = await prisma.deviceModel.findFirst({
      where: { brand: device.brand, modelName: device.modelName },
    })
    if (existing) {
      await prisma.deviceModel.update({
        where: { id: existing.id },
        data: device,
      })
      updated++
    } else {
      await prisma.deviceModel.create({ data: device })
      inserted++
    }
  }

  console.log(`✅ Dispositivos: ${inserted} insertados, ${updated} actualizados`)

  // Desactivar modelos de marcas removidas (Motorola, Xiaomi, Huawei, LG)
  const deactivated = await prisma.deviceModel.updateMany({
    where: { brand: { in: ['Motorola', 'Xiaomi', 'Huawei', 'LG'] } },
    data: { isActive: false },
  })
  if (deactivated.count > 0) {
    console.log(`🚫 ${deactivated.count} modelos de marcas removidas desactivados`)
  }

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
  console.log(`\n📱 Total modelos activos: ${devices.length}`)
  console.log(`   Apple: ${devices.filter(d => d.brand === 'Apple').length}`)
  console.log(`   Samsung: ${devices.filter(d => d.brand === 'Samsung').length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
