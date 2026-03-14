/**
 * App Router streaming loading state for /properties.
 * Next.js shows this instantly while the server component streams in.
 * Prevents the blank-page flash on first navigation.
 */
import { PropertyGridSkeleton } from '@/components/skeleton';
import { FilterSkeleton } from '@/components/skeleton';

export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Sticky search bar placeholder */}
      <div className="bg-white border-b border-gray-100 shadow-sm h-[57px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex gap-6">
          {/* Sidebar skeleton — desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSkeleton />
          </aside>

          {/* Main content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="skeleton-shimmer h-6 w-48 rounded" />
                <div className="skeleton-shimmer h-3 w-32 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="skeleton-shimmer h-9 w-24 rounded-xl" />
                <div className="skeleton-shimmer h-9 w-24 rounded-xl" />
              </div>
            </div>
            <PropertyGridSkeleton count={9} />
          </div>
        </div>
      </div>
    </div>
  );
}
