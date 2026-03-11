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

function SkeletonGrid() {
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
}: {
  tab: (typeof TABS)[0];
  stateFilter: string;
  stateIdFilter: string;
}) {
  // Prefer stateId (FK) for accurate filtering, fallback to state name
  const locationParams = stateIdFilter
    ? { stateId: stateIdFilter }
    : stateFilter
    ? { state: stateFilter }
    : {};
  const params = { ...tab.params, ...locationParams };

  const { data: properties, isLoading } = useQuery({
    queryKey: ['home-properties', tab.id, stateIdFilter || stateFilter],
    queryFn: () => propertiesApi.getAll(params).then((r) => {
      const d = r.data;
      return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
    }),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <SkeletonGrid />;

  if (!properties?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏠</p>
        <p>No properties in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {properties.map((p: any) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}

export default function FeaturedProperties() {
  const [activeTab, setActiveTab] = useState('featured');
  const tab = TABS.find((t) => t.id === activeTab)!;
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);

  const viewAllHref =
    activeTab === 'new' ? '/new-projects' :
    activeTab === 'premium' ? '/properties?isPremium=true' :
    activeTab === 'recent' ? '/properties?sortBy=createdAt&sortOrder=DESC' :
    '/properties?isFeatured=true';

  return (
    <section className="py-14 bg-white">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Curated for You</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Properties</h2>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                activeTab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* State filter indicator */}
        {selectedState && (
          <div className="flex items-center gap-2 mb-4 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-xl w-fit">
            <span>📍 Showing properties in <strong>{selectedState}</strong></span>
          </div>
        )}

        {/* Content */}
        <TabContent tab={tab} stateFilter={selectedState} stateIdFilter={selectedStateId} />

        {/* Mobile view all */}
        <div className="text-center mt-8 sm:hidden">
          <Link href={viewAllHref} className="btn-outline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
