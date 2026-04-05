'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Minus, BarChart2, ArrowRight,
  MapPin, Info, Lightbulb, Building2, Home, DollarSign,
} from 'lucide-react';
import { homeApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store';

// ─── Indian number formatter ──────────────────────────────────────────────────
function fmtINR(n: number, decimals = 1): string {
  if (!n || n <= 0) return '0';
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(decimals).replace(/\.0$/, '')}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(decimals).replace(/\.0$/, '')}L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(decimals).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-IN');
}

function fmtPsf(n: number): string {
  if (!n || n <= 0) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

const FALLBACK_CITIES = [
  'Noida', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Mumbai', 'Gurgaon',
];

type Trend = 'up' | 'down' | 'stable' | 'insufficient_data';

function TrendIcon({ trend, size = 'sm' }: { trend: Trend; size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4';
  if (trend === 'up')   return <TrendingUp   className={cn(cls, 'text-green-500')} />;
  if (trend === 'down') return <TrendingDown  className={cn(cls, 'text-red-500')} />;
  if (trend === 'insufficient_data') return <Minus className={cn(cls, 'text-gray-300')} />;
  return <Minus className={cn(cls, 'text-gray-400')} />;
}

function TrendBadge({ trend, pct }: { trend: Trend; pct?: number }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold';
  if (trend === 'up')   return <span className={cn(base, 'bg-green-100 text-green-700')}>▲ {pct ? `${pct}%` : 'Rising'}</span>;
  if (trend === 'down') return <span className={cn(base, 'bg-red-100 text-red-600')}>▼ {pct ? `${pct}%` : 'Falling'}</span>;
  if (trend === 'insufficient_data') return <span className={cn(base, 'bg-gray-50 text-gray-400 border border-gray-200')}>— Insufficient data</span>;
  return <span className={cn(base, 'bg-gray-100 text-gray-500')}>— Stable</span>;
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfidenceBadge({ label }: { label?: 'High' | 'Medium' | 'Low' | string }) {
  if (!label) return null;
  const styles = {
    High:   'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low:    'bg-red-50 text-red-500 border-red-200',
  };
  const style = styles[label as keyof typeof styles] || styles.Low;
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border', style)}>
      {label}
    </span>
  );
}

// ─── Mini sparkline chart (pure CSS bars) ─────────────────────────────────────
function SparklineChart({ data }: { data: { month: string; avgSalePsf: number; avgRentPsf: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxPsf = Math.max(...data.map(d => d.avgSalePsf || 0), 1);
  const maxRent = Math.max(...data.map(d => d.avgRentPsf || 0), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => {
          const salePct = maxPsf > 0 ? Math.round((d.avgSalePsf / maxPsf) * 100) : 0;
          const rentPct = maxRent > 0 ? Math.round((d.avgRentPsf / maxRent) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
              <div className="w-full flex items-end gap-0.5 h-16">
                {d.avgSalePsf > 0 && (
                  <div
                    className="flex-1 bg-primary-500 rounded-t opacity-80 group-hover:opacity-100 transition-all"
                    style={{ height: `${Math.max(salePct, 4)}%` }}
                    title={`Sale: ₹${d.avgSalePsf}/sqft`}
                  />
                )}
                {d.avgRentPsf > 0 && (
                  <div
                    className="flex-1 bg-emerald-400 rounded-t opacity-70 group-hover:opacity-100 transition-all"
                    style={{ height: `${Math.max(rentPct, 4)}%` }}
                    title={`Rent: ₹${d.avgRentPsf}/sqft/mo`}
                  />
                )}
              </div>
              <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary-500 inline-block" /> Sale PSF</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Rent PSF</span>
      </div>
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon, color, badge,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color: string; badge?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-xl border p-4 flex items-start gap-3', color)}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-xl font-black text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        {badge && <div className="mt-1">{badge}</div>}
      </div>
    </div>
  );
}

// ─── Smart insights panel ──────────────────────────────────────────────────────
function SmartInsightsPanel({ insights }: { insights: string[] }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <p className="text-sm font-bold text-gray-900">Smart Market Insights</p>
        <span className="ml-auto text-[10px] bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-semibold">AI</span>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="text-xs text-gray-700 leading-relaxed flex items-start gap-1.5">
            <span className="mt-0.5 flex-shrink-0 text-amber-400">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Locality table ───────────────────────────────────────────────────────────
function LocalityTable({ localities, city, hasPsfData }: {
  localities: any[]; city: string; hasPsfData: boolean;
}) {
  if (!localities || localities.length === 0) return (
    <div className="text-center py-8 text-gray-400 text-xs">
      Locality breakdown will appear once 3+ listings accumulate per locality.
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-gray-400 font-semibold pr-3 min-w-[120px]">Locality</th>
            {hasPsfData && <th className="pb-2 text-gray-400 font-semibold text-right pr-2">Sale PSF</th>}
            <th className="pb-2 text-gray-400 font-semibold text-right pr-2">Rent PSF</th>
            <th className="pb-2 text-gray-400 font-semibold text-right pr-2 hidden sm:table-cell">Circle Rate</th>
            <th className="pb-2 text-gray-400 font-semibold text-right pr-2 hidden sm:table-cell">Premium</th>
            <th className="pb-2 text-gray-400 font-semibold text-right pr-2">Yield</th>
            <th className="pb-2 text-gray-400 font-semibold text-right">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {localities.map((loc: any) => {
            const premium   = loc.pricePremium;
            const hasCircle = loc.circleRate > 0;
            const hasRentYield = loc.rentYield !== null && loc.rentYield !== undefined;
            return (
              <tr key={loc.name} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/properties?city=${encodeURIComponent(city)}&locality=${encodeURIComponent(loc.name)}`}
                    className="font-semibold text-gray-800 hover:text-primary-600 transition-colors"
                  >
                    {loc.name}
                  </Link>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-gray-400">{loc.listingCount || 0} listings</span>
                    {loc.confidenceLabel && <ConfidenceBadge label={loc.confidenceLabel} />}
                  </div>
                </td>
                {hasPsfData && (
                  <td className="py-2.5 pr-2 text-right font-bold text-gray-900">
                    {loc.medianPsf > 0
                      ? <>{fmtPsf(loc.medianPsf)}<span className="text-gray-400 font-normal">/sqft</span></>
                      : <span className="text-gray-300 font-normal">No Data</span>
                    }
                  </td>
                )}
                <td className="py-2.5 pr-2 text-right text-emerald-700 font-semibold">
                  {loc.rentPsf > 0
                    ? <>₹{loc.rentPsf}<span className="text-emerald-500 font-normal">/sqft</span></>
                    : <span className="text-gray-300 font-normal">—</span>
                  }
                  {loc.rentListingCount > 0 && (
                    <div className="text-[10px] text-gray-400 font-normal">{loc.rentListingCount} rent</div>
                  )}
                </td>
                <td className="py-2.5 pr-2 text-right hidden sm:table-cell">
                  {hasCircle ? (
                    <span className="text-purple-700 font-semibold">
                      ₹{fmtINR(loc.circleRate)}<span className="text-purple-400 font-normal">/sqft</span>
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-2 text-right hidden sm:table-cell">
                  {hasCircle && premium !== null && premium !== undefined ? (
                    <span className={cn(
                      'font-semibold',
                      premium > 20 ? 'text-red-500' : premium > 0 ? 'text-orange-500' : 'text-green-600',
                    )}>
                      {premium >= 0 ? '+' : ''}{Math.round(premium)}%
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-2 text-right font-semibold text-blue-600">
                  {hasRentYield ? `${(loc.rentYield as number).toFixed(1)}%` : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2.5 text-right">
                  <TrendBadge trend={loc.trend || 'insufficient_data'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded-xl', className)} />;
}
function SnapshotSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-36" />
          <SkeletonBlock className="h-28" />
        </div>
        <div className="lg:col-span-2">
          <SkeletonBlock className="h-64" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CityPriceSnapshot({ city: cityProp }: { city?: string }) {
  const reduxCity = useAppSelector((s) => s.ui.selectedCity);
  const effectiveCity = cityProp ?? reduxCity;

  const { data: citiesRes } = useQuery({
    queryKey: ['market-cities'],
    queryFn:  () => homeApi.getMarketCities(12).then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });

  const apiCities: string[] = citiesRes?.data?.map((c: any) => c.city) ?? [];
  const cityList = apiCities.length > 0 ? apiCities : FALLBACK_CITIES;

  const [activeCity, setActiveCity] = useState<string>(() => {
    if (effectiveCity && FALLBACK_CITIES.includes(effectiveCity)) return effectiveCity;
    return FALLBACK_CITIES[0];
  });

  useEffect(() => {
    if (cityList.length > 0 && !cityList.includes(activeCity)) {
      const preferred = cityList.find(c => c.toLowerCase() === (effectiveCity || '').toLowerCase());
      setActiveCity(preferred || cityList[0]);
    }
  }, [cityList.join(',')]); // eslint-disable-line

  const { data: snapRes, isLoading } = useQuery({
    queryKey: ['price-snapshot', activeCity],
    queryFn:  () => homeApi.getPriceSnapshot({ city: activeCity }).then((r) => r.data),
    staleTime: 30 * 60 * 1000,
    enabled:  !!activeCity,
  });

  const snap           = snapRes?.data;
  const hasPsfData     = !isLoading && snap && snap.avgPricePerSqft > 0;
  const hasRentData    = !isLoading && snap && snap.avgMonthlyRent > 0;
  const hasRentYield   = snap?.rentYield !== null && snap?.rentYield !== undefined && (snap?.rentYield ?? 0) > 0;
  const hasBuySavings  = snap?.buySavingsPct !== null && snap?.buySavingsPct !== undefined && (snap?.buySavingsPct ?? 0) > 0;
  const hasData        = !isLoading && snap && (snap.totalListingCount > 0 || hasPsfData || hasRentData);
  const localities     = snap?.localities ?? [];
  const priceTrend     = snap?.priceTrend ?? [];
  const smartInsights  = snap?.smartInsights ?? [];
  const confidenceLabel = snap?.confidenceLabel as string | undefined;
  const insufficientData = snap?.insufficientData ?? false;
  const psfCount       = snap?.psfListingCount ?? snap?.listingCount ?? 0;
  const rentCount      = snap?.rentListingCount ?? 0;

  return (
    <section className="py-5 sm:py-14 bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
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
              Sale PSF · Rent PSF · Circle Rates · 6-month trend — from active listings
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
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 sm:mb-6">
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
          <div className="space-y-4 sm:space-y-6">

            {/* ── Top metric cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Sale Price / Sqft"
                value={hasPsfData
                  ? (snap.avgPricePerSqftFormatted ?? `₹${snap.avgPricePerSqft.toLocaleString('en-IN')}`)
                  : 'No Data'}
                sub={hasPsfData
                  ? `Median P50 · ${psfCount} listings`
                  : 'Insufficient listings (need 5+)'}
                icon={<Home className="w-4 h-4 text-primary-500" />}
                color="bg-primary-50 border-primary-100"
                badge={hasPsfData
                  ? <TrendBadge trend={(snap.trend as Trend) || 'insufficient_data'} pct={snap.trendPct} />
                  : <span className="text-[10px] text-gray-400">Need 5+ listings</span>}
              />
              <MetricCard
                label="Rent / Sqft / Month"
                value={snap.avgRentPsf > 0 ? `₹${snap.avgRentPsf}` : 'No Data'}
                sub={snap.avgRentPsf > 0
                  ? `${rentCount > 0 ? `${rentCount} ` : ''}rent listings`
                  : 'Need 5+ rent listings'}
                icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                color="bg-emerald-50 border-emerald-100"
              />
              <MetricCard
                label="Rental Yield"
                value={hasRentYield ? `${snap.rentYield}%` : 'No Data'}
                sub={hasRentYield ? 'Sale + rent combined' : 'Need 5+ sale & 5+ rent'}
                icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
                color="bg-blue-50 border-blue-100"
              />
              <MetricCard
                label="Buy vs Rent"
                value={hasBuySavings ? `${snap.buySavingsPct}% savings` : 'No Data'}
                sub={hasBuySavings ? 'Buying over 10 years' : 'Need sale + rent data'}
                icon={<Building2 className="w-4 h-4 text-purple-500" />}
                color="bg-purple-50 border-purple-100"
              />
            </div>

            {/* ── Data quality banner ── */}
            {insufficientData && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Insufficient data for {activeCity}.</span>{' '}
                  Price insights require at least 5 approved listings.
                  Values will appear as more properties are listed.
                </div>
              </div>
            )}
            {!insufficientData && confidenceLabel && confidenceLabel !== 'High' && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[11px] text-gray-500">
                <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>
                  Data confidence: <ConfidenceBadge label={confidenceLabel} />{' '}
                  — Based on {psfCount} listings · Confidence improves with more data.
                </span>
              </div>
            )}

            {/* ── Main grid: trend chart + locality table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

              {/* Left: 6-month trend + buy vs rent stats */}
              <div className="space-y-4">
                {priceTrend.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">6-Month Price Trend</h3>
                    <SparklineChart data={priceTrend} />
                    {priceTrend.length > 0 && (
                      <div className="mt-3 text-[11px] text-gray-400">
                        {(() => {
                          const first = priceTrend[0]?.avgSalePsf || 0;
                          const last  = priceTrend[priceTrend.length - 1]?.avgSalePsf || 0;
                          if (first > 0 && last > 0) {
                            const chg = ((last - first) / first * 100).toFixed(1);
                            return `Sale PSF ${Number(chg) >= 0 ? '+' : ''}${chg}% over 6 months`;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Buy vs rent card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">⚖️</span>
                    <p className="font-bold text-gray-900 text-sm">Buy vs Rent — {activeCity}</p>
                  </div>
                  {hasBuySavings || hasRentYield ? (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-500 mb-0.5">Buying saves</p>
                        {hasBuySavings
                          ? <p className="text-xl font-black text-green-600">{snap.buySavingsPct}%</p>
                          : <p className="text-sm font-bold text-gray-400">No Data</p>
                        }
                        <p className="text-[10px] text-gray-400">over 10 years</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-500 mb-0.5">Rental yield</p>
                        {hasRentYield
                          ? <p className="text-xl font-black text-blue-600">{snap.rentYield}%</p>
                          : <p className="text-sm font-bold text-gray-400">No Data</p>
                        }
                        <p className="text-[10px] text-gray-400">annual gross</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-400">
                      <p>Buy vs Rent analysis requires both</p>
                      <p>sale and rent listings in {activeCity}.</p>
                    </div>
                  )}
                  {hasRentData && snap.trend !== 'insufficient_data' && (
                    <div className="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2.5 flex items-start gap-1.5">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-primary-400" />
                      {snap.trend === 'up'
                        ? `Prices rising ${snap.trendPct}% vs last quarter — lock in a lower entry price now.`
                        : snap.trend === 'down'
                        ? `Prices softened ${snap.trendPct}% — strong negotiation window for buyers.`
                        : 'Stable market — low risk entry with steady appreciation expected.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Right col (2/3): locality table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Localities — Price &amp; Rental Analysis
                  </h3>
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg hidden sm:inline">
                    Sorted by rank score
                  </span>
                </div>

                <LocalityTable localities={localities} city={activeCity} hasPsfData={!!hasPsfData} />

                {/* Circle rate legend */}
                {localities.some((l: any) => l.circleRate > 0) && (
                  <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] text-gray-400 flex items-start gap-1.5">
                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-purple-400" />
                    <span>
                      <strong>Circle Rate</strong> = government minimum price per sqft (stamp duty basis).
                      <strong> Premium</strong> = how much market price exceeds the circle rate.
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><TrendingUp  className="w-3 h-3 text-green-500" /> Rising</span>
                  <span className="flex items-center gap-1"><Minus       className="w-3 h-3 text-gray-400"  /> Stable</span>
                  <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500"  /> Falling</span>
                  <span className="ml-auto text-[10px] flex items-center gap-1.5">
                    {psfCount > 0 ? `${psfCount} listings` : `${fmtINR(snap.totalListingCount, 0)} total`}
                    {confidenceLabel && <ConfidenceBadge label={confidenceLabel} />}
                    {snap.lastUpdated && ` · Updated ${new Date(snap.lastUpdated).toLocaleDateString('en-IN')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Smart Insights ── */}
            {smartInsights.length > 0 && (
              <SmartInsightsPanel insights={smartInsights} />
            )}

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
