'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Minus, BarChart2, ArrowRight,
  MapPin, Info, RefreshCw,
} from 'lucide-react';
import { homeApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store';

// Indian number formatter: 1500 → "1.5K", 250000 → "2.5L", 10000000 → "1Cr"
function fmtINR(n: number, decimals = 1): string {
  if (!n || n <= 0) return '0';
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(decimals).replace(/\.0$/, '')}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(decimals).replace(/\.0$/, '')}L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(decimals).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-IN');
}

// Fallback cities shown before the API responds (popular Indian metros)
const FALLBACK_CITIES = [
  'Noida', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai',
  'Kolkata', 'Ahmedabad', 'Mumbai', 'Gurgaon',
];

type Trend = 'up' | 'down' | 'stable';

function TrendIcon({ trend, size = 'sm' }: { trend: Trend; size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4';
  if (trend === 'up')   return <TrendingUp   className={cn(cls, 'text-green-500')} />;
  if (trend === 'down') return <TrendingDown  className={cn(cls, 'text-red-500')} />;
  return <Minus className={cn(cls, 'text-gray-400')} />;
}

function LocalityBar({
  name, value, maxValue, trend, city, isRent,
}: { name: string; value: number; maxValue: number; trend: Trend; city: string; isRent: boolean }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const label = isRent
    ? `₹${fmtINR(value)}/mo`
    : `₹${fmtINR(value)}/sqft`;
  return (
    <Link
      href={`/properties?city=${encodeURIComponent(city)}&locality=${encodeURIComponent(name)}`}
      className="flex items-center gap-3 group/bar hover:opacity-80 transition-opacity"
    >
      <div className="w-28 sm:w-40 flex-shrink-0 text-xs text-gray-700 font-medium truncate group-hover/bar:text-primary-600 transition-colors">
        {name}
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-28 flex-shrink-0 flex items-center justify-end gap-1">
        <span className="text-xs font-bold text-gray-900">{value > 0 ? label : '—'}</span>
        <TrendIcon trend={trend} size="xs" />
      </div>
    </Link>
  );
}

function PriceGauge({ avgPsf, avgMonthlyRent, trend, trendPct, listingCount, totalListingCount }: {
  avgPsf: number; avgMonthlyRent: number; trend: Trend; trendPct: number;
  listingCount: number; totalListingCount: number;
}) {
  const hasPsf = avgPsf > 0;
  const displayCount = listingCount > 0 ? listingCount : totalListingCount;
  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white">
      <p className="text-xs text-primary-200 font-medium uppercase tracking-wide mb-1">
        {hasPsf ? 'Avg. Price / Sq.Ft' : 'Avg. Monthly Rent'}
      </p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl sm:text-4xl font-black">
          {hasPsf
            ? `₹${fmtINR(avgPsf)}`
            : avgMonthlyRent > 0
              ? `₹${fmtINR(avgMonthlyRent)}`
              : '—'}
        </span>
        {hasPsf && <span className="text-primary-200 text-sm mb-1">per sqft</span>}
        {!hasPsf && avgMonthlyRent > 0 && <span className="text-primary-200 text-sm mb-1">per month</span>}
      </div>

      {hasPsf && (
        <div className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4',
          trend === 'up'   ? 'bg-green-500/20 text-green-300' :
          trend === 'down' ? 'bg-red-500/20 text-red-300' :
                             'bg-white/10 text-primary-200',
        )}>
          <TrendIcon trend={trend} size="xs" />
          {trend === 'up' ? `+${trendPct}%` : trend === 'down' ? `-${trendPct}%` : 'Stable'} vs prev 90d
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs border-t border-primary-500/30 pt-4">
        <div>
          <p className="text-primary-300 mb-0.5">Market Status</p>
          <p className="font-semibold">
            {trendPct > 8 ? '🔥 Hot Market' : trendPct > 3 ? '📈 Growing' : '📊 Stable'}
          </p>
        </div>
        <div>
          <p className="text-primary-300 mb-0.5">Best Time to</p>
          <p className="font-semibold">
            {trend === 'up' ? '⚡ Buy Now' : trend === 'stable' ? '📋 Evaluate' : '⏳ Wait'}
          </p>
        </div>
        {displayCount > 0 && (
          <div className="col-span-2 border-t border-primary-500/30 pt-3">
            <p className="text-primary-300 mb-0.5">Active Listings</p>
            <p className="font-semibold">{fmtINR(displayCount, 0)} properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyVsRentCard({ city, snap }: {
  city: string;
  snap: { buySavingsPct: number; rentYield: number; trend: Trend; trendPct: number };
}) {
  const trendText =
    snap.trend === 'up'
      ? `Prices rising ${snap.trendPct}% vs last quarter — lock in a lower entry price now.`
      : snap.trend === 'down'
      ? `Prices softened ${snap.trendPct}% — strong negotiation window for buyers.`
      : `Stable market — low risk entry with steady appreciation expected.`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚖️</span>
        <p className="font-bold text-gray-900 text-sm">Buy vs Rent in {city}</p>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Buying saves</p>
          <p className="text-xl font-black text-green-600">{snap.buySavingsPct}%</p>
          <p className="text-[10px] text-gray-400">over 10 years</p>
        </div>
        <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Rental yield</p>
          <p className="text-xl font-black text-blue-600">{snap.rentYield}%</p>
          <p className="text-[10px] text-gray-400">annual gross</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 flex items-start gap-1.5">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-primary-500" />
        {trendText}
      </p>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded-xl', className)} />;
}

function SnapshotSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="space-y-4">
        <SkeletonBlock className="h-52" />
        <SkeletonBlock className="h-40" />
      </div>
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex justify-between">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-5" />
        ))}
      </div>
    </div>
  );
}

export default function CityPriceSnapshot() {
  const reduxCity  = useAppSelector((s) => s.ui.selectedCity);

  // ── Load city list from API ──────────────────────────────────────────────────
  const { data: citiesRes } = useQuery({
    queryKey: ['market-cities'],
    queryFn: () => homeApi.getMarketCities(12).then((r) => r.data),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const apiCities: string[] = citiesRes?.data?.map((c: any) => c.city) ?? [];
  const cityList = apiCities.length > 0 ? apiCities : FALLBACK_CITIES;

  // ── Active city state ────────────────────────────────────────────────────────
  const [activeCity, setActiveCity] = useState<string>(() =>
    FALLBACK_CITIES.includes(reduxCity) ? reduxCity : FALLBACK_CITIES[0],
  );

  // Once cityList loads, snap activeCity to first available if current isn't in list
  useEffect(() => {
    if (cityList.length > 0 && !cityList.includes(activeCity)) {
      // Prefer redux city if available, else first city with data
      const preferred = cityList.find(c => c.toLowerCase() === (reduxCity || '').toLowerCase());
      setActiveCity(preferred || cityList[0]);
    }
  }, [cityList.join(',')]); // eslint-disable-line

  // ── Load snapshot for active city ───────────────────────────────────────────
  const { data: snapRes, isLoading } = useQuery({
    queryKey: ['price-snapshot', activeCity],
    queryFn: () => homeApi.getPriceSnapshot({ city: activeCity }).then((r) => r.data),
    staleTime: 30 * 60 * 1000, // 30 min — snapshot is refreshed every 4h server-side
    enabled: !!activeCity,
  });

  const snap = snapRes?.data;
  const hasPsfData = !isLoading && snap && snap.avgPricePerSqft > 0;
  const hasRentData = !isLoading && snap && snap.avgMonthlyRent > 0;
  const hasData = !isLoading && snap && (snap.totalListingCount > 0 || hasPsfData || hasRentData);
  const localities = snap?.localities ?? [];
  // Use avgRent for locality bars when no PSF data exists
  const maxPsf = hasPsfData
    ? Math.max(...localities.map((l: any) => l.medianPsf || l.avgPsf || 0))
    : Math.max(...localities.map((l: any) => l.avgRent || 0));

  return (
    <section className="py-5 sm:py-14 bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                Market Intelligence
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {activeCity} Price Snapshot
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Unit-normalised avg prices, locality trends &amp; buy vs rent — based on active listings
            </p>
          </div>

          <Link
            href={`/properties?city=${encodeURIComponent(activeCity)}`}
            className="hidden sm:flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline"
          >
            Explore {activeCity} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* City tabs */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 sm:mb-8">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
            {cityList.map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                  activeCity === city
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:text-primary-600',
                )}
              >
                <MapPin className="w-3 h-3" />
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <SnapshotSkeleton />
        ) : !hasData ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">No price data for {activeCity} yet</p>
            <p className="text-xs mt-1">
              Price stats appear once approved listings are accumulated in this city.
            </p>
            <Link
              href={`/properties?city=${encodeURIComponent(activeCity)}`}
              className="inline-flex items-center gap-1 mt-4 text-primary-600 text-sm font-medium hover:underline"
            >
              Browse available listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Left column */}
            <div className="space-y-4">
              <PriceGauge
                avgPsf={snap.avgPricePerSqft}
                avgMonthlyRent={snap.avgMonthlyRent}
                trend={snap.trend}
                trendPct={snap.trendPct}
                listingCount={snap.listingCount}
                totalListingCount={snap.totalListingCount ?? 0}
              />
              <BuyVsRentCard city={activeCity} snap={snap} />
            </div>

            {/* Right: Locality bars */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-sm">
                  {hasPsfData ? 'Top Localities by Price/Sqft' : 'Top Localities by Monthly Rent'}
                </h3>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {hasPsfData ? '₹/sqft' : '₹/mo'}
                </span>
              </div>

              {localities.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-xs">Locality breakdown will appear as more listings accumulate.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {localities.map((loc: any) => {
                    const locValue = hasPsfData
                      ? (loc.medianPsf || loc.avgPsf || 0)
                      : (loc.avgRent || 0);
                    return (
                      <LocalityBar
                        key={loc.name}
                        name={loc.name}
                        value={locValue}
                        maxValue={maxPsf}
                        trend={loc.trend}
                        city={activeCity}
                        isRent={!hasPsfData}
                      />
                    );
                  })}
                </div>
              )}

              {/* Legend + data note */}
              <div className="mt-5 pt-4 border-t border-gray-50 flex flex-wrap gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <TrendingUp  className="w-3 h-3 text-green-500" /> Rising
                </span>
                <span className="flex items-center gap-1">
                  <Minus       className="w-3 h-3 text-gray-400"  /> Stable
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-500"  /> Falling
                </span>
                <span className="ml-auto text-[10px]">
                  Based on {fmtINR(snap.totalListingCount ?? snap.listingCount, 0)} active listings (last 90d)
                  {snap.lastUpdated && ` · Updated ${new Date(snap.lastUpdated).toLocaleDateString('en-IN')}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="sm:hidden mt-4">
          <Link
            href={`/properties?city=${encodeURIComponent(activeCity)}`}
            className="flex items-center justify-center gap-2 w-full border border-primary-200 text-primary-700 font-medium text-sm py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            Explore {activeCity} properties <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
