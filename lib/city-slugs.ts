/**
 * Static list of known city slugs — used by middleware (edge runtime) to
 * disambiguate /property-in-{city}-{locality} from /property-in-{compound-city}.
 *
 * Keep this in sync with the `cities` table. Any slug NOT in this set that
 * contains hyphens will be treated as city+locality by the middleware.
 */
export const KNOWN_CITY_SLUGS = new Set<string>([
  // ── DB cities ────────────────────────────────────────────────────────────
  'ahmedabad',
  'bangalore',
  'chennai',
  'delhi',
  'ghaziabad',
  'gurgaon',
  'hyderabad',
  'jaipur',
  'kochi',
  'kolkata',
  'lucknow',
  'mumbai',
  'mysore',
  'nagpur',
  'noida',
  'pune',
  'surat',
  // ── Multi-word cities (compound slugs that must NOT be split) ────────────
  'navi-mumbai',
  'new-delhi',
  'greater-noida',
  'south-delhi',
  'west-delhi',
  'east-delhi',
  'north-delhi',
  'central-delhi',
]);
