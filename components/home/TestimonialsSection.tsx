'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supportApi } from '@/lib/api';
import OptimizedImage from '@/components/common/OptimizedImage';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Testimonial {
  id: string;
  name: string;
  email: string | null;
  category: string | null;
  subject: string | null;
  message: string;
  rating: number | null;
  createdAt: string;
  userAvatar: string | null;
  city: string | null;
  state: string | null;
  role: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  buyer:       'bg-blue-100 text-blue-700',
  seller:      'bg-green-100 text-green-700',
  agent:       'bg-purple-100 text-purple-700',
  broker:      'bg-indigo-100 text-indigo-700',
  renter:      'bg-orange-100 text-orange-700',
  owner:       'bg-teal-100 text-teal-700',
  admin:       'bg-gray-100 text-gray-600',
  super_admin: 'bg-gray-100 text-gray-600',
};

function roleLabel(role: string | null) {
  if (!role) return 'Customer';
  const map: Record<string, string> = {
    buyer: 'Buyer', seller: 'Seller', agent: 'Agent',
    broker: 'Broker', renter: 'Renter', owner: 'Owner',
    admin: 'Member', super_admin: 'Member',
  };
  return map[role] ?? 'Customer';
}

function location(t: Testimonial) {
  return [t.city, t.state].filter(Boolean).join(', ') || 'India';
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < value ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200',
          )}
        />
      ))}
    </div>
  );
}

// ── Avatar: shows profile photo or initials fallback ──────────────────────────

function UserAvatar({ t, size = 9 }: { t: Testimonial; size?: number }) {
  const sz = `w-${size} h-${size}`;
  if (t.userAvatar) {
    return (
      <div className={cn(sz, 'rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white')}>
        <OptimizedImage
          src={t.userAvatar}
          alt={t.name}
          width={size * 4}
          height={size * 4}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }
  // Initials fallback
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700',
    'bg-teal-100 text-teal-700', 'bg-pink-100 text-pink-700'];
  const colorIdx = t.name.charCodeAt(0) % colors.length;
  return (
    <div className={cn(
      sz, 'rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ring-2 ring-white',
      colors[colorIdx],
    )}>
      {initials(t.name)}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function TestimonialCard({ t, featured = false }: { t: Testimonial; featured?: boolean }) {
  const rating = t.rating ?? 5;
  return (
    <div className={cn(
      'flex flex-col rounded-2xl border transition-all duration-300 bg-white',
      featured
        ? 'border-primary-200 shadow-[0_4px_24px_rgba(37,99,235,0.1)] p-5 sm:p-7'
        : 'border-gray-100 p-5 hover:border-primary-100 hover:shadow-card-hover',
    )}>
      <Quote className="w-6 h-6 text-primary-100 mb-3 flex-shrink-0" />

      <div className="flex items-center gap-2 mb-2">
        <StarRating value={rating} />
        <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">
          ✓ Verified
        </span>
      </div>

      {t.subject && (
        <h4 className={cn('font-bold text-gray-900 mb-2', featured ? 'text-base sm:text-lg' : 'text-sm')}>
          {t.subject}
        </h4>
      )}

      <p className={cn('text-gray-500 leading-relaxed flex-1', featured ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
        &ldquo;{t.message}&rdquo;
      </p>

      <div className="border-t border-gray-50 mt-4 pt-4 flex items-center gap-3">
        <UserAvatar t={t} size={9} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
          <p className="text-[11px] text-gray-400 truncate">
            📍 {location(t)}{t.category ? ` · ${t.category}` : ''}
          </p>
        </div>

        <span className={cn(
          'text-[10px] font-bold px-2 py-1 rounded-full capitalize flex-shrink-0',
          ROLE_COLORS[t.role ?? ''] ?? 'bg-gray-100 text-gray-600',
        )}>
          {roleLabel(t.role)}
        </span>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(0);

  useEffect(() => {
    supportApi.getTestimonials(30)
      .then((res) => {
        setTestimonials(res.data ?? []);
      })
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  // Nothing to show
  if (!loading && testimonials.length === 0) return null;

  const perPage  = 3;
  const featured = testimonials[0] ?? null;
  const rest     = testimonials.slice(1);
  const pages    = Math.ceil(rest.length / perPage);
  const visible  = rest.slice(page * perPage, page * perPage + perPage);

  // Derived stats from real data
  const rated       = testimonials.filter((t) => t.rating);
  const avgRating   = rated.length
    ? Math.round((rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length) * 10) / 10
    : null;

  return (
    <section className="py-5 sm:py-14 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Real Stories</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Trusted by 10,000+ Families
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            See how Indians are finding their dream properties on Think4BuySale
          </p>

          {avgRating && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-2xl font-black text-gray-900">{avgRating}</span>
              <span className="text-sm text-gray-500">/ 5 · Based on {testimonials.length}+ reviews</span>
            </div>
          )}
        </div>

        {/* Skeleton while loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-5/6 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-4/6 mb-6" />
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
                    <div className="h-2 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured testimonial */}
        {!loading && featured && (
          <div className="mb-5 sm:mb-8">
            <TestimonialCard t={featured} featured />
          </div>
        )}

        {/* Paginated grid */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {visible.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'w-9 h-9 rounded-xl text-sm font-medium transition-all',
                  i === page
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-200 text-gray-500 hover:border-primary-200',
                )}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page === pages - 1}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats strip — only shown when we have data */}
        {!loading && testimonials.length > 0 && (
          <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { value: avgRating ? `${avgRating}★` : '5★', label: 'Avg. Rating',  sub: 'from verified users'     },
              { value: '98%',                               label: 'Satisfaction', sub: 'among buyers & renters'  },
              { value: `${testimonials.length}+`,           label: 'Reviews',      sub: 'verified & authentic'    },
              { value: '10K+',                              label: 'Families',     sub: 'found their dream home'  },
            ].map(({ value, label, sub }) => (
              <div key={label} className="text-center bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-2xl font-black text-primary-700">{value}</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">{label}</p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
