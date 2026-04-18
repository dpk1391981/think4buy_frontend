'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchFooterLinks } from '@/lib/store/slices/seoSlice';

// ── types ─────────────────────────────────────────────────────────────────────

interface FLink {
  id: string; label: string; url: string;
  isActive?: boolean; localityName?: string | null;
}
interface FGroup {
  id: string; title: string;
  cityName?: string | null;
  category?: string | null;
  isActive?: boolean;
  links: FLink[];
}

interface CityEntry {
  city:          string;
  cityLink?:     FLink;      // primary "Category in City" link → shown in main grid
  localityLinks: FLink[];    // sub-locality links → shown when city is expanded
}

interface CategoryEntry {
  key:    string;
  label:  string;
  short:  string;
  cities: CityEntry[];       // sorted: cities-with-localities first
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
];

const CAT_MAP = new Map(FOOTER_CATEGORIES.map(c => [c.value, c]));

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
};

// ── helpers ───────────────────────────────────────────────────────────────────

function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function isValidUrl(u?: string | null): u is string {
  return !!(u?.trim()) && !u.includes('undefined') && !u.includes('null');
}

function activeLinks(links: FLink[]) {
  return links.filter(l => l.isActive !== false && isValidUrl(l.url));
}

function resolveCategory(g: FGroup): { key: string; short: string; label: string } {
  if (g.category?.trim()) {
    const k = g.category.trim();
    const m = CAT_MAP.get(k);
    return { key: k, short: m?.short ?? k, label: m?.label ?? g.title };
  }
  const bare = g.cityName
    ? g.title.replace(new RegExp(`\\s+in\\s+${escRe(g.cityName)}\\s*$`, 'i'), '').trim()
    : g.title;
  const slug = TITLE_TO_SLUG[bare.toLowerCase().trim()];
  if (slug) { const m = CAT_MAP.get(slug)!; return { key: slug, short: m.short, label: m.label }; }
  return { key: bare.toLowerCase().trim(), short: bare, label: bare };
}

// ── buildCategories ───────────────────────────────────────────────────────────
//
// Result per category:
//   cities[n].cityLink      = the primary "Category in City" link shown in main grid
//   cities[n].localityLinks = extra sub-locality links shown when user expands that city
//
// Pass 1 (generic groups, no cityName):
//   - First link per localityName → cityLink
//   - Further links for same city  → localityLinks
//
// Pass 2 (city-specific groups, cityName set):
//   - Overrides localityLinks with the group's full locality list
//   - Keeps cityLink from Pass 1 if it exists (so the main-grid link is preserved)

function buildCategories(groups: FGroup[]): CategoryEntry[] {
  type Cat = { short: string; label: string; cities: Map<string, CityEntry> };
  const catMap = new Map<string, Cat>();

  const getOrCreate = (key: string, short: string, label: string): Cat => {
    if (!catMap.has(key)) catMap.set(key, { short, label, cities: new Map() });
    return catMap.get(key)!;
  };

  // ── Pass 1 ────────────────────────────────────────────────────────────────
  for (const g of groups.filter(g => !g.cityName)) {
    const al = activeLinks(g.links);
    if (!al.length) continue;
    const { key, short, label } = resolveCategory(g);
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

  // ── Pass 2 ────────────────────────────────────────────────────────────────
  for (const g of groups.filter(g => !!g.cityName)) {
    const al = activeLinks(g.links);
    if (!al.length) continue;
    const { key, short, label } = resolveCategory(g);
    const cat = getOrCreate(key, short, label);
    const existing = cat.cities.get(g.cityName!);

    cat.cities.set(g.cityName!, {
      city:          g.cityName!,
      cityLink:      existing?.cityLink,  // keep generic city link if present
      localityLinks: al,                  // full locality list from city-specific group
    });
  }

  // ── assemble ──────────────────────────────────────────────────────────────
  const ORDER = FOOTER_CATEGORIES.map(c => c.value);
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

// ── Category tab bar ──────────────────────────────────────────────────────────

function CategoryTabBar({ tabs, active, onSelect }: {
  tabs:     CategoryEntry[];
  active:   string;
  onSelect: (key: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [cL, setCL] = useState(false);
  const [cR, setCR] = useState(false);

  const check = () => {
    const el = ref.current; if (!el) return;
    setCL(el.scrollLeft > 4);
    setCR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    check();
    const el = ref.current;
    el?.addEventListener('scroll', check, { passive: true });
    return () => el?.removeEventListener('scroll', check);
  }, [tabs]);
  useEffect(() => {
    (ref.current?.querySelector(`[data-key="${active}"]`) as HTMLElement | null)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [active]);

  const shift = (d: number) =>
    ref.current?.scrollBy({ left: d, behavior: 'smooth' });

  return (
    <div className="relative flex items-center border-b border-gray-800">
      <span className="hidden md:block px-4 text-xs text-gray-600 font-semibold uppercase tracking-widest flex-shrink-0 border-r border-gray-800 py-3 mr-1">
        Browse
      </span>
      {cL && (
        <button onClick={() => shift(-260)} aria-label="scroll left"
          className="absolute left-0 md:left-[88px] z-10 w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white shadow flex-shrink-0">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
      <div ref={ref} className="flex overflow-x-auto flex-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tabs.map(t => {
          const isAct = t.key === active;
          return (
            <button key={t.key} data-key={t.key} onClick={() => onSelect(t.key)}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap ${
                isAct
                  ? 'text-white border-red-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
              }`}>
              {t.short}
            </button>
          );
        })}
      </div>
      {cR && (
        <button onClick={() => shift(260)} aria-label="scroll right"
          className="absolute right-0 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white shadow flex-shrink-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Link grid (city-level OR locality-level links) ─────────────────────────────

const SHOW_N = 35;

function LinkGrid({ links, collapseKey }: { links: FLink[]; collapseKey: string }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [collapseKey]);

  const shown  = expanded ? links : links.slice(0, SHOW_N);
  const moreN  = links.length - SHOW_N;

  return (
    <div>
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-x-6">
        {shown.map(link => (
          <div key={link.id} className="break-inside-avoid">
            <Link href={link.url} title={link.label}
              className="flex items-center gap-1 py-[5px] text-xs text-gray-400 hover:text-white transition-colors group">
              <ChevronRight className="w-2.5 h-2.5 flex-shrink-0 text-gray-700 group-hover:text-red-400 transition-colors" />
              <span className="truncate group-hover:underline underline-offset-2">{link.label}</span>
            </Link>
          </div>
        ))}
      </div>
      {links.length > SHOW_N && (
        <button onClick={() => setExpanded(v => !v)}
          className="mt-2 pt-2 border-t border-gray-800/60 w-full flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          {expanded
            ? <><ChevronUp className="w-3 h-3" /> Show fewer</>
            : <><ChevronDown className="w-3 h-3" /> Show {moreN} more</>}
        </button>
      )}
    </div>
  );
}

// ── Main footer panel ─────────────────────────────────────────────────────────

function FooterPanel({ cat }: { cat: CategoryEntry }) {
  const [expandedCity, setExpandedCity] = useState('');

  // Reset when category changes
  useEffect(() => { setExpandedCity(''); }, [cat.key]);

  // Cities that have city-level links (shown in main grid)
  const cityLinks = useMemo(
    () => cat.cities.filter(c => c.cityLink).map(c => c.cityLink!),
    [cat],
  );

  // Cities that have locality-level links (shown as expandable pills)
  const localityCities = useMemo(
    () => cat.cities.filter(c => c.localityLinks.length > 0),
    [cat],
  );

  const expandedEntry = localityCities.find(c => c.city === expandedCity);

  const toggle = (city: string) =>
    setExpandedCity(prev => prev === city ? '' : city);

  return (
    <div className="py-4 space-y-4">

      {/* ── Section 1: All city-level links ── */}
      {cityLinks.length > 0 && (
        <div>
          <LinkGrid links={cityLinks} collapseKey={`${cat.key}|all`} />
        </div>
      )}

      {/* ── Section 2: Cities with locality data ── */}
      {localityCities.length > 0 && (
        <div className="border-t border-gray-800/60 pt-3">
          {/* Header + city pills */}
          <div className="flex items-start gap-3 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0 pt-1">
              Browse Localities
            </span>
            <div className="flex flex-wrap gap-2">
              {localityCities.map(entry => {
                const isExp = expandedCity === entry.city;
                return (
                  <button key={entry.city} onClick={() => toggle(entry.city)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      isExp
                        ? 'bg-red-500 border-red-500 text-white shadow-md'
                        : 'border-gray-700 text-gray-300 hover:border-red-500/60 hover:text-white hover:bg-red-500/10'
                    }`}>
                    <MapPin className={`w-3 h-3 flex-shrink-0 ${isExp ? 'text-red-200' : 'text-green-500'}`} />
                    {entry.city}
                    <span className={`tabular-nums text-[10px] ${isExp ? 'text-red-200' : 'text-gray-500'}`}>
                      {entry.localityLinks.length}
                    </span>
                    {isExp
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3 opacity-50" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expanded locality grid */}
          {expandedEntry && (
            <div className="mt-3 pt-3 border-t border-gray-800/40">
              <div className="flex items-center gap-2 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-gray-300">{expandedEntry.city}</span>
                <span className="text-xs text-gray-600">· {expandedEntry.localityLinks.length} localities</span>
                <button onClick={() => setExpandedCity('')}
                  className="ml-auto text-xs text-gray-600 hover:text-gray-300 transition-colors">
                  ✕ close
                </button>
              </div>
              <LinkGrid
                links={expandedEntry.localityLinks}
                collapseKey={`${cat.key}|${expandedEntry.city}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Two-level footer ──────────────────────────────────────────────────────────

function TwoLevelFooter({ categories }: { categories: CategoryEntry[] }) {
  const [activeCat, setActiveCat] = useState(categories[0].key);

  const currentCat = useMemo(
    () => categories.find(c => c.key === activeCat) ?? categories[0],
    [categories, activeCat],
  );

  return (
    <section className="border-b border-gray-800 bg-gray-900/80">
      <div className="container-max">
        <CategoryTabBar
          tabs={categories}
          active={activeCat}
          onSelect={setActiveCat}
        />
        <FooterPanel key={activeCat} cat={currentCat} />
      </div>
    </section>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function FooterSeoLinks() {
  const dispatch     = useAppDispatch();
  const dbGroups     = useAppSelector(s => s.seo.footerGroups) as FGroup[];
  const footerLoaded = useAppSelector(s => s.seo.footerLoaded);

  useEffect(() => {
    if (!footerLoaded) dispatch(fetchFooterLinks() as any);
  }, [dispatch, footerLoaded]);

  const allActive  = useMemo(() => (dbGroups || []).filter(g => g.isActive !== false), [dbGroups]);
  const categories = useMemo(() => buildCategories(allActive), [allActive]);

  if (!categories.length) return null;
  return <TwoLevelFooter categories={categories} />;
}
