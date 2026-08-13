/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  footer-seo.ts — how footer SEO link groups become the two-level footer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Pure data shaping, kept out of the component so it can be exercised against
 *  a real /seo/footer-links payload without rendering React.
 *
 *  The API hands back groups of two kinds, and the difference is the whole
 *  reason this file exists:
 *
 *    Generic group   (cityName null)   — legacy seeded groups. Each link's
 *                                        `localityName` holds a CITY name and
 *                                        the link points at that city's page.
 *    City group      (cityName set)    — written by Quick SEO. Holds the city's
 *                                        own page (localityName null, present
 *                                        when the template had "include
 *                                        city-level pages") plus one link per
 *                                        locality.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface FLink {
  id: string; label: string; url: string;
  isActive?: boolean; localityName?: string | null;
}

export interface FGroup {
  id: string; title: string;
  cityName?: string | null;
  category?: string | null;
  isActive?: boolean;
  links: FLink[];
}

export interface CityEntry {
  city:          string;
  /** "Category in City" — shown in the main grid and used as the city's CTA. */
  cityLink?:     FLink;
  /** Real localities only; never the city's own page. */
  localityLinks: FLink[];
}

export interface CategoryEntry {
  key:    string;
  label:  string;
  short:  string;
  cities: CityEntry[];       // cities with localities first
}

// ── category registry ─────────────────────────────────────────────────────────

export const FOOTER_CATEGORIES: { value: string; label: string; short: string }[] = [
  { value: 'buy',          label: 'Property for Sale',     short: 'Buy'          },
  { value: 'rent',         label: 'Property for Rent',     short: 'Rent'         },
  { value: 'flats',        label: 'Flats for Sale',        short: 'Flats'        },
  { value: 'flats-rent',   label: 'Flats for Rent',        short: 'Flats Rent'   },
  { value: 'villas',       label: 'Villas for Sale',       short: 'Villas'       },
  { value: 'plots',        label: 'Plots for Sale',        short: 'Plots'        },
  { value: 'commercial',   label: 'Commercial for Rent',   short: 'Commercial'   },
  { value: 'office',       label: 'Office Space for Rent', short: 'Office'       },
  { value: 'new-projects', label: 'New Projects',          short: 'New Projects' },
  { value: 'pg',           label: 'PG / Co-Living',        short: 'PG'           },
  { value: 'agents',       label: 'Property Agents',       short: 'Agents'       },
];

const TITLE_TO_SLUG: Record<string, string> = {
  'property for sale':              'buy',
  'property for rent':              'rent',
  'flats for sale':                 'flats',
  'flats for rent':                 'flats-rent',
  'villas for sale':                'villas',
  'plots for sale':                 'plots',
  'commercial properties for rent': 'commercial',
  'office space for rent':          'office',
  'new projects':                   'new-projects',
  'pg / co-living':                 'pg',
  'pg/co-living':                   'pg',
  'property agents':                'agents',
};

// ── URL prefix → footer category mapping ─────────────────────────────────────
// Order: most specific first (longer prefixes before shorter ones)

const URL_PREFIX_TO_CAT: { prefix: string; catKey: string }[] = [
  { prefix: 'flats-for-sale-in-',            catKey: 'flats'        },
  { prefix: 'flats-for-rent-in-',            catKey: 'flats-rent'   },
  { prefix: 'villas-for-sale-in-',           catKey: 'villas'       },
  { prefix: 'plots-for-sale-in-',            catKey: 'plots'        },
  { prefix: 'commercial-property-for-rent-in-', catKey: 'commercial' },
  { prefix: 'commercial-property-in-',       catKey: 'commercial'   },
  { prefix: 'office-space-for-rent-in-',     catKey: 'office'       },
  { prefix: 'new-projects-in-',              catKey: 'new-projects' },
  { prefix: 'pg-in-',                        catKey: 'pg'           },
  { prefix: 'property-for-sale-in-',         catKey: 'buy'          },
  { prefix: 'property-for-rent-in-',         catKey: 'rent'         },
  { prefix: 'agents-in-',                    catKey: 'agents'       },
];

/** Pathname → the footer tab and city that page belongs to. */
export function parseUrlContext(pathname: string): { catKey: string; citySlug: string } | null {
  const seg = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
  for (const { prefix, catKey } of URL_PREFIX_TO_CAT) {
    if (seg.startsWith(prefix)) {
      return { catKey, citySlug: seg.slice(prefix.length) };
    }
  }
  return null;
}

/**
 * A city slug (or "{locality}-{city}" slug) → the city name used in footer data.
 * Longest suffix first, so compound cities like "navi-mumbai" beat "mumbai".
 */
export function slugToCity(slug: string, categories: CategoryEntry[]): string | null {
  if (!slug) return null;
  const normalize = (s: string) => s.toLowerCase().replace(/[-\s]+/g, '');
  const normalizedSlug = normalize(slug);
  const parts = slug.toLowerCase().split('-');

  const allCities: { normalized: string; name: string }[] = [];
  for (const cat of categories) {
    for (const cityEntry of cat.cities) {
      allCities.push({ normalized: normalize(cityEntry.city), name: cityEntry.city });
    }
  }

  for (let i = parts.length; i >= 1; i--) {
    const suffix = normalize(parts.slice(parts.length - i).join('-'));
    const match  = allCities.find(c => c.normalized === suffix);
    if (match) return match.name;
  }

  const exact = allCities.find(c => c.normalized === normalizedSlug);
  return exact?.name ?? null;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function isValidUrl(u?: string | null): u is string {
  return !!(u?.trim()) && !u.includes('undefined') && !u.includes('null');
}

function activeLinks(links: FLink[]) {
  return (links ?? []).filter(l => l.isActive !== false && isValidUrl(l.url));
}

function resolveCategory(
  g: FGroup,
  catMap: Map<string, { short: string; label: string }>,
): { key: string; short: string; label: string } {
  if (g.category?.trim()) {
    const k = g.category.trim();
    const m = catMap.get(k);
    return { key: k, short: m?.short ?? k, label: m?.label ?? g.title };
  }
  const bare = g.cityName
    ? g.title.replace(new RegExp(`\\s+in\\s+${escRe(g.cityName)}\\s*$`, 'i'), '').trim()
    : g.title;
  const slug = TITLE_TO_SLUG[bare.toLowerCase().trim()];
  if (slug) {
    const m = catMap.get(slug);
    if (m) return { key: slug, short: m.short, label: m.label };
  }
  return { key: bare.toLowerCase().trim(), short: bare, label: bare };
}

// ── buildCategories ───────────────────────────────────────────────────────────

export function buildCategories(
  groups: FGroup[],
  resolveMap: Map<string, { short: string; label: string }>,
  categoryRegistry: { value: string; sortOrder: number }[],
): CategoryEntry[] {
  type Cat = { short: string; label: string; cities: Map<string, CityEntry> };
  const catMap = new Map<string, Cat>();

  const getOrCreate = (key: string, short: string, label: string): Cat => {
    if (!catMap.has(key)) catMap.set(key, { short, label, cities: new Map() });
    return catMap.get(key)!;
  };

  // ── Pass 1: generic groups — one link per city ────────────────────────────
  for (const g of groups.filter(g => !g.cityName)) {
    const al = activeLinks(g.links);
    if (!al.length) continue;
    const { key, short, label } = resolveCategory(g, resolveMap);
    const cat = getOrCreate(key, short, label);

    for (const link of al) {
      const city = link.localityName;
      if (!city) continue;

      if (!cat.cities.has(city)) {
        cat.cities.set(city, { city, cityLink: link, localityLinks: [] });
      } else {
        cat.cities.get(city)!.localityLinks.push(link);
      }
    }
  }

  // ── Pass 2: city groups — a city page plus its localities ─────────────────
  for (const g of groups.filter(g => !!g.cityName)) {
    const al = activeLinks(g.links);
    if (!al.length) continue;
    const { key, short, label } = resolveCategory(g, resolveMap);
    const cat = getOrCreate(key, short, label);
    const existing = cat.cities.get(g.cityName!);

    // The city's own page (no localityName) is a city link, not a locality.
    // Leaving it in the locality list is what made a city with only a city page
    // show up as a pill containing one bogus "locality", and left the city
    // itself with no link in the main grid.
    const cityPageLink = al.find(l => !l.localityName);
    const localityOnly = al.filter(l => !!l.localityName);

    // Merge with pass 1 rather than replacing it: a city can be described by a
    // generic group and a city group at once, and replacing drops real pages.
    const merged = new Map<string, FLink>();
    for (const l of existing?.localityLinks ?? []) merged.set(l.url, l);
    for (const l of localityOnly) merged.set(l.url, l);

    cat.cities.set(g.cityName!, {
      city:          g.cityName!,
      cityLink:      existing?.cityLink ?? cityPageLink,
      localityLinks: Array.from(merged.values()),
    });
  }

  // ── assemble ──────────────────────────────────────────────────────────────
  const sortedRegistry = [...categoryRegistry].sort((a, b) => a.sortOrder - b.sortOrder);
  const ORDER = sortedRegistry.map(c => c.value);
  const result: CategoryEntry[] = [];

  for (const [key, { short, label, cities }] of catMap) {
    const cityArr = Array.from(cities.values())
      // only cities that have either a city link or locality links
      .filter(c => c.cityLink || c.localityLinks.length)
      .sort((a, b) => {
        // cities with localities first; within each group, alphabetical
        const aHas = a.localityLinks.length > 0 ? 1 : 0;
        const bHas = b.localityLinks.length > 0 ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return a.city.localeCompare(b.city);
      });

    if (cityArr.length) result.push({ key, label, short, cities: cityArr });
  }

  result.sort((a, b) => {
    const ai = ORDER.indexOf(a.key), bi = ORDER.indexOf(b.key);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return  1;
    return a.label.localeCompare(b.label);
  });

  return result;
}
