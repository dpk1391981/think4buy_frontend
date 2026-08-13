'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchFooterLinks, fetchFooterCategories } from '@/lib/store/slices/seoSlice';
import {
  FOOTER_CATEGORIES,
  buildCategories,
  parseUrlContext,
  slugToCity,
  type FLink,
  type FGroup,
  type CategoryEntry,
} from '@/lib/footer-seo';

// Re-exported for the admin SEO screens, which have always imported it here.
export { FOOTER_CATEGORIES };

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

function FooterPanel({ cat, initialCity }: { cat: CategoryEntry; initialCity?: string }) {
  const [expandedCity, setExpandedCity] = useState(initialCity ?? '');

  // Reset when category changes (but keep initialCity on first render)
  const prevCatKey = useRef(cat.key);
  useEffect(() => {
    if (prevCatKey.current !== cat.key) {
      prevCatKey.current = cat.key;
      setExpandedCity('');
    }
  }, [cat.key]);

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
              Nearby Localities
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
                {/* The expanded city is a destination of its own — link to its
                    page when one exists, rather than being dead text above
                    links that all lead somewhere. */}
                {expandedEntry.cityLink ? (
                  <Link href={expandedEntry.cityLink.url} title={expandedEntry.cityLink.label}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-200 hover:text-white hover:underline underline-offset-2 transition-colors">
                    {expandedEntry.city}
                    <ChevronRight className="w-3 h-3 text-red-400" />
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-gray-300">{expandedEntry.city}</span>
                )}
                <span className="text-xs text-gray-600">· {expandedEntry.localityLinks.length} localities</span>
                {expandedEntry.cityLink && (
                  <Link href={expandedEntry.cityLink.url}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    View all in {expandedEntry.city} →
                  </Link>
                )}
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

function TwoLevelFooter({
  categories,
  initialCatKey,
  initialCity,
}: {
  categories:     CategoryEntry[];
  initialCatKey?: string;
  initialCity?:   string;
}) {
  const defaultCat = (initialCatKey && categories.find(c => c.key === initialCatKey))
    ? initialCatKey
    : categories[0].key;

  const [activeCat, setActiveCat] = useState(defaultCat);

  // When initialCatKey changes (e.g. navigating between pages), re-sync
  useEffect(() => {
    if (initialCatKey && categories.find(c => c.key === initialCatKey)) {
      setActiveCat(initialCatKey);
    }
  }, [initialCatKey, categories]);

  const currentCat = useMemo(
    () => categories.find(c => c.key === activeCat) ?? categories[0],
    [categories, activeCat],
  );

  // Derive the city to auto-expand: use initialCity only when it matches activeCat's data
  const autoCity = useMemo(() => {
    if (!initialCity) return undefined;
    const hasCityLocalities = currentCat.cities.some(
      c => c.city === initialCity && c.localityLinks.length > 0
    );
    return hasCityLocalities ? initialCity : undefined;
  }, [initialCity, currentCat]);

  return (
    <section className="border-b border-gray-800 bg-gray-900/80">
      <div className="container-max">
        <CategoryTabBar
          tabs={categories}
          active={activeCat}
          onSelect={setActiveCat}
        />
        <FooterPanel key={`${activeCat}|${autoCity ?? ''}`} cat={currentCat} initialCity={autoCity} />
      </div>
    </section>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function FooterSeoLinks() {
  const dispatch      = useAppDispatch();
  const dbGroups      = useAppSelector(s => s.seo.footerGroups) as FGroup[];
  const footerLoaded  = useAppSelector(s => s.seo.footerLoaded);
  const dbCategories  = useAppSelector(s => s.seo.footerCategories);
  const catsLoaded    = useAppSelector(s => s.seo.footerCategoriesLoaded);
  const selectedCity  = useAppSelector(s => s.ui.selectedCity);
  const pathname      = usePathname();

  useEffect(() => {
    if (!footerLoaded)  dispatch(fetchFooterLinks() as any);
    if (!catsLoaded)    dispatch(fetchFooterCategories() as any);
  }, [dispatch, footerLoaded, catsLoaded]);

  // Use DB categories when available, otherwise fall back to hardcoded list
  const activeCategoryList = useMemo(
    () => dbCategories.length > 0 ? dbCategories : FOOTER_CATEGORIES.map((c, i) => ({ ...c, id: c.value, sortOrder: i, isActive: true })),
    [dbCategories],
  );

  // Build dynamic CAT_MAP from the active category list
  const dynamicCatMap = useMemo(
    () => new Map(activeCategoryList.map(c => [c.value, { short: c.short, label: c.label }])),
    [activeCategoryList],
  );

  const allActive  = useMemo(() => (dbGroups || []).filter(g => g.isActive !== false), [dbGroups]);
  const categories = useMemo(
    () => buildCategories(allActive, dynamicCatMap, activeCategoryList),
    [allActive, dynamicCatMap, activeCategoryList],
  );

  // Derive context from URL (listing pages) or Redux city (home page)
  const { initialCatKey, initialCity } = useMemo(() => {
    if (!categories.length) return {};

    const urlCtx = parseUrlContext(pathname);

    if (urlCtx) {
      // On a listing page: select matching category + resolve city from slug
      const cityName = slugToCity(urlCtx.citySlug, categories);
      return { initialCatKey: urlCtx.catKey, initialCity: cityName ?? undefined };
    }

    // On home page (or any non-listing page): use Redux selected city
    if (selectedCity) {
      return { initialCatKey: undefined, initialCity: selectedCity };
    }

    return {};
  }, [pathname, categories, selectedCity]);

  // Until the fetch lands there is nothing to draw, and returning null makes
  // the whole band appear late and shove the page down. Hold the space with a
  // skeleton of the same shape instead.
  if (!categories.length) {
    if (footerLoaded && catsLoaded) return null;
    return (
      <section className="border-b border-gray-800 bg-gray-900/80" aria-hidden>
        <div className="container-max">
          <div className="flex items-center gap-6 border-b border-gray-800 py-3.5 px-4 overflow-hidden">
            {[64, 48, 56, 72, 44, 60].map((w, i) => (
              <span key={i} className="h-3 rounded bg-gray-800 animate-pulse flex-shrink-0" style={{ width: w }} />
            ))}
          </div>
          <div className="py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="h-2.5 rounded bg-gray-800/70 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <TwoLevelFooter
      categories={categories}
      initialCatKey={initialCatKey}
      initialCity={initialCity}
    />
  );
}
