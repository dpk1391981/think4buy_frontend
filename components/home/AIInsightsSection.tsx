'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, TrendingUp, Clock, MapPin, DollarSign, Building2,
  ChevronRight, Lightbulb, ArrowRight,
} from 'lucide-react';
import { homeApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store';

type InsightType = 'timing' | 'price' | 'location' | 'investment' | 'type';

interface ApiInsight {
  type:       InsightType;
  tag:        string;
  title:      string;
  body:       string;
  cta:        string;
  href:       string;
  confidence: number;
}

const TYPE_META: Record<InsightType, { icon: React.ElementType; iconColor: string; bgColor: string; barColor: string }> = {
  timing:     { icon: Clock,      iconColor: 'text-orange-500', bgColor: 'bg-orange-50',  barColor: 'bg-orange-400' },
  price:      { icon: DollarSign, iconColor: 'text-green-600',  bgColor: 'bg-green-50',   barColor: 'bg-green-500'  },
  location:   { icon: MapPin,     iconColor: 'text-blue-600',   bgColor: 'bg-blue-50',    barColor: 'bg-blue-500'   },
  investment: { icon: TrendingUp, iconColor: 'text-purple-600', bgColor: 'bg-purple-50',  barColor: 'bg-purple-500' },
  type:       { icon: Building2,  iconColor: 'text-teal-600',   bgColor: 'bg-teal-50',    barColor: 'bg-teal-500'   },
};

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            value >= 90 ? 'bg-green-500' : value >= 75 ? 'bg-blue-500' : 'bg-orange-400',
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{value}% confidence</span>
    </div>
  );
}

function InsightCard({ insight }: { insight: ApiInsight }) {
  const meta = TYPE_META[insight.type] ?? TYPE_META.timing;
  const Icon = meta.icon;

  return (
    <div className={cn(
      'group flex flex-col rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300',
      'hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 bg-white',
    )}>
      <div className={cn('h-1', meta.barColor)} />

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', meta.bgColor)}>
            <Icon className={cn('w-4 h-4', meta.iconColor)} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">
            {insight.tag}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug mb-2">{insight.title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed flex-1">{insight.body}</p>

        <div className="my-3">
          <ConfidenceMeter value={insight.confidence} />
        </div>

        <Link
          href={insight.href}
          className={cn(
            'flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80',
            meta.bgColor,
            meta.iconColor,
          )}
        >
          {insight.cta}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function InsightCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse bg-white">
      <div className="h-1 bg-gray-200" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-gray-200" />
          <div className="w-20 h-5 rounded-lg bg-gray-200" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-1.5 bg-gray-200 rounded-full mt-2" />
        <div className="h-9 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default function AIInsightsSection() {
  const selectedCity  = useAppSelector((s) => s.ui.selectedCity);
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const locationLabel = selectedCity || selectedState || 'India';

  const [activeInsight, setActiveInsight] = useState(0);

  const { data: res, isLoading } = useQuery({
    queryKey: ['market-insights', selectedCity, selectedState],
    queryFn: () => homeApi.getInsights({
      city:  selectedCity  || undefined,
      state: !selectedCity && selectedState ? selectedState : undefined,
    }).then((r) => r.data),
    staleTime: 15 * 60 * 1000,
  });

  const insights: ApiInsight[] = res?.data?.insights ?? [];
  const hasData = !isLoading && insights.length > 0;

  // Rotate featured insight every 4s
  useEffect(() => {
    if (!hasData) return;
    const id = setInterval(() => setActiveInsight((p) => (p + 1) % insights.length), 4000);
    return () => clearInterval(id);
  }, [hasData, insights.length]);

  const featured = insights[activeInsight] ?? null;

  return (
    <section className="py-5 sm:py-14 bg-white">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Data-Driven Insights</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Smart Insights for {locationLabel}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Intelligence derived from real listing activity, prices &amp; inquiries on the platform
            </p>
          </div>

          <Link
            href="/articles"
            className="hidden sm:flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline"
          >
            Real Estate Guides <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured insight banner */}
        {isLoading ? (
          <div className="mb-4 sm:mb-6 animate-pulse h-40 rounded-2xl bg-gradient-to-br from-violet-200 to-indigo-200" />
        ) : featured ? (
          <div className="mb-4 sm:mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 p-5 sm:p-7 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Insight of the Day</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{featured.title}</h3>
                <p className="text-sm text-purple-100 leading-relaxed max-w-xl">{featured.body}</p>
              </div>

              {/* Dot indicators */}
              <div className="flex sm:flex-col gap-2 sm:gap-1.5">
                {insights.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveInsight(i)}
                    className={cn(
                      'rounded-full transition-all',
                      i === activeInsight ? 'w-6 h-2 sm:w-2 sm:h-6 bg-yellow-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <InsightCardSkeleton key={i} />)}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Insights will appear as listings and activity data accumulates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.type} insight={insight} />
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-5">
          * Insights are derived from real listing data on Think4BuySale. Not financial advice.
        </p>
      </div>
    </section>
  );
}
