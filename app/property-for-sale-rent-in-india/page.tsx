import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Building2, ChevronRight, Home, KeyRound, Briefcase, Building } from 'lucide-react';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';

// ── Config ────────────────────────────────────────────────────────────────────

const SITE     = process.env.NEXT_PUBLIC_APP_URL  || 'https://www.think4buysale.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:3001/api/v1';

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Property for Sale & Rent in India | All States | Think4BuySale',
  description:
    'Explore properties for sale and rent across all states of India. Browse flats, houses, plots and commercial spaces in Maharashtra, Karnataka, Delhi, Tamil Nadu and more.',
  keywords:
    'property in India, real estate India, buy property India, rent property India, property all states India',
  alternates: { canonical: `${SITE}/property-for-sale-rent-in-india` },
  openGraph: {
    title: 'Property for Sale & Rent in India | Think4BuySale',
    description: 'Browse properties across all states of India — buy, rent or invest.',
    url: `${SITE}/property-for-sale-rent-in-india`,
    type: 'website',
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface StateStats {
  id: string;
  name: string;
  slug: string;
  code: string;
  imageUrl: string | null;
  cityCount: number;
  totalListings: number;
  buyCount: number;
  rentCount: number;
  commercialCount: number;
}

// ── Data fetch ────────────────────────────────────────────────────────────────

async function getStates(): Promise<StateStats[]> {
  // Try rich stats endpoint first
  try {
    const res = await fetch(`${API_BASE}/locations/states-with-stats`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* fall through */ }

  // Fallback to basic /locations/states (always reliable)
  try {
    const res = await fetch(`${API_BASE}/locations/states`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : [];
    // Shape into StateStats with zeros for unknown fields
    return list
      .filter((s: any) => s.isActive !== false)
      .map((s: any) => ({
        id:              s.id,
        name:            s.name,
        slug:            s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
        code:            s.code,
        imageUrl:        s.imageUrl || null,
        cityCount:       0,
        totalListings:   s.propertyCount || 0,
        buyCount:        0,
        rentCount:       0,
        commercialCount: 0,
      }));
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-600 to-blue-900',
  'from-emerald-600 to-emerald-900',
  'from-violet-600 to-violet-900',
  'from-orange-500 to-orange-800',
  'from-rose-600 to-rose-900',
  'from-teal-600 to-teal-900',
  'from-indigo-600 to-indigo-900',
  'from-pink-500 to-pink-800',
  'from-amber-500 to-amber-800',
  'from-cyan-600 to-cyan-900',
  'from-lime-600 to-lime-900',
  'from-red-600 to-red-900',
];

function fmt(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

// ── State Card ────────────────────────────────────────────────────────────────

function StateCard({ state, idx }: { state: StateStats; idx: number }) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const total    = state.totalListings || 0;

  // Category mini-bars (% of total, capped at 100%)
  const buyPct  = total > 0 ? Math.min(Math.round((state.buyCount  / total) * 100), 100) : 0;
  const rentPct = total > 0 ? Math.min(Math.round((state.rentCount / total) * 100), 100) : 0;
  const commPct = total > 0 ? Math.min(Math.round((state.commercialCount / total) * 100), 100) : 0;

  return (
    <Link
      href={`/properties-in-${state.slug}`}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* ── Banner ── */}
      <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
        {state.imageUrl ? (
          <Image
            src={state.imageUrl}
            alt={`Properties in ${state.name}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-white/10 select-none leading-none">
                {state.code?.slice(0, 2) || state.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '22px 22px' }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* State code pill — top left */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
            {state.code}
          </span>
        </div>

        {/* City count pill — top right */}
        {state.cityCount > 0 && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
              {state.cityCount} {state.cityCount === 1 ? 'city' : 'cities'}
            </span>
          </div>
        )}

        {/* State name + total */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-lg">
            {state.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3 h-3 text-white/60" />
            <span className="text-white/70 text-[11px]">India</span>
            {total > 0 && (
              <>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-yellow-300 text-[11px] font-bold">{fmt(total)} listings</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats body ── */}
      <div className="p-4 flex-1 flex flex-col gap-3">

        {/* Total listings — big number */}
        <div className="flex items-end gap-2">
          <span className="text-2xl font-black text-gray-900 leading-none">{fmt(total)}</span>
          <span className="text-xs text-gray-400 mb-0.5 font-medium">active listings</span>
        </div>

        {/* Category breakdown */}
        {total > 0 && (
          <div className="space-y-1.5">
            {/* Buy */}
            <div className="flex items-center gap-2">
              <Home className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${buyPct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 w-12 text-right tabular-nums">
                {fmt(state.buyCount)} buy
              </span>
            </div>
            {/* Rent */}
            <div className="flex items-center gap-2">
              <KeyRound className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${rentPct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 w-12 text-right tabular-nums">
                {fmt(state.rentCount)} rent
              </span>
            </div>
            {/* Commercial */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-3 h-3 text-orange-500 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${commPct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 w-12 text-right tabular-nums">
                {fmt(state.commercialCount)} comm
              </span>
            </div>
          </div>
        )}

        {/* Cities count detail */}
        {state.cityCount > 0 && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
            <Building className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              Available in <span className="font-semibold text-gray-800">{state.cityCount}</span> {state.cityCount === 1 ? 'city' : 'cities'}
            </span>
          </div>
        )}

        {/* CTA row */}
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Click to explore</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
            View Properties
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PropertyInIndiaPage() {
  const states = await getStates();

  // Summary stats
  const totalListings  = states.reduce((s, st) => s + st.totalListings, 0);
  const totalCities    = states.reduce((s, st) => s + st.cityCount, 0);
  const totalBuy       = states.reduce((s, st) => s + st.buyCount, 0);
  const totalRent      = states.reduce((s, st) => s + st.rentCount, 0);

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',              url: SITE },
    { name: 'Property in India', url: `${SITE}/property-for-sale-rent-in-india` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-20 pb-12 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-max text-center px-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
            <Building2 className="w-3.5 h-3.5" />
            All States · India
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            Property for Sale &amp; Rent in India
          </h1>
          <p className="text-blue-100/70 max-w-xl mx-auto text-sm sm:text-base">
            Explore verified listings across all states — buy, rent, or invest in residential and commercial properties.
          </p>

          {/* Live aggregate stats */}
          {totalListings > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 mt-8">
              {[
                { label: 'Active Listings',  value: fmt(totalListings), color: 'text-yellow-400' },
                { label: 'Cities Covered',   value: fmt(totalCities),   color: 'text-green-400'  },
                { label: 'For Sale',         value: fmt(totalBuy),      color: 'text-blue-400'   },
                { label: 'For Rent',         value: fmt(totalRent),     color: 'text-purple-400' },
                { label: 'States',           value: String(states.length), color: 'text-orange-400' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-white/50 text-[11px] font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-1.5 mt-6 text-xs text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/70">Property in India</span>
          </nav>
        </div>
      </section>

      {/* ── States grid ── */}
      <section className="py-10 sm:py-14 bg-gray-50">
        <div className="container-max px-4">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Browse by State</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {states.length > 0 ? `${states.length} States` : 'All States'} with Active Listings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Each card shows buy · rent · commercial breakdown — click to explore cities
              </p>
            </div>
            <Link
              href="/properties"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              All Properties <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {states.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-500">No states found</p>
              <p className="text-sm mt-1">Add cities and properties to see states here.</p>
              <Link href="/properties" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
                Browse all properties <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {states.map((state, idx) => (
                <StateCard key={state.id} state={state} idx={idx} />
              ))}
            </div>
          )}

          <div className="mt-8 flex sm:hidden justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 border border-primary-200 rounded-xl px-5 py-2.5 hover:bg-primary-50 transition-colors"
            >
              Browse All Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
