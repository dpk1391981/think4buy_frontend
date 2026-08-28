/**
 * Static list of known city slugs — used by middleware (edge runtime) to
 * disambiguate /property-in-{city}-{locality} from /property-in-{compound-city}.
 *
 * Keep this in sync with the `cities` table. Any slug NOT in this set that
 * contains hyphens will be treated as city+locality by the middleware.
 *
 * The failure is quiet and total, which is why it is worth checking after every
 * city you add. `splitCityLocality` walks this set to find the city half of a
 * slug; when the city is missing it falls through to "treat the whole string as
 * a city", so `/property-in-gurugram-sector-56` resolves to a city literally
 * named "gurugram-sector-56" and the page finds nothing. Gurugram and Indore
 * were both in the cities table and missing here.
 *
 * The middleware runs on the edge and cannot query the database, so this list
 * stays static by design. Adding a city in /admin/locations means adding it
 * here too.
 */
export const KNOWN_CITY_SLUGS = new Set<string>([
  // ── DB cities ────────────────────────────────────────────────────────────
  'ahmedabad',
  'bangalore',
  'chennai',
  'delhi',
  'ghaziabad',
  'gurgaon',
  'gurugram',
  'hyderabad',
  'indore',
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
