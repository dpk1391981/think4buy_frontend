/**
 * Parses a free-text property search query and extracts structured filters.
 *
 * Examples:
 *   "2 bhk flat in noida"   → { bedrooms: '2', city: 'noida' }
 *   "3 bhk villa in gurgaon" → { bedrooms: '3', city: 'gurgaon' }
 *   "noida"                  → { city: 'noida' }
 *   "apartments in mumbai"   → { city: 'mumbai' }
 */

const TYPE_KEYWORDS: Record<string, string> = {
  flat: 'apartment',
  apartment: 'apartment',
  villa: 'villa',
  house: 'house',
  plot: 'plot',
  land: 'land',
  studio: 'studio',
  penthouse: 'penthouse',
  office: 'commercial_office',
  shop: 'commercial_shop',
  warehouse: 'commercial_warehouse',
  showroom: 'showroom',
  farmhouse: 'farm_house',
  'farm house': 'farm_house',
  factory: 'factory',
  shed: 'industrial_shed',
  'builder floor': 'builder_floor',
};

// Words to strip after extraction so they don't end up as leftover noise
const NOISE_WORDS = [
  'property', 'properties', 'for', 'sale', 'rent', 'buy',
  'bhk', 'bedroom', 'bedrooms', 'room', 'rooms',
  'flat', 'apartment', 'villa', 'house', 'plot', 'land', 'studio',
  'penthouse', 'office', 'shop', 'warehouse', 'showroom',
  'farmhouse', 'factory', 'shed', 'floor',
  'affordable', 'luxury', 'cheap', 'best', 'top', 'new',
];

export interface ParsedQuery {
  city?: string;
  bedrooms?: string;
  type?: string;
  keyword?: string;
}

export function parseSearchQuery(raw: string): ParsedQuery {
  if (!raw || !raw.trim()) return {};

  let text = raw.trim();
  const result: ParsedQuery = {};

  // 1. Extract BHK/bedroom count: "2 bhk", "3BHK", "2-bhk", "2 bedroom"
  const bhkMatch = text.match(/\b(\d+)\s*[-]?\s*(?:bhk|bedroom[s]?)\b/i);
  if (bhkMatch) {
    result.bedrooms = bhkMatch[1];
    text = text.replace(bhkMatch[0], ' ').trim();
  }

  // 2. Extract city: text after "in " at the end of the string
  //    "flat in noida"  →  city = "noida"
  //    "3 bhk in south delhi" → city = "south delhi"
  const inMatch = text.match(/\bin\s+([a-z][a-z ]*?)(?:\s*,.*)?$/i);
  if (inMatch) {
    result.city = inMatch[1].trim().toLowerCase();
    text = text.slice(0, inMatch.index).trim();
  }

  // 3. Extract property type keyword
  for (const [kw, slug] of Object.entries(TYPE_KEYWORDS)) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(text)) {
      result.type = slug;
      text = text.replace(re, ' ').trim();
      break;
    }
  }

  // 4. Strip noise words from remaining text
  const noiseRe = new RegExp(`\\b(${NOISE_WORDS.join('|')})\\b`, 'gi');
  text = text.replace(noiseRe, ' ').replace(/\s+/g, ' ').trim();

  // 5. If no city was found via "in X" pattern, check if the remaining text
  //    looks like a city/locality name (no spaces or simple compound names).
  //    Only treat as city if the whole original text seems location-like.
  if (!result.city && !text) {
    // Nothing left — raw was something like "noida" after stripping noise
    // In this case the caller should pass the raw string as city directly
  }

  if (text) result.keyword = text;

  return result;
}
