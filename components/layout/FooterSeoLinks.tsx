'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Globe, Map, MapPin } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchCitiesByState, fetchLocalities } from '@/lib/store/slices/locationsSlice';

// ── Default: top 14 Indian cities shown at country level ─────────────────────

const DEFAULT_CITIES = [
  { name: 'Bangalore',  slug: 'bangalore'  },
  { name: 'Mumbai',     slug: 'mumbai'     },
  { name: 'Delhi',      slug: 'delhi'      },
  { name: 'Hyderabad',  slug: 'hyderabad'  },
  { name: 'Noida',      slug: 'noida'      },
  { name: 'Gurgaon',    slug: 'gurgaon'    },
  { name: 'Pune',       slug: 'pune'       },
  { name: 'Chennai',    slug: 'chennai'    },
  { name: 'Ghaziabad',  slug: 'ghaziabad'  },
  { name: 'Kolkata',    slug: 'kolkata'    },
  { name: 'Lucknow',    slug: 'lucknow'    },
  { name: 'Ahmedabad',  slug: 'ahmedabad'  },
  { name: 'Kochi',      slug: 'kochi'      },
  { name: 'Jaipur',     slug: 'jaipur'     },
];

// ── Column config — URL generators keep each route pattern explicit ───────────

const COLUMNS = [
  {
    heading:  'Property for Sale',
    cityPfx:  'Real estate in',
    localPfx: 'Property in',
    // /buy/property-in-[city]  (folder is "property-in-[city]" → hyphen, not slash)
    cityUrl:    (slug: string) => `/buy/property-in-${slug}`,
    localUrl:   (citySlug: string, loc: string) => `/buy/property-in-${citySlug}?locality=${encodeURIComponent(loc)}`,
    allCityUrl: (citySlug: string) => `/buy/property-in-${citySlug}`,
    allStateUrl:(state: string)    => `/properties?category=buy&state=${encodeURIComponent(state)}`,
  },
  {
    heading:  'Flats for Sale',
    cityPfx:  'Flats in',
    localPfx: 'Flats in',
    // /flats-for-sale/[city]
    cityUrl:    (slug: string) => `/flats-for-sale/${slug}`,
    localUrl:   (citySlug: string, loc: string) => `/flats-for-sale/${citySlug}?locality=${encodeURIComponent(loc)}`,
    allCityUrl: (citySlug: string) => `/flats-for-sale/${citySlug}`,
    allStateUrl:(state: string)    => `/properties?category=buy&type=apartment&state=${encodeURIComponent(state)}`,
  },
  {
    heading:  'Flats for Rent',
    cityPfx:  'Flats for Rent in',
    localPfx: 'Flats for Rent in',
    // /flats-for-rent/[city]
    cityUrl:    (slug: string) => `/flats-for-rent/${slug}`,
    localUrl:   (citySlug: string, loc: string) => `/flats-for-rent/${citySlug}?locality=${encodeURIComponent(loc)}`,
    allCityUrl: (citySlug: string) => `/flats-for-rent/${citySlug}`,
    allStateUrl:(state: string)    => `/properties?category=rent&type=apartment&state=${encodeURIComponent(state)}`,
  },
  {
    heading:  'New Projects',
    cityPfx:  'New Projects in',
    localPfx: 'New Projects in',
    // /new-projects/[city]
    cityUrl:    (slug: string) => `/new-projects/${slug}`,
    localUrl:   (citySlug: string, loc: string) => `/new-projects/${citySlug}?locality=${encodeURIComponent(loc)}`,
    allCityUrl: (citySlug: string) => `/new-projects/${citySlug}`,
    allStateUrl:(state: string)    => `/properties?category=buy&possession=under_construction&state=${encodeURIComponent(state)}`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string | undefined | null): string {
  if (!name) return '';
  const s = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return s === 'undefined' || s === 'null' ? '' : s;
}

function isValidSlug(s: string | undefined | null): s is string {
  return !!s && s !== 'undefined' && s !== 'null';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FooterSeoLinks() {
  const dispatch = useAppDispatch();

  // Read the 3-level selection from uiSlice (same store the navbar writes to)
  const selectedCountry  = useAppSelector((s) => s.ui.selectedCountry);
  const selectedState    = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId  = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity     = useAppSelector((s) => s.ui.selectedCity);

  // Location data
  const citiesByState  = useAppSelector((s) => s.locations.citiesByState);
  const localityCache  = useAppSelector((s) => s.locations.localityCache);

  // Fetch cities when state is selected (cached)
  useEffect(() => {
    if (selectedStateId) dispatch(fetchCitiesByState(selectedStateId) as any);
  }, [dispatch, selectedStateId]);

  // Fetch localities when city is selected (cached)
  useEffect(() => {
    if (selectedCity) dispatch(fetchLocalities(selectedCity) as any);
  }, [dispatch, selectedCity]);

  // ── Determine level ────────────────────────────────────────────────────────

  type Level = 'country' | 'state' | 'city';

  const level: Level = selectedCity
    ? 'city'
    : selectedState
    ? 'state'
    : 'country';

  // ── Build location items depending on level ────────────────────────────────

  // State level: cities in selected state
  const stateCities = useMemo(() => {
    if (!selectedStateId) return [];
    return (citiesByState[selectedStateId] ?? [])
      .filter((c) => c.isActive && c.name)
      .map((c) => ({ name: c.name, slug: toSlug(c.name) }))
      .filter((c) => isValidSlug(c.slug))
      .slice(0, 14);
  }, [citiesByState, selectedStateId]);

  // City level: localities in selected city
  const cityLocalities = useMemo(() => {
    if (!selectedCity) return [];
    return (localityCache[selectedCity] ?? [])
      .filter((l) => l.name)
      .map((l) => ({ name: l.name, slug: toSlug(l.name) }))
      .filter((l) => isValidSlug(l.slug))
      .slice(0, 14);
  }, [localityCache, selectedCity]);

  // Show-while-loading: fall back to default when state's cities aren't loaded yet
  const displayItems = useMemo(() => {
    if (level === 'city')    return cityLocalities.length > 0 ? cityLocalities : null;
    if (level === 'state')   return stateCities.length   > 0 ? stateCities   : null;
    return DEFAULT_CITIES;
  }, [level, stateCities, cityLocalities]);

  const isLoading = displayItems === null;

  // ── Breadcrumb ─────────────────────────────────────────────────────────────

  const crumb = useMemo(() => {
    if (level === 'city')
      return { icon: <MapPin className="w-3.5 h-3.5" />, label: `${selectedCity} — Top Localities` };
    if (level === 'state')
      return { icon: <Map className="w-3.5 h-3.5" />, label: `${selectedState} — Top Cities` };
    return {
      icon: <Globe className="w-3.5 h-3.5" />,
      label: selectedCountry ? `${selectedCountry} — Top Cities` : 'India — Top Cities',
    };
  }, [level, selectedCity, selectedState, selectedCountry]);

  // City slug needed for locality links — empty string means no city selected
  const activeCitySlug = toSlug(selectedCity);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="border-b border-gray-800">
      <div className="container-max py-10">

        {/* Section header + breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Explore Properties
            {level === 'city'  && <span className="normal-case font-normal text-gray-600"> — localities in {selectedCity}</span>}
            {level === 'state' && <span className="normal-case font-normal text-gray-600"> — cities in {selectedState}</span>}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800/60 px-3 py-1.5 rounded-full">
            {crumb.icon}
            <span>{crumb.label}</span>
            {isLoading && (
              <span className="ml-1 w-3 h-3 border border-gray-500 border-t-gray-300 rounded-full animate-spin inline-block" />
            )}
          </div>
        </div>

        {/* 4-column grid */}
        {isLoading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <div className="h-5 w-32 bg-gray-800 rounded mb-4 animate-pulse" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-3 w-full bg-gray-800/60 rounded mb-2 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {COLUMNS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                {/* Column heading */}
                <h3 className="text-white font-semibold text-sm mb-4 pb-2 border-b border-gray-700">
                  {col.heading}
                  {(level === 'state' || level === 'city') && (
                    <span className="ml-1.5 text-[10px] font-normal text-primary-400 bg-primary-900/40 px-1.5 py-0.5 rounded-full">
                      {level === 'city' ? selectedCity : selectedState}
                    </span>
                  )}
                </h3>

                {/* Links */}
                <ul className="space-y-1.5">
                  {displayItems!.filter(({ slug }) => isValidSlug(slug)).map(({ name, slug }) => {
                    // Skip locality links when there's no valid city slug
                    if (level === 'city' && !isValidSlug(activeCitySlug)) return null;

                    const href = level === 'city'
                      ? col.localUrl(activeCitySlug, name)
                      : col.cityUrl(slug);

                    const label = level === 'city'
                      ? `${col.localPfx} ${name}`
                      : `${col.cityPfx} ${name}`;

                    return (
                      <li key={slug}>
                        <Link
                          href={href}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-400 transition-colors group"
                          title={label}
                        >
                          <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-primary-400 flex-shrink-0" />
                          <span className="group-hover:underline underline-offset-2">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* "Browse all" link at bottom of each column */}
                {level !== 'country' && (level !== 'city' || isValidSlug(activeCitySlug)) && (
                  <div className="mt-3 pt-2 border-t border-gray-800/60">
                    <Link
                      href={
                        level === 'city'
                          ? col.allCityUrl(activeCitySlug)
                          : col.allStateUrl(selectedState || '')
                      }
                      className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-300 transition-colors"
                    >
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      All {col.heading} in {level === 'city' ? selectedCity : selectedState} →
                    </Link>
                  </div>
                )}
              </nav>
            ))}
          </div>
        )}

        {/* "Also popular across India" strip when state or city is selected */}
        {level !== 'country' && (
          <div className="mt-6 pt-5 border-t border-gray-800/60">
            <p className="text-xs text-gray-600 mb-3">Also popular across India:</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CITIES.slice(0, 8).map(({ name, slug }) => (
                <Link
                  key={slug}
                  href={`/buy/property-in-${slug}`}
                  className="text-xs text-gray-500 hover:text-gray-300 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 px-2.5 py-1 rounded-full transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
