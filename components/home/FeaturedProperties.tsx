'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { propertiesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store';

const TABS = [
  { id: 'featured',  label: '⚡ Featured',     params: { isFeatured: true, limit: 8, approvalStatus: 'approved' } },
  { id: 'premium',   label: '👑 Premium',      params: { isPremium: true, limit: 8, approvalStatus: 'approved' } },
  { id: 'new',       label: '🏗 New Projects',  params: { possessionStatus: 'under_construction', limit: 8, approvalStatus: 'approved' } },
  { id: 'recent',    label: '🕐 Just Listed',   params: { sortBy: 'createdAt', sortOrder: 'DESC', limit: 8, approvalStatus: 'approved' } },
];

function SkeletonCards({ mobile }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[72vw] snap-start bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="skeleton aspect-[4/3]" />
            <div className="p-3 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="skeleton aspect-[4/3]" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TabContent({
  tab,
  stateFilter,
  stateIdFilter,
  cityFilter,
}: {
  tab: (typeof TABS)[0];
  stateFilter: string;
  stateIdFilter: string;
  cityFilter: string;
}) {
  const locationParams: any = {};
  if (cityFilter) locationParams.city = cityFilter;
  else if (stateIdFilter) locationParams.stateId = stateIdFilter;
  else if (stateFilter) locationParams.state = stateFilter;

  const params = { ...tab.params, ...locationParams };

  const { data: properties, isLoading } = useQuery({
    queryKey: ['home-properties', tab.id, stateIdFilter || stateFilter, cityFilter],
    queryFn: () => propertiesApi.getAll(params).then((r) => {
      const d = r.data;
      return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
    }),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return (
    <>
      <div className="sm:hidden"><SkeletonCards mobile /></div>
      <div className="hidden sm:block"><SkeletonCards /></div>
    </>
  );

  if (!properties?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏠</p>
        <p>No properties in this category yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: horizontal snap scroll */}
      <div className="sm:hidden -mx-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory pb-2">
          {properties.map((p: any) => (
            <div key={p.id} className="flex-shrink-0 w-[72vw] snap-start">
              <PropertyCard property={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {properties.map((p: any) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </>
  );
}

export default function FeaturedProperties() {
  const [activeTab, setActiveTab] = useState('featured');
  const tab = TABS.find((t) => t.id === activeTab)!;
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);

  const viewAllHref =
    activeTab === 'new' ? '/new-projects' :
    activeTab === 'premium' ? '/properties?isPremium=true' :
    activeTab === 'recent' ? '/properties?sortBy=createdAt&sortOrder=DESC' :
    '/properties?isFeatured=true';

  return (
    <section className="py-5 sm:py-14 bg-white">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Curated for You</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Top Properties</h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabs — horizontal scroll on mobile */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-5 sm:mb-8">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === t.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location filter indicator */}
        {(selectedCity || selectedState) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-xl w-fit">
            <span>📍 Showing properties in <strong>{selectedCity || selectedState}</strong></span>
          </div>
        )}

        {/* Content */}
        <TabContent
          tab={tab}
          stateFilter={selectedState}
          stateIdFilter={selectedStateId}
          cityFilter={selectedCity}
        />

        {/* View all — mobile */}
        <div className="text-center mt-6 sm:hidden">
          <Link href={viewAllHref} className="btn-outline text-sm py-2">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
