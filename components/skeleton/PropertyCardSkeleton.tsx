/**
 * PropertyCardSkeleton — mirrors the exact layout of PropertyCard.
 * Prevents CLS by matching grid/list dimensions.
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface Props {
  listView?: boolean;
  className?: string;
}

export default function PropertyCardSkeleton({ listView, className }: Props) {
  if (listView) {
    return (
      <div
        aria-label="Loading property"
        className={cn(
          'bg-white rounded-xl border border-gray-100 overflow-hidden flex gap-0',
          className,
        )}
      >
        {/* Image */}
        <Shimmer className="w-56 flex-shrink-0 h-40 rounded-none" />
        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          <Shimmer className="h-5 w-1/4" />
          <Shimmer className="h-4 w-2/3" />
          <Shimmer className="h-3 w-1/2" />
          <div className="h-px bg-gray-100" />
          <div className="flex gap-4">
            <Shimmer className="h-3 w-14" />
            <Shimmer className="h-3 w-14" />
            <Shimmer className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Shimmer circle className="h-6 w-6" />
            <Shimmer className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label="Loading property"
      className={cn(
        'bg-white rounded-xl border border-gray-100 overflow-hidden',
        className,
      )}
    >
      {/* Image area — aspect-[4/3] matches PropertyCard */}
      <Shimmer className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-3">
        {/* Price */}
        <Shimmer className="h-5 w-1/3" />
        {/* Title */}
        <Shimmer className="h-4 w-3/4" />
        {/* Location */}
        <Shimmer className="h-3 w-1/2" />
        <div className="h-px bg-gray-100" />
        {/* Specs row */}
        <div className="flex gap-3">
          <Shimmer className="h-3 w-12" />
          <Shimmer className="h-3 w-12" />
          <Shimmer className="h-3 w-16" />
        </div>
        {/* Agent row */}
        <div className="flex items-center gap-2 pt-1">
          <Shimmer circle className="h-7 w-7" />
          <Shimmer className="h-3 w-20" />
          <Shimmer className="ml-auto h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Renders `count` PropertyCardSkeletons in a responsive grid */
export function PropertyGridSkeleton({ count = 8, listView }: { count?: number; listView?: boolean }) {
  return (
    <div
      className={
        listView
          ? 'space-y-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} listView={listView} />
      ))}
    </div>
  );
}

/** Horizontal-scroll carousel skeleton (home page, mobile) */
export function PropertyCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[72vw] sm:w-72 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <Shimmer className="aspect-[4/3] w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
