'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePropertyCategories, getCategoryHref } from '@/hooks/usePropertyCategories';
import { cn } from '@/lib/utils';

function formatCount(n: number): string {
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Gradient palette — cycles for any number of categories
const GRADIENTS = [
  { gradient: 'from-blue-500 to-blue-700',     bgLight: 'bg-blue-50',    textColor: 'text-blue-700'    },
  { gradient: 'from-emerald-500 to-teal-600',  bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
  { gradient: 'from-orange-500 to-red-500',    bgLight: 'bg-orange-50',  textColor: 'text-orange-700'  },
  { gradient: 'from-purple-500 to-purple-700', bgLight: 'bg-purple-50',  textColor: 'text-purple-700'  },
  { gradient: 'from-pink-500 to-rose-600',     bgLight: 'bg-pink-50',    textColor: 'text-pink-700'    },
  { gradient: 'from-sky-500 to-cyan-600',      bgLight: 'bg-sky-50',     textColor: 'text-sky-700'     },
  { gradient: 'from-amber-500 to-orange-600',  bgLight: 'bg-amber-50',   textColor: 'text-amber-700'   },
  { gradient: 'from-indigo-500 to-indigo-700', bgLight: 'bg-indigo-50',  textColor: 'text-indigo-700'  },
  { gradient: 'from-teal-500 to-emerald-600',  bgLight: 'bg-teal-50',    textColor: 'text-teal-700'    },
  { gradient: 'from-lime-500 to-green-600',    bgLight: 'bg-lime-50',    textColor: 'text-lime-700'    },
];

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[140px] sm:w-[160px] snap-start animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="aspect-square bg-gray-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-4/5 mx-auto" />
          <div className="h-3 bg-gray-200 rounded w-3/5 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function TopCategories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { categories: allCategories, loading } = usePropertyCategories();
  const categories = allCategories.filter(c => (c.totalListings ?? 0) > 0);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  // Don't render if no categories and not loading
  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-7 sm:py-12 lg:py-13 bg-gray-50">
      <div className="container-rv">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-3 sm:mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                Browse by Category
              </span>
            </div>
            <h2 className="rv-h2 leading-tight">
              Top Categories across India
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Find your perfect property by category
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop scroll arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <Link
              href="/properties"
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Scroll row ── */}
        <div className="-mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-2"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : categories.map((cat, i) => {
                  const style = GRADIENTS[i % GRADIENTS.length];
                  const href  = getCategoryHref(cat.slug);
                  return (
                    <Link
                      key={cat.id}
                      href={href}
                      className="group flex-shrink-0 w-[140px] sm:w-[160px] snap-start block focus:outline-none"
                    >
                      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Icon area */}
                        <div
                          className={cn(
                            'aspect-square flex items-center justify-center bg-gradient-to-br',
                            style.gradient,
                            'group-hover:scale-105 transition-transform duration-500',
                          )}
                        >
                          <span className="text-4xl sm:text-5xl drop-shadow-md select-none filter brightness-110">
                            {cat.icon || '🏠'}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="p-3 text-center">
                          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-primary-700 transition-colors">
                            {cat.name}
                          </h3>
                          {(cat.totalListings ?? 0) > 0 && (
                            <p className={cn('text-[11px] font-semibold mt-0.5', style.textColor)}>
                              {formatCount(cat.totalListings!)} listings
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
            }
          </div>
        </div>

        {/* ── Mobile view all ── */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            Browse All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Bottom strip — desktop only ── */}
        {!loading && categories.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 flex-wrap">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Quick Links:</p>
            {categories.map((cat, i) => {
              const style = GRADIENTS[i % GRADIENTS.length];
              return (
                <Link
                  key={cat.id}
                  href={getCategoryHref(cat.slug)}
                  className={cn(
                    'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    style.bgLight, style.textColor, 'border-current/20 hover:opacity-80',
                  )}
                >
                  <span>{cat.icon || '🏠'}</span>
                  {cat.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
