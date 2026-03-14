/**
 * FilterSkeleton — sidebar filter panel skeleton.
 * Matches the layout of FilterPanel.tsx to avoid layout shift.
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface Props {
  className?: string;
}

function FilterGroup({ label = true, items = 4 }: { label?: boolean; items?: number }) {
  return (
    <div className="space-y-3 py-4 border-b border-gray-100 last:border-0">
      {label && <Shimmer className="h-4 w-24" />}
      <div className="space-y-2">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Shimmer className="h-4 w-4 rounded" />
            <Shimmer className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FilterSkeleton({ className }: Props) {
  return (
    <aside
      aria-busy="true"
      aria-label="Loading filters"
      className={cn('bg-white rounded-xl border border-gray-100 p-4 space-y-1', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-4 w-14" />
      </div>
      {/* Price range */}
      <FilterGroup items={2} />
      {/* Type chips */}
      <div className="py-4 border-b border-gray-100 space-y-3">
        <Shimmer className="h-4 w-28" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
      {/* BHK */}
      <div className="py-4 border-b border-gray-100 space-y-3">
        <Shimmer className="h-4 w-20" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-8 w-10 rounded-lg" />
          ))}
        </div>
      </div>
      <FilterGroup items={3} />
      <FilterGroup items={3} />
    </aside>
  );
}
