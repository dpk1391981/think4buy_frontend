'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, ArrowRight, ChevronLeft, ChevronRight,
  BedDouble, Maximize2, Building2, Sparkles, BadgeCheck, Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { useAppSelector } from '@/lib/store';
import OptimizedImage from '@/components/common/OptimizedImage';
import { formatPrice, formatArea, getPropertyTypeLabel, getPrimaryImage } from '@/lib/utils';
import { Property } from '@/types/property';

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ property }: { property: Property }) {
  const image   = getPrimaryImage(property.images);
  const builder = property.builderName || property.owner?.company;
  const location = [property.locality, property.city].filter(Boolean).join(', ');
  const isUC    = property.possessionStatus === 'under_construction';

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 h-full"
    >
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 flex-shrink-0">
        <OptimizedImage
          src={image}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width:640px) 80vw, 280px"
        />

        {/* Gradient: top fade for badges, bottom fade for text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        {/* Top-left: NEW LAUNCH */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 bg-primary-600 text-white text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-lg">
            <Sparkles className="w-2.5 h-2.5" />
            NEW LAUNCH
          </span>
        </div>

        {/* Top-right: property type */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/15 backdrop-blur-md border border-white/30 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
            {getPropertyTypeLabel(property.type)}
          </span>
        </div>

        {/* Bottom overlay: title + price */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3.5 pt-8">
          <p className="text-white font-bold text-sm leading-snug line-clamp-1 drop-shadow mb-0.5">
            {property.title}
          </p>
          <p className="text-white/90 font-black text-xl leading-none drop-shadow">
            {formatPrice(property.price, property.priceUnit)}
          </p>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2.5">

        {/* Builder row */}
        {builder ? (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-primary-700 truncate">{builder}</span>
            {property.isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400">Independent Project</span>
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-gray-500 line-clamp-1">{location || property.city}</span>
        </div>

        {/* Specs + possession */}
        <div className="flex items-center gap-2 flex-wrap">
          {property.bedrooms && (
            <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-lg">
              <BedDouble className="w-3 h-3 text-gray-400" />
              {property.bedrooms} BHK
            </span>
          )}
          {property.area && (
            <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-lg">
              <Maximize2 className="w-3 h-3 text-gray-400" />
              {formatArea(property.area, property.areaUnit ?? 'sqft')}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg ${
            isUC
              ? 'bg-amber-50 border border-amber-100 text-amber-700'
              : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
          }`}>
            <Calendar className="w-3 h-3" />
            {isUC ? 'Under Const.' : 'Ready'}
          </span>
        </div>

        {/* CTA — pushed to bottom */}
        <div className="mt-auto pt-2 border-t border-gray-50">
          <span className="flex items-center justify-center gap-1.5 w-full bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200 group-hover:bg-primary-600 group-hover:text-white">
            View Project
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

import { PropertyCardSkeleton } from '@/components/skeleton';

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[80vw] sm:w-[280px]">
      <PropertyCardSkeleton />
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TopNewProjects() {
  const scrollRef       = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const selectedState   = useAppSelector(s => s.ui.selectedState);
  const selectedStateId = useAppSelector(s => s.ui.selectedStateId);
  const selectedCity    = useAppSelector(s => s.ui.selectedCity);

  useEffect(() => { setMounted(true); }, []);

  // city > stateId > state — same priority as FeaturedProperties
  const locationParams: Record<string, any> = {};
  if (selectedCity)         locationParams.city    = selectedCity;
  else if (selectedStateId) locationParams.stateId = selectedStateId;
  else if (selectedState)   locationParams.state   = selectedState;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['home-new-projects', selectedStateId || selectedState, selectedCity],
    queryFn: () =>
      propertiesApi
        .getAll({
          possessionStatus: 'under_construction',
          approvalStatus: 'approved',
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          limit: 10,
          ...locationParams,
        })
        .then(r => {
          const d = r.data;
          return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        }),
    staleTime: 3 * 60 * 1000,
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };

  if (!isLoading && projects.length === 0) return null;

  const locationLabel = mounted
    ? (selectedCity ? `in ${selectedCity}` : selectedState ? `in ${selectedState}` : 'across India')
    : 'across India';

  const viewAllBase = '/properties?possessionStatus=under_construction&approvalStatus=approved';
  const viewAllHref = mounted && selectedCity
    ? `${viewAllBase}&city=${encodeURIComponent(selectedCity)}`
    : mounted && selectedState
    ? `${viewAllBase}&state=${encodeURIComponent(selectedState)}`
    : viewAllBase;

  return (
    <section className="py-5 sm:py-14 bg-gray-50 border-t border-gray-100">
      <div className="container-max">

        {/* Header */}
        <div className="flex items-end justify-between mb-3 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                <Sparkles className="w-3 h-3" />
                NEW PROJECTS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              Top New Launches
            </h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Freshest under-construction properties {locationLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Arrow buttons — desktop */}
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
              href={viewAllHref}
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Location pill */}
        {mounted && (selectedCity || selectedState) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-xl w-fit">
            <span>📍 Showing projects in <strong>{selectedCity || selectedState}</strong></span>
          </div>
        )}

        {/* Scroll row */}
        <div className="-mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-2"
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : projects.map((p: Property) => (
                  <div key={p.id} className="flex-shrink-0 w-[80vw] sm:w-[280px] snap-start">
                    <ProjectCard property={p} />
                  </div>
                ))
            }
          </div>
        </div>

        {/* Mobile view-all */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            View All New Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
