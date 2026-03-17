'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchStates } from '@/lib/store/slices/locationsSlice';
import OptimizedImage from '@/components/common/OptimizedImage';
import { useAnalytics } from '@/hooks/useAnalytics';

const STATE_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-purple-500 to-purple-700',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
  'from-red-500 to-red-700',
  'from-lime-500 to-lime-700',
  'from-violet-500 to-violet-700',
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-600',
];

function stateToSlug(s: { slug?: string; name: string }): string {
  return s.slug || s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function StatePropertyCount({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="text-[10px] font-semibold text-primary-600">
      {count.toLocaleString('en-IN')}+ props
    </span>
  );
}

export default function StateExplorer() {
  const dispatch = useAppDispatch();
  const { trackStateView } = useAnalytics();

  const selectedCountry   = useAppSelector((s) => s.ui.selectedCountry);
  const selectedCountryId = useAppSelector((s) => s.ui.selectedCountryId);
  const allStates         = useAppSelector((s) => s.locations.states);
  const statesLoaded      = useAppSelector((s) => s.locations.statesLoaded);

  useEffect(() => {
    if (!statesLoaded) {
      dispatch(fetchStates() as any);
    }
  }, [dispatch, statesLoaded]);

  const statesToShow = (
    selectedCountryId
      ? allStates.filter((s) => !s.countryId || s.countryId === selectedCountryId)
      : allStates
  )
    .filter((s) => s.isActive)
    .slice(0, 14);

  if (statesToShow.length === 0) return null;

  const countryLabel = selectedCountry || 'India';

  return (
    <section className="py-5 sm:py-14 bg-white border-b border-gray-100">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Top States in {countryLabel}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Tap a state to explore properties in its cities
            </p>
          </div>
          <Link
            href="/property-for-sale-rent-in-india"
            className="hidden sm:flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline flex-shrink-0"
          >
            View all states <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Circle scroll row ── */}
        <div className="-mx-4 sm:mx-0">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-3">
            {statesToShow.map((state, i) => (
              <StateCircle
                key={state.id}
                state={state}
                index={i}
                onTrack={() => trackStateView(state.name, countryLabel)}
              />
            ))}
          </div>
        </div>

        {/* Mobile view-all */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href="/property-for-sale-rent-in-india"
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            All states in {countryLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Circle Card ───────────────────────────────────────────────────────────────

interface StateCircleProps {
  state: {
    id: string;
    name: string;
    slug?: string;
    code: string;
    imageUrl?: string;
    propertyCount?: number;
    _count?: { properties?: number };
  };
  index: number;
  onTrack: () => void;
}

function StateCircle({ state, index, onTrack }: StateCircleProps) {
  const gradient = STATE_GRADIENTS[index % STATE_GRADIENTS.length];
  const hasImg = !!state.imageUrl;
  const slug = stateToSlug(state);

  return (
    <Link
      href={`/properties-in-${slug}`}
      onClick={onTrack}
      className="group flex-shrink-0 snap-start flex flex-col items-center gap-2 w-[76px] sm:w-[88px] focus:outline-none"
      aria-label={`Explore ${state.name}`}
    >
      {/* Circle */}
      <div className="relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-hidden
        ring-2 ring-gray-100 group-hover:ring-primary-400 group-active:ring-primary-600
        transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:scale-105">

        {hasImg ? (
          <OptimizedImage
            src={state.imageUrl!}
            alt={state.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="88px"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient}
              group-hover:scale-110 transition-transform duration-500
              flex items-center justify-center`}
          >
            <span className="text-white font-bold text-lg sm:text-xl tracking-tight select-none">
              {state.code?.slice(0, 2) || state.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {hasImg && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        )}
      </div>

      {/* State name */}
      <span className="text-xs sm:text-[13px] font-semibold text-gray-800 text-center leading-tight line-clamp-1 w-full">
        {state.name}
      </span>

      <StatePropertyCount count={state.propertyCount ?? state._count?.properties} />
    </Link>
  );
}
