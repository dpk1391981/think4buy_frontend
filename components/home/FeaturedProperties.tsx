'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Star, Zap, Clock, TrendingUp, Flame,
  Eye, MessageCircle, Heart, MapPin, Maximize2,
  BadgeCheck, Crown, Rocket, BarChart2,
} from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';
import { homeApi, propertiesApi } from '@/lib/api';
import { cn, formatPrice, formatArea, getPropertyArea, timeAgo } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { addToast, openAuthModal } from '@/lib/store/slices/uiSlice';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id:      'smart_featured',
    label:   'Smart Pick',
    icon:    <Star className="w-3.5 h-3.5" />,
    emoji:   '🏆',
    desc:    'AI-ranked by views, engagement & freshness',
    viewAll: '/properties?sortBy=relevance',
  },
  {
    id:      'most_viewed',
    label:   'Trending',
    icon:    <TrendingUp className="w-3.5 h-3.5" />,
    emoji:   '🔥',
    desc:    'Most viewed this week',
    viewAll: '/properties?sortBy=viewCount&sortOrder=DESC',
  },
  {
    id:      'premium',
    label:   'Premium',
    icon:    <Crown className="w-3.5 h-3.5" />,
    emoji:   '⭐',
    desc:    'Verified premium listings',
    viewAll: '/properties?isPremium=true',
  },
  {
    id:      'featured',
    label:   'Boosted',
    icon:    <Rocket className="w-3.5 h-3.5" />,
    emoji:   '🚀',
    desc:    'Promoted by agents & owners',
    viewAll: '/properties?isFeatured=true',
  },
  {
    id:      'just_listed',
    label:   'Just Listed',
    icon:    <Clock className="w-3.5 h-3.5" />,
    emoji:   '🆕',
    desc:    'Newest additions',
    viewAll: '/properties?sortBy=createdAt&sortOrder=DESC',
  },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Tag badge config ─────────────────────────────────────────────────────────

function PropertyTags({ property }: { property: any }) {
  const tags: { label: string; cls: string }[] = [];

  if (property.isHotDeal)
    tags.push({ label: '🔥 Hot Deal', cls: 'bg-red-500 text-white' });
  else if (property.isTrending)
    tags.push({ label: '📈 Trending', cls: 'bg-orange-500 text-white' });

  if (property.listingPlan === 'featured' || property.isFeatured)
    tags.push({ label: '🚀 Boosted', cls: 'bg-blue-600 text-white' });
  else if (property.listingPlan === 'premium' || property.isPremium)
    tags.push({ label: '⭐ Premium', cls: 'bg-purple-600 text-white' });

  const daysOld = property.createdAt
    ? Math.floor((Date.now() - new Date(property.createdAt).getTime()) / 86_400_000)
    : 999;
  if (daysOld <= 3)
    tags.push({ label: '🆕 New', cls: 'bg-green-500 text-white' });

  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 2).map((t) => (
        <span
          key={t.label}
          className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none', t.cls)}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

// ─── Individual property card ─────────────────────────────────────────────────

function FeaturedCard({ property, rank }: { property: any; rank: number }) {
  const { area: resolvedArea, areaUnit: resolvedUnit } = getPropertyArea(property);
  const price  = formatPrice(property.price, property.priceUnit);
  const area   = resolvedArea ? formatArea(resolvedArea, resolvedUnit) : '';
  const slug   = property.slug || property.id;
  const imgUrl = property.images?.[0]?.url;

  const totalViews = property.viewCount ?? 0;
  const inq7d      = property._inqLast7d ?? property.inquiriesLast7d ?? 0;

  const isVerified = property.isVerified;
  const score      = Math.round(property._score ?? 0);

  const { isSaved, toggle } = useWishlist();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const saved = isSaved(property.id);
  const [heartAnim, setHeartAnim] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { dispatch(openAuthModal({ mode: 'login', reason: 'wishlist' })); return; }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 450);
    toggle(property.id);
    dispatch(addToast({ message: saved ? 'Removed from saved' : '❤ Saved to wishlist', type: saved ? 'info' : 'success' }));
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-[0_8px_32px_rgba(37,99,235,0.13)] hover:-translate-y-1 transition-all duration-300">
      <Link
        href={`/properties/${slug}`}
        className="flex flex-col flex-1 overflow-hidden rounded-2xl"
      >
        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
          <OptimizedImage
            src={imgUrl}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 80vw, 320px"
          />

          {/* Score pill — top right */}
          {score > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              <BarChart2 className="w-2.5 h-2.5" />
              {score.toFixed(0)}
            </div>
          )}

          {/* Gradient + price */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pt-10 pb-3">
            <span className="inline-flex items-center bg-emerald-500 text-white font-black text-base leading-none px-3 py-1.5 rounded-lg shadow-lg">
              {price}
            </span>
          </div>

          {/* Verified badge */}
          {isVerified && (
            <div className="absolute bottom-8 right-2.5">
              <BadgeCheck className="w-4 h-4 text-blue-400 drop-shadow" />
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-3.5 flex flex-col gap-1.5 flex-1">
          {/* Tags */}
          <PropertyTags property={property} />

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-700 transition-colors leading-snug">
            {property.title}
          </h3>

          {/* Location */}
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{[property.locality, property.city].filter(Boolean).join(', ')}</span>
          </p>

          {/* Specs row */}
          <div className="flex items-center gap-2.5 text-xs text-gray-500 flex-wrap">
            {area && (
              <span className="flex items-center gap-0.5">
                <Maximize2 className="w-3 h-3" /> {area}
              </span>
            )}
            {property.bedrooms && <span>{property.bedrooms} BHK</span>}
          </div>

          {/* Activity footer */}
          <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-2">
              {totalViews > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500 font-medium">
                  <Eye className="w-3 h-3" />
                  {totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
                </span>
              )}
              {inq7d > 0 && (
                <span className="flex items-center gap-0.5 text-green-600 font-medium">
                  <MessageCircle className="w-3 h-3" />
                  {inq7d}
                </span>
              )}
              {property.createdAt && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(property.createdAt)}
                </span>
              )}
            </div>
            <span className="text-gray-300 font-medium capitalize">{property.type?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </Link>

      {/* Heart / Save button — top left, outside Link */}
      <button
        onClick={handleWishlist}
        aria-label={saved ? 'Remove from saved' : 'Save property'}
        className={cn(
          'absolute top-2.5 left-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center',
          'transition-all duration-200 hover:scale-110 active:scale-125',
          'shadow-lg ring-1',
          saved
            ? 'bg-red-500 ring-red-400/50 shadow-red-300/60'
            : 'bg-white ring-white/70 shadow-gray-500/30 hover:ring-red-200',
        )}
      >
        <Heart className={cn(
          'w-4 h-4 transition-all duration-200',
          heartAnim && 'heart-pop',
          saved ? 'fill-white text-white' : 'text-gray-500',
        )} />
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeaturedCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

// ─── Per-tab data fetcher ────────────────────────────────────────────────────
// premium/featured use propertiesApi (always joins images via TypeORM).
// smart_featured/most_viewed/just_listed use homeApi analytics cache.

function fetchTab(tabId: TabId, city: string, state: string) {
  const loc: Record<string, any> = {};
  if (city)        loc.city  = city;
  else if (state)  loc.state = state;

  switch (tabId) {
    case 'premium':
      return propertiesApi
        .getAll({ isPremium: true, limit: 8, approvalStatus: 'approved', sortBy: 'featuredScore', sortOrder: 'DESC', ...loc })
        .then((r) => { const d = r.data; return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []; });

    case 'featured':
      return propertiesApi
        .getAll({ isFeatured: true, limit: 8, approvalStatus: 'approved', sortBy: 'featuredScore', sortOrder: 'DESC', ...loc })
        .then((r) => { const d = r.data; return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []; });

    default:
      return homeApi
        .getTopProperties({ tab: tabId, city: city || undefined, state: !city && state ? state : undefined, limit: 8, period: '7d' })
        .then((r) => { const d = r.data; return Array.isArray(d) ? d : d?.data ?? []; });
  }
}

function TabContent({
  tabId, city, state,
}: {
  tabId:  TabId;
  city:   string;
  state:  string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['smart-featured', tabId, city, state],
    queryFn: () => fetchTab(tabId, city, state),
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <>
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[72vw]"><FeaturedCardSkeleton /></div>
            ))}
          </div>
        </div>
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <FeaturedCardSkeleton key={i} />)}
        </div>
      </>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-sm">No properties found in this category.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
          {data.map((p: any, i: number) => (
            <div key={p.id} className="flex-shrink-0 w-[72vw] snap-start">
              <FeaturedCard property={p} rank={i + 1} />
            </div>
          ))}
        </div>
      </div>
      {/* Desktop: grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((p: any, i: number) => (
          <FeaturedCard key={p.id} property={p} rank={i + 1} />
        ))}
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FeaturedProperties() {
  const [activeTab, setActiveTab] = useState<TabId>('smart_featured');
  const [mounted, setMounted]     = useState(false);

  const selectedCity    = useAppSelector((s) => s.ui.selectedCity);
  const selectedState   = useAppSelector((s) => s.ui.selectedState);

  useEffect(() => { setMounted(true); }, []);

  const tab        = TABS.find((t) => t.id === activeTab)!;
  const location   = selectedCity || selectedState || null;

  return (
    <section className="py-5 sm:py-14 bg-white">
      <div className="container-max">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                Curated for You
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              Featured Properties
              {mounted && location && (
                <span className="text-sm font-normal text-gray-500">in {location}</span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{tab.desc}</p>
          </div>

          <Link
            href={tab.viewAll}
            className="hidden sm:flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline flex-shrink-0"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 sm:mb-8">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit min-w-full sm:min-w-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === t.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Scoring legend (smart_featured only) ───────────────────────── */}
        {activeTab === 'smart_featured' && (
          <div className="hidden sm:flex items-center gap-4 mb-5 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            <span className="font-medium text-gray-500">Score =</span>
            {[
              { label: 'Views 25%', color: 'text-orange-500' },
              { label: 'Boost 20%', color: 'text-blue-500' },
              { label: 'Freshness 15%', color: 'text-green-500' },
              { label: 'Trending 15%', color: 'text-red-500' },
              { label: 'Premium 15%', color: 'text-purple-500' },
              { label: 'Engagement 10%', color: 'text-teal-500' },
            ].map((f) => (
              <span key={f.label} className={cn('font-medium', f.color)}>{f.label}</span>
            ))}
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Updated every 30 min
            </span>
          </div>
        )}

        {/* ── Monetization notice (subtle) ───────────────────────────────── */}
        {activeTab === 'smart_featured' && (
          <div className="flex items-center gap-2 mb-4 text-[11px] text-gray-400">
            <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>40% organic top-performers · 60% promoted listings — ranked by real engagement data</span>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────── */}
        <TabContent
          tabId={activeTab}
          city={selectedCity}
          state={selectedState}
        />

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="hidden sm:block text-xs text-gray-400">
            Scores computed from views, inquiries, saves &amp; listing tier
          </p>
          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            <Link href={tab.viewAll} className="btn-outline text-xs py-2 sm:hidden">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/properties"
              className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Browse All Listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
