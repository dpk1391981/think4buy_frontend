/**
 * Smart property search query parser — extracts structured filters from free text.
 *
 * Examples:
 *   "2 bhk flat in noida under 50 lakh"   → { bedrooms:'2', type:'apartment', city:'noida', maxPrice:5000000 }
 *   "3 bhk villa for rent in gurgaon"      → { bedrooms:'3', type:'villa', city:'gurgaon', category:'rent' }
 *   "office space in bangalore"            → { type:'commercial_office', city:'bangalore', category:'commercial' }
 *   "pg in delhi"                          → { city:'delhi', category:'pg' }
 *   "noida"                                → { city:'noida' }
 */

// ─── Type → slug mapping (synonyms + aliases) ────────────────────────────────

const TYPE_KEYWORDS: Array<[RegExp, string]> = [
  // Must check multi-word first
  [/\bbuilder\s+floor\b/i,             'builder_floor'],
  [/\bfarm\s*house\b/i,                'farm_house'],
  [/\bindependent\s+(?:house|floor)\b/i, 'independent_house'],
  [/\bservice\s+apartment\b/i,         'apartment'],
  // Single-word
  [/\b(?:flat|apartment|unit|flats|apartments)\b/i,   'apartment'],
  [/\bvilla(?:s)?\b/i,                 'villa'],
  [/\b(?:house|home|bungalow|bungalows|cottage)\b/i,  'house'],
  [/\b(?:plot|plots|land|lands)\b/i,   'plot'],
  [/\bstudio\b/i,                      'studio'],
  [/\b1\s*rk\b/i,                      'studio'],
  [/\bpenthouse\b/i,                   'penthouse'],
  [/\b(?:office|offices|workspace|coworking)\b/i,     'commercial_office'],
  [/\b(?:shop|shops|retail|showroom|showrooms)\b/i,   'commercial_shop'],
  [/\bwarehouse\b/i,                   'commercial_warehouse'],
  [/\bfactory\b/i,                     'factory'],
  [/\b(?:shed|industrial\s+shed)\b/i,  'industrial_shed'],
];

// ─── Category detection from query ──────────────────────────────────────────

const CATEGORY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:for\s+)?rent(?:al)?\b/i,       'rent'],
  [/\b(?:to\s+)?lease\b/i,              'rent'],
  [/\b(?:on\s+)?lease\b/i,              'rent'],
  [/\bpg\b/i,                           'pg'],
  [/\bpaying\s+guest\b/i,               'pg'],
  [/\bhostel\b/i,                       'pg'],
  [/\bcommercial\b/i,                   'commercial'],
  [/\bindustrial\b/i,                   'industrial'],
  [/\bnew\s+project(?:s)?\b/i,          'new_projects'],
  [/\bbuilder\s+project(?:s)?\b/i,      'builder_project'],
  [/\binvestment\b/i,                   'investment'],
  // "for sale" / "to buy" → buy (default, but set explicitly)
  [/\bfor\s+sale\b/i,                   'buy'],
  [/\b(?:to\s+buy|purchase)\b/i,        'buy'],
];

// ─── Price unit multipliers ─────────────────────────────────────────────────

const PRICE_UNIT: Record<string, number> = {
  lakh:   100_000,
  lac:    100_000,
  l:      100_000,
  crore:  10_000_000,
  cr:     10_000_000,
  k:      1_000,
  thousand: 1_000,
};

function parseAmount(num: string, unit: string): number {
  return Math.round(parseFloat(num) * (PRICE_UNIT[unit.toLowerCase()] ?? 1));
}

// ─── Noise words to strip ────────────────────────────────────────────────────

const NOISE_WORDS = [
  'property', 'properties', 'for', 'sale', 'rent', 'buy', 'purchase',
  'bhk', 'bedroom', 'bedrooms', 'room', 'rooms', 'rk',
  'flat', 'apartment', 'villa', 'house', 'plot', 'land', 'studio', 'home',
  'penthouse', 'office', 'shop', 'warehouse', 'showroom', 'bungalow',
  'farmhouse', 'factory', 'shed', 'floor', 'cottage', 'hostel',
  'affordable', 'luxury', 'cheap', 'best', 'top', 'new', 'independent',
  'commercial', 'industrial', 'residential',
  'available', 'ready', 'move', 'possession',
  'pg', 'lease', 'lease', 'space', 'spaces',
];

// ─── Public interface ────────────────────────────────────────────────────────

export interface ParsedQuery {
  city?:      string;
  locality?:  string;
  bedrooms?:  string;
  type?:      string;
  category?:  string;
  minPrice?:  number;
  maxPrice?:  number;
  keyword?:   string;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseSearchQuery(raw: string): ParsedQuery {
  if (!raw || !raw.trim()) return {};

  let text = raw.trim();
  const result: ParsedQuery = {};

  // 1. Extract BHK/bedroom count: "2 bhk", "3BHK", "2-bhk", "2 bedroom", "1rk"
  const bhkMatch = text.match(/\b(\d+)\s*[-]?\s*(?:bhk|bedroom[s]?|rk)\b/i);
  if (bhkMatch) {
    result.bedrooms = bhkMatch[1];
    text = text.replace(bhkMatch[0], ' ');
  }

  // 2. Extract price range: "under 50 lakh", "below 1 cr", "50L to 1Cr", "50-80 lakh"
  //    Range pattern first (more specific)
  const rangeMatch = text.match(
    /\b(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)\b/i,
  );
  if (rangeMatch) {
    result.minPrice = parseAmount(rangeMatch[1], rangeMatch[2]);
    result.maxPrice = parseAmount(rangeMatch[3], rangeMatch[4]);
    text = text.replace(rangeMatch[0], ' ');
  } else {
    // Upper bound: "under / below / upto / within / max"
    const upperMatch = text.match(
      /\b(?:under|below|upto|up\s+to|within|max(?:imum)?|less\s+than)\s+(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)\b/i,
    );
    if (upperMatch) {
      result.maxPrice = parseAmount(upperMatch[1], upperMatch[2]);
      text = text.replace(upperMatch[0], ' ');
    }

    // Lower bound: "above / more than / min / starting"
    const lowerMatch = text.match(
      /\b(?:above|more\s+than|min(?:imum)?|starting\s+(?:from|at)?|from)\s+(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)\b/i,
    );
    if (lowerMatch) {
      result.minPrice = parseAmount(lowerMatch[1], lowerMatch[2]);
      text = text.replace(lowerMatch[0], ' ');
    }
  }

  // 3. Category detection (before type, so "commercial office" → commercial category + office type)
  for (const [re, cat] of CATEGORY_PATTERNS) {
    if (re.test(text)) {
      result.category = cat;
      // Don't strip the word yet — type extraction may need it
      break;
    }
  }

  // 4. Extract city: text after "in " at end of string
  //    "flat in noida" → city = "noida"
  //    "3 bhk in south delhi" → city = "south delhi"
  const inMatch = text.match(/\bin\s+([a-z][a-z ]{1,30}?)(?:\s*,.*)?$/i);
  if (inMatch) {
    result.city = inMatch[1].trim().toLowerCase();
    text = text.slice(0, inMatch.index!).trim();
  }

  // 5. Extract property type (checks all synonyms)
  for (const [re, slug] of TYPE_KEYWORDS) {
    if (re.test(text)) {
      result.type = slug;
      text = text.replace(re, ' ');
      break;
    }
  }

  // 6. Infer category from type when not explicitly set
  if (!result.category && result.type) {
    if (['commercial_office', 'commercial_shop', 'commercial_warehouse', 'showroom'].includes(result.type)) {
      result.category = 'commercial';
    } else if (['factory', 'industrial_shed'].includes(result.type)) {
      result.category = 'industrial';
    }
  }

  // 7. Strip noise words from remaining text
  const noiseRe = new RegExp(`\\b(${NOISE_WORDS.join('|')})\\b`, 'gi');
  text = text.replace(noiseRe, ' ').replace(/\s+/g, ' ').trim();

  if (text) result.keyword = text;

  return result;
}

/**
 * Build a URLSearchParams from a ParsedQuery + extra overrides.
 * Skips empty / zero values. Used by all search entry points for consistency.
 */
export function buildSearchParams(
  parsed:   ParsedQuery,
  overrides: Record<string, string | number | null | undefined> = {},
): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: string | number | null | undefined) => {
    if (v !== null && v !== undefined && v !== '') p.set(k, String(v));
  };

  set('category',  parsed.category);
  set('city',      parsed.city);
  set('locality',  parsed.locality);
  set('bedrooms',  parsed.bedrooms);
  set('type',      parsed.type);
  if (parsed.minPrice) set('minPrice', parsed.minPrice);
  if (parsed.maxPrice) set('maxPrice', parsed.maxPrice);
  set('keyword',   parsed.keyword);

  // Overrides win
  for (const [k, v] of Object.entries(overrides)) set(k, v);

  return p;
}
