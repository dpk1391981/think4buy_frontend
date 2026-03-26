/**
 * Client-side instant search intent parser.
 * Mirrors the backend NLP logic for zero-latency UI feedback while the user types.
 * No API call — pure string analysis.
 */

export interface ParsedHint {
  bedrooms?: number;
  city?: string;
  locality?: string;
  maxPrice?: number;
  minPrice?: number;
  type?: string;
  category?: string;
  furnishingStatus?: string;
  possessionStatus?: string;
  minArea?: number;
  maxArea?: number;
  lifestyleTags?: string[];
}

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Flat', villa: 'Villa', house: 'House',
  builder_floor: 'Builder Floor', penthouse: 'Penthouse', studio: 'Studio',
  plot: 'Plot', farm_house: 'Farmhouse', co_living: 'Co-Living', pg: 'PG',
  commercial_office: 'Office', commercial_shop: 'Shop',
  commercial_warehouse: 'Warehouse', factory: 'Factory',
  showroom: 'Showroom', industrial_shed: 'Industrial Shed', land: 'Land',
};

const CATEGORY_LABELS: Record<string, string> = {
  buy: 'Buy', rent: 'Rent', pg: 'PG', commercial: 'Commercial',
  industrial: 'Industrial', builder_project: 'New Project', investment: 'Investment',
  new_projects: 'New Project',
};

const TYPE_MAP: [RegExp, string][] = [
  [/\bservice[\s-]apartment\b/i, 'apartment'],
  [/\bcommercial[\s-]warehouse\b/i, 'commercial_warehouse'],
  [/\bcommercial[\s-]office\b/i, 'commercial_office'],
  [/\bcommercial[\s-]shop\b/i, 'commercial_shop'],
  [/\bindustrial[\s-]shed\b/i, 'industrial_shed'],
  [/\bbuilder[\s-]floor\b/i, 'builder_floor'],
  [/\bindependent[\s-]floor\b/i, 'builder_floor'],
  [/\boffice[\s-]space\b/i, 'commercial_office'],
  [/\bfarm[\s-]house\b/i, 'farm_house'],
  [/\bpaying[\s-]guest\b/i, 'pg'],
  [/\bco[\s-]?living\b/i, 'co_living'],
  [/\bapartment\b/i, 'apartment'],
  [/\bflats?\b/i, 'apartment'],
  [/\bunit\b/i, 'apartment'],
  [/\bvillas?\b/i, 'villa'],
  [/\bbungalow\b/i, 'villa'],
  [/\bpenthouse\b/i, 'penthouse'],
  [/\bstudio\b/i, 'studio'],
  [/\b1\s*rk\b/i, 'studio'],
  [/\bfarmhouse\b/i, 'farm_house'],
  [/\bwarehouse\b/i, 'commercial_warehouse'],
  [/\bshowroom\b/i, 'showroom'],
  [/\bfactory\b/i, 'factory'],
  [/\bplots?\b/i, 'plot'],
  [/\bland\b/i, 'plot'],
  [/\bindependent\b/i, 'house'],
  [/\bhouses?\b/i, 'house'],
  [/\bhome\b/i, 'house'],
  [/\bpg\b/i, 'pg'],
  [/\bhostel\b/i, 'pg'],
  [/\boffice\b/i, 'commercial_office'],
  [/\bshops?\b/i, 'commercial_shop'],
  [/\bindustrial\b/i, 'factory'],
];

const LIFESTYLE_PATTERNS: [RegExp, string][] = [
  [/\bnear\s+metro\b|\bmetro[\s-]?nearby\b/i, 'Near Metro'],
  [/\bwith\s+parking\b|\bparking\b/i, 'Parking'],
  [/\bswimming\s*pool\b|\bpool\b/i, 'Pool'],
  [/\bgym\b|\bfitness\b/i, 'Gym'],
  [/\bgated\s*(?:society|community)?\b/i, 'Gated Society'],
  [/\bpower\s*backup\b/i, 'Power Backup'],
  [/\blift\b|\belevator\b/i, 'Lift'],
  [/\bpark[\s-]?facing\b/i, 'Park Facing'],
  [/\bbalcony\b/i, 'Balcony'],
  [/\bclub[\s-]?house\b|\bclubhouse\b/i, 'Clubhouse'],
  [/\bnear\s+school\b/i, 'Near School'],
  [/\bnear\s+hospital\b/i, 'Near Hospital'],
  [/\bsea[\s-]?facing\b/i, 'Sea Facing'],
  [/\bvaastu\b|\bvastu\b/i, 'Vastu'],
  [/\bpet[\s-]?friendly\b/i, 'Pet Friendly'],
];

function toINR(num: string, unit: string): number {
  const amt = parseFloat(num);
  const u = (unit || '').toLowerCase().trim();
  if (u.startsWith('cr')) return amt * 10_000_000;
  if (u === 'k' || u === 'thousand') return amt * 1_000;
  return amt * 100_000;
}

function toSqFt(num: string, unit: string): number {
  const val = parseFloat(num);
  const u = (unit || '').toLowerCase().trim();
  if (u.startsWith('sqm') || u.startsWith('sq m')) return Math.round(val * 10.764);
  return val;
}

function formatPrice(price: number): string {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(price % 10_000_000 === 0 ? 0 : 1)}Cr`;
  if (price >= 100_000)    return `₹${(price / 100_000).toFixed(price % 100_000 === 0 ? 0 : 1)}L`;
  if (price >= 1_000)      return `₹${(price / 1_000).toFixed(0)}K`;
  return `₹${price}`;
}

/** Parse a natural language search query into structured hint (no API call). */
export function parseSearchHint(rawQuery: string): ParsedHint {
  const hint: ParsedHint = {};
  let text = rawQuery.replace(/-/g, ' ').toLowerCase().trim();

  // BHK
  const bedroomMatch = text.match(/\b(\d+)\s*[-]?\s*(?:bhk|bedroom[s]?|bed)\b/i);
  if (bedroomMatch) {
    hint.bedrooms = parseInt(bedroomMatch[1]);
    text = text.replace(bedroomMatch[0], '').trim();
  }

  // Budget range
  const budgetRange = text.match(
    /\b(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)?\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)\b/i,
  );
  if (budgetRange) {
    hint.minPrice = toINR(budgetRange[1], budgetRange[2] || '');
    hint.maxPrice = toINR(budgetRange[3], budgetRange[4]);
    text = text.replace(budgetRange[0], '').trim();
  }
  if (!hint.maxPrice) {
    const m = text.match(
      /\b(?:under|below|upto|up\s+to|within|less\s+than|max)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)?\b/i,
    );
    if (m) { hint.maxPrice = toINR(m[1], m[2] || ''); text = text.replace(m[0], '').trim(); }
  }
  if (!hint.minPrice) {
    const m = text.match(
      /\b(?:above|over|more\s+than|min|starting\s+from|from)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(lakh|lac|l|crore|cr|k|thousand)?\b/i,
    );
    if (m) { hint.minPrice = toINR(m[1], m[2] || ''); text = text.replace(m[0], '').trim(); }
  }

  // Area
  const areaRange = text.match(
    /\b(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sft|sqm)\b/i,
  );
  if (areaRange) {
    hint.minArea = toSqFt(areaRange[1], areaRange[3]);
    hint.maxArea = toSqFt(areaRange[2], areaRange[3]);
    text = text.replace(areaRange[0], '').trim();
  } else {
    const areaSingle = text.match(/\b(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sft|sqm)\b/i);
    if (areaSingle) {
      hint.minArea = toSqFt(areaSingle[1], areaSingle[2]);
      text = text.replace(areaSingle[0], '').trim();
    }
  }

  // Property type
  for (const [re, val] of TYPE_MAP) {
    if (re.test(text)) { hint.type = val; text = text.replace(re, '').trim(); break; }
  }

  // Furnishing
  if (/\bsemi[\s-]?furnished?\b/i.test(text)) {
    hint.furnishingStatus = 'semi_furnished';
    text = text.replace(/\bsemi[\s-]?furnished?\b/i, '').trim();
  } else if (/\bunfurnished\b|\bbare[\s-]?shell\b/i.test(text)) {
    hint.furnishingStatus = 'unfurnished';
    text = text.replace(/\bunfurnished\b|\bbare[\s-]?shell\b/i, '').trim();
  } else if (/\bfurnished\b/i.test(text)) {
    hint.furnishingStatus = 'furnished';
    text = text.replace(/\bfurnished\b/i, '').trim();
  }

  // Possession
  if (/\bready[\s-]?to[\s-]?move\b|\brtm\b/i.test(text)) {
    hint.possessionStatus = 'ready_to_move';
    text = text.replace(/\bready[\s-]?to[\s-]?move\b|\brtm\b/i, '').trim();
  } else if (/\bunder[\s-]?construction\b|\bnew[\s-]?launch\b/i.test(text)) {
    hint.possessionStatus = 'under_construction';
    text = text.replace(/\bunder[\s-]?construction\b|\bnew[\s-]?launch\b/i, '').trim();
  }

  // Category
  if (/\b(?:for\s+rent|on\s+rent|rental|lease)\b/i.test(rawQuery)) hint.category = 'rent';
  else if (/\b(?:for\s+sale|to\s+buy|buy|purchase)\b/i.test(rawQuery)) hint.category = 'buy';
  else if (/\bpg\b|\bhostel\b|\bpaying\s+guest\b/i.test(rawQuery)) hint.category = 'pg';
  else if (/\bnew\s+project\b/i.test(rawQuery)) hint.category = 'new_projects';
  else if (/\bcommercial\b/i.test(rawQuery)) hint.category = 'commercial';
  else if (/\binvestment\b/i.test(rawQuery)) hint.category = 'investment';

  // Lifestyle tags
  const tags: string[] = [];
  for (const [pattern, tag] of LIFESTYLE_PATTERNS) {
    if (pattern.test(text)) { tags.push(tag); text = text.replace(pattern, '').trim(); }
  }
  if (tags.length) hint.lifestyleTags = tags;

  // Location ("in X" / "at X")
  const locMatch = text.match(
    /\b(?:in|at)\s+([a-z0-9][a-z0-9\s-]{1,30}?)(?:\s+(?:under|below|above|for|with|near)|$)/i,
  );
  if (locMatch) {
    const loc = locMatch[1].trim();
    if (/\b(?:sector|phase|block|nagar|vihar|colony|road|marg|layout|extension)\b/i.test(loc)) {
      hint.locality = loc.replace(/\b\w/g, c => c.toUpperCase());
    } else {
      hint.city = loc.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  return hint;
}

/**
 * Format a ParsedHint into a readable intent summary string.
 * Example: "2 BHK · Noida · Under ₹60L · Furnished · Near Metro"
 */
export function formatHintChips(hint: ParsedHint): string[] {
  const chips: string[] = [];

  if (hint.bedrooms)  chips.push(`${hint.bedrooms} BHK`);
  if (hint.type)      chips.push(TYPE_LABELS[hint.type] || hint.type);
  if (hint.category)  chips.push(CATEGORY_LABELS[hint.category] || hint.category);
  if (hint.city)      chips.push(hint.city);
  if (hint.locality)  chips.push(hint.locality);

  if (hint.minPrice && hint.maxPrice) {
    chips.push(`${formatPrice(hint.minPrice)}–${formatPrice(hint.maxPrice)}`);
  } else if (hint.maxPrice) {
    chips.push(`Under ${formatPrice(hint.maxPrice)}`);
  } else if (hint.minPrice) {
    chips.push(`Above ${formatPrice(hint.minPrice)}`);
  }

  if (hint.minArea && hint.maxArea) chips.push(`${hint.minArea}–${hint.maxArea} sqft`);
  else if (hint.minArea) chips.push(`${hint.minArea}+ sqft`);

  if (hint.furnishingStatus) {
    const m: Record<string, string> = { furnished: 'Furnished', semi_furnished: 'Semi-Furnished', unfurnished: 'Unfurnished' };
    chips.push(m[hint.furnishingStatus]);
  }
  if (hint.possessionStatus) {
    chips.push(hint.possessionStatus === 'ready_to_move' ? 'Ready to Move' : 'Under Construction');
  }
  if (hint.lifestyleTags) chips.push(...hint.lifestyleTags);

  return chips;
}

/** Quick-tags the user can tap to append to their search */
export const QUICK_TAGS = [
  { label: 'Near Metro',     append: 'near metro' },
  { label: 'Parking',        append: 'with parking' },
  { label: 'Furnished',      append: 'furnished' },
  { label: 'Ready to Move',  append: 'ready to move' },
  { label: 'Gated Society',  append: 'gated society' },
  { label: 'Swimming Pool',  append: 'swimming pool' },
  { label: 'Gym',            append: 'gym' },
  { label: 'Under ₹50L',     append: 'under 50 lakh' },
  { label: 'Under ₹1Cr',     append: 'under 1 cr' },
  { label: 'Sea Facing',     append: 'sea facing' },
  { label: 'Park Facing',    append: 'park facing' },
  { label: 'Pet Friendly',   append: 'pet friendly' },
];
