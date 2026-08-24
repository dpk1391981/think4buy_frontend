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

const TYPE_META: Record<InsightType, { icon: React.ElementType; darkIconColor: string }> = {
  timing:     { icon: Clock,      darkIconColor: 'text-orange-300' },
  price:      { icon: DollarSign, darkIconColor: 'text-green-300'  },
  location:   { icon: MapPin,     darkIconColor: 'text-blue-300'   },
  investment: { icon: TrendingUp, darkIconColor: 'text-purple-300' },
  type:       { icon: Building2,  darkIconColor: 'text-teal-300'   },
};

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.12]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            value >= 90 ? 'bg-green-400' : value >= 75 ? 'bg-blue-400' : 'bg-orange-400',
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="flex-shrink-0 text-[10px] font-semibold text-slate-300/55">{value}% confidence</span>
    </div>
  );
}

function InsightCard({ insight }: { insight: ApiInsight }) {
  const meta = TYPE_META[insight.type] ?? TYPE_META.timing;
  const Icon = meta.icon;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-4 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.09] sm:p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10')}>
          <Icon className={cn('w-4 h-4', meta.darkIconColor)} />
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-300/55">
          {insight.tag}
        </span>
      </div>

      <h3 className="mb-1.5 text-[14.5px] font-bold leading-snug text-white">{insight.title}</h3>
      <p className="flex-1 text-[12.5px] leading-relaxed text-slate-300/60">{insight.body}</p>

      <div className="mt-auto pt-3.5">
        <ConfidenceMeter value={insight.confidence} />
        <Link
          href={insight.href}
          className="mt-2.5 flex items-center justify-between text-xs font-bold text-blue-300 transition-colors hover:text-blue-200"
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
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-4 sm:p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-8 w-8 rounded-[10px] bg-white/15" />
        <div className="h-4 w-16 rounded bg-white/10" />
      </div>
      <div className="h-4 w-3/4 rounded bg-white/15" />
      <div className="mt-2.5 h-3 w-full rounded bg-white/10" />
      <div className="mt-1.5 h-3 w-5/6 rounded bg-white/10" />
      <div className="mt-4 h-1 rounded-full bg-white/10" />
      <div className="mt-3 h-3 w-24 rounded bg-white/10" />
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
    <section className="relative overflow-hidden rv-dark py-7 sm:py-12 lg:py-13">
      <div className="absolute inset-0 rv-insights-glow pointer-events-none" />
      <div className="container-rv relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6 lg:mb-[22px]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span className="rv-eyebrow text-violet-300">Decision intelligence</span>
            </div>
            <h2 className="rv-h2-light">
              Smart Insights for {locationLabel}
            </h2>
            <p className="mt-1.5 text-[12.5px] sm:text-sm text-slate-300/65">
              Intelligence derived from real listing activity, prices &amp; inquiries on the platform
            </p>
          </div>

          <Link
            href="/articles"
            className="hidden sm:flex items-center gap-1 text-[13.5px] font-bold text-blue-300 hover:text-blue-200 transition-colors"
          >
            Real Estate Guides <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured insight banner */}
        {isLoading ? (
          <div className="mb-4 sm:mb-6 h-40 animate-pulse rounded-2xl bg-white/[0.08]" />
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
          <div className="py-12 text-center text-slate-300/50">
            <Sparkles className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Insights will appear as listings and activity data accumulates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.type} insight={insight} />
            ))}
          </div>
        )}

        <p className="mt-5 text-center text-[10px] text-slate-300/45">
          * Insights are derived from real listing data on Think4BuySale. Not financial advice.
        </p>
      </div>
    </section>
  );
}
