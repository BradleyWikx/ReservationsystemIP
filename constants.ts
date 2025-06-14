
import { PackageOption, MerchandiseItem, SpecialAddOn, PriceComponent, ShowType } from './types';

// These VAT rates are now defaults/fallbacks if not fetched from settings
const DEFAULT_HIGH_VAT_RATE = 21;
const DEFAULT_LOW_VAT_RATE = 9;

// Note: Price components should ideally be dynamic based on AppSettings.
// For pure frontend, these defaults are used.
const defaultPriceComponentsRegular: PriceComponent[] = [
  { description: "Voeding & Non-alcoholisch", percentageOfTotalPrice: 60, vatRate: DEFAULT_LOW_VAT_RATE },
  { description: "Alcohol & Entertainment", percentageOfTotalPrice: 40, vatRate: DEFAULT_HIGH_VAT_RATE },
];

const defaultPriceComponentsHeroes: PriceComponent[] = [ 
  { description: "Voeding & Non-alcoholisch (Helden Tarief)", percentageOfTotalPrice: 65, vatRate: DEFAULT_LOW_VAT_RATE },
  { description: "Alcohol & Entertainment (Helden Tarief)", percentageOfTotalPrice: 35, vatRate: DEFAULT_HIGH_VAT_RATE },
];


export const SHOW_PACKAGES: PackageOption[] = [
  {
    id: 'vrijdag-zaterdag-80',
    name: "€80 Arrangement (Vr-Za)",
    price: 80,
    days: "Vrijdag - Zaterdag",
    description: "Voorstelling, dinerbuffet, voor- en nagerecht, drankassortiment.",
    details: ["Bier", "Wijn", "Fris", "Port & Martini"],
    priceComponents: defaultPriceComponentsRegular,
  },
  {
    id: 'vrijdag-zaterdag-95',
    name: "€95 Arrangement (Vr-Za)",
    price: 95,
    days: "Vrijdag - Zaterdag",
    description: "Alles van €80 arrangement + extra dranken.",
    details: ["Bier", "Wijn", "Fris", "Port & Martini", "Sterke drank", "Speciale bieren", "Bubbels van het huis"],
    priceComponents: defaultPriceComponentsRegular,
  },
  {
    id: 'zondag-donderdag-70',
    name: "€70 Arrangement (Zo-Do)",
    price: 70,
    days: "Zondag tot Donderdag (avond)",
    description: "Voorstelling, dinerbuffet, voor- en nagerecht, drankassortiment.",
    details: ["Bier", "Wijn", "Fris", "Port & Martini"],
    priceComponents: defaultPriceComponentsRegular,
  },
  {
    id: 'zondag-donderdag-85',
    name: "€85 Arrangement (Zo-Do)",
    price: 85,
    days: "Zondag tot Donderdag (avond)",
    description: "Alles van €70 arrangement + extra dranken.",
    details: ["Bier", "Wijn", "Fris", "Port & Martini", "Sterke drank", "Speciale bieren", "Bubbels van het huis"],
    priceComponents: defaultPriceComponentsRegular,
  },
  {
    id: 'zorgzame-helden-avond-65',
    name: "€65 Zorgzame Helden Avond",
    price: 65,
    description: "Speciaal voor helden uit zorg, politie, defensie, onderwijs. Basis dranken. (Avondvoorstelling)",
    details: ["Bier", "Wijn", "Fris", "Port & Martini"],
    colorCode: "bg-sky-600", // Tailwind class
    priceComponents: defaultPriceComponentsHeroes,
  },
  {
    id: 'zorgzame-helden-avond-80',
    name: "€80 Zorgzame Helden Avond Plus",
    price: 80,
    description: "Speciaal voor helden. Uitgebreide dranken. (Avondvoorstelling)",
    details: ["Bier", "Wijn", "Fris", "Port & Martini", "Sterke drank", "Speciale bieren", "Bubbels van het huis"],
    colorCode: "bg-sky-700", // Tailwind class
    priceComponents: defaultPriceComponentsHeroes,
  },
  {
    id: 'zorgzame-helden-matinee-60',
    name: "€60 Zorgzame Helden Matinee (Zo)",
    price: 60,
    days: "Zondag (matinee)",
    description: "Speciale matinee voor helden uit zorg, politie, defensie, onderwijs. Basis dranken.",
    details: ["Bier", "Wijn", "Fris", "Port & Martini"],
    colorCode: "bg-teal-500", // Tailwind class
    priceComponents: defaultPriceComponentsHeroes,
  },
  {
    id: 'zorgzame-helden-matinee-75',
    name: "€75 Zorgzame Helden Matinee Plus (Zo)",
    price: 75,
    days: "Zondag (matinee)",
    description: "Speciale matinee voor helden. Uitgebreide dranken.",
    details: ["Bier", "Wijn", "Fris", "Port & Martini", "Sterke drank", "Speciale bieren", "Bubbels van het huis"],
    colorCode: "bg-teal-600", // Tailwind class
    priceComponents: defaultPriceComponentsHeroes,
  }
];

export const SPECIAL_ADDONS: SpecialAddOn[] = [
  {
    id: 'voorborrel',
    name: "Borrel Vooraf",
    price: 15,
    description: "Gezellige ruimte met drankarrangement en warme snacks, 1 uur voor aanvang van de show.",
    timing: "1 uur voor de show",
    minPersons: 25,
    vatRate: DEFAULT_HIGH_VAT_RATE, 
  },
  {
    id: 'naborrel',
    name: "AfterParty",
    price: 15,
    description: "Genieten in ons bruin café of de Sprookjes Salon met drankjes, hapjes en eventueel live muziek, 1 uur na afloop van de show.",
    timing: "1 uur na de show",
    vatRate: DEFAULT_HIGH_VAT_RATE, 
  }
];

export const MERCHANDISE_ITEMS: MerchandiseItem[] = [
  {
    id: 'merch-feestpakket',
    name: 'Welkom in de Buurt Feestpakket',
    category: 'Feestpakketten',
    description: 'Verpakt in een vrolijke rugzak: LED diadeem, verrekijker, fun-foamstick, lichtgevende bloemenkrans, flyer.',
    priceInclVAT: 12.50,
    imageUrl: 'https://storage.googleapis.com/generativeai-downloads/images/985c5f232b1b211c/inspiration-point-merch-feestpakket.png',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-rugzak',
    name: 'ZAK MAAR LEKKER DOOR Rugzak',
    category: 'Losse Artikelen',
    description: 'Een duurzame Inspiration Point rugzak.',
    priceInclVAT: 5.00,
    imageUrl: 'https://picsum.photos/seed/rugzak/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-diadeem',
    name: 'OGEN OP STEELTJES Diadeem',
    category: 'Losse Artikelen',
    description: 'Een LED diadeem met knipperende oogjes.',
    priceInclVAT: 5.00,
    imageUrl: 'https://picsum.photos/seed/diadeem/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-verrekijker',
    name: 'GLUREN NAAR DE BUREN Verrekijker',
    category: 'Losse Artikelen',
    description: 'Een verrekijker om elkaar én het podium mee in de gaten te houden.',
    priceInclVAT: 5.00,
    imageUrl: 'https://picsum.photos/seed/verrekijker/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-foamstick',
    name: 'ZWIEREN & ZWAAIEN Foamstick',
    category: 'Losse Artikelen',
    description: 'Een fun-foamstick om mee te swingen en lastige buren van u af te slaan.',
    priceInclVAT: 2.50,
    imageUrl: 'https://picsum.photos/seed/foamstick/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-bloemenkrans',
    name: 'OMRINGD DOOR LIEFDE Bloemenkrans',
    category: 'Losse Artikelen',
    description: 'Een vrolijke lichtgevende bloemenkrans.',
    priceInclVAT: 5.00,
    imageUrl: 'https://picsum.photos/seed/bloemenkrans/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-pet-pretinbed',
    name: 'Pet: MEER PRET IN BED MET EEN BEETJE VET',
    category: 'Leuke Spreuken Petten',
    description: 'Een ‘Leuke Spreuken’-pet.',
    priceInclVAT: 7.50,
    imageUrl: 'https://picsum.photos/seed/pet1/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-pet-veeltedun',
    name: 'Pet: VEEL TE DUN IS OOK GEEN FUN',
    category: 'Leuke Spreuken Petten',
    description: 'Een ‘Leuke Spreuken’-pet.',
    priceInclVAT: 7.50,
    imageUrl: 'https://picsum.photos/seed/pet2/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-pet-lekkergluren',
    name: 'Pet: LEKKER GLUREN NAAR DE BUREN',
    category: 'Leuke Spreuken Petten',
    description: 'Een ‘Leuke Spreuken’-pet.',
    priceInclVAT: 7.50,
    imageUrl: 'https://picsum.photos/seed/pet3/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-pet-zielventiel',
    name: 'Pet: MIJN ZIEL HEEFT EEN VENTIEL',
    category: 'Leuke Spreuken Petten',
    description: 'Een ‘Leuke Spreuken’-pet (maar het dopje ben ik kwijt).',
    priceInclVAT: 7.50,
    imageUrl: 'https://picsum.photos/seed/pet4/100/100',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-pet-geenzeik',
    name: 'Pet: GEEN GEZEIK IN ONZE WIJK',
    category: 'Leuke Spreuken Petten',
    description: 'Een ‘Leuke Spreuken’-pet.',
    priceInclVAT: 7.50,
    imageUrl: 'https://storage.googleapis.com/generativeai-downloads/images/f5122dbfd90764c3/inspiration-point-merch-pet.png',
    vatRate: DEFAULT_HIGH_VAT_RATE,
  },
  {
    id: 'merch-bloemstuk',
    name: 'De Buren in de Bloemen',
    category: 'Specials',
    description: 'Feestelijk bloemstukje in uniek vaasje. Feestvarken(s) in spotlight tijdens show.',
    priceInclVAT: 20.00,
    imageUrl: 'https://storage.googleapis.com/generativeai-downloads/images/7b0a892a310240c8/inspiration-point-merch-bloemstuk.png',
    vatRate: DEFAULT_LOW_VAT_RATE, 
  },
];

export const SHOW_TYPE_COLORS: Record<ShowType, string> = {
  [ShowType.REGULAR]: '#4f46e5', // indigo-600
  [ShowType.MATINEE]: '#10b981', // emerald-500
  [ShowType.ZORGZAME_HELDEN]: '#0ea5e9', // sky-500
  [ShowType.SPECIAL_EVENT]: '#f59e0b', // amber-500
};
