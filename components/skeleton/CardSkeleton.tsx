/**
 * CardSkeleton — generic card skeleton for any card-style component.
 * Configurable rows make it adaptable to any data shape.
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface CardSkeletonProps {
  /** Height of the image/hero area. 0 = no image area. */
  imageHeight?: number;
  /** Number of text rows to render */
  rows?: number;
  className?: string;
  /** Show a round avatar before rows */
  avatar?: boolean;
}

export default function CardSkeleton({
  imageHeight = 180,
  rows = 3,
  className,
  avatar,
}: CardSkeletonProps) {
  return (
    <div
      aria-label="Loading"
      className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden', className)}
    >
      {imageHeight > 0 && (
        <div className="w-full skeleton-shimmer rounded-none" style={{ height: imageHeight }} />
      )}
      <div className="p-4 space-y-3">
        {avatar && (
          <div className="flex items-center gap-3 mb-2">
            <Shimmer circle className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-1/2" />
              <Shimmer className="h-3 w-1/3" />
            </div>
          </div>
        )}
        {Array.from({ length: rows }).map((_, i) => (
          <Shimmer
            key={i}
            className={cn(
              'h-4',
              i === 0 && 'w-3/4',
              i === 1 && 'w-1/2',
              i >= 2 && 'w-2/3',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Renders a responsive grid of CardSkeletons */
export function CardGridSkeleton({
  count = 8,
  cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  ...props
}: CardSkeletonProps & { count?: number; cols?: string }) {
  return (
    <div className={cn('grid gap-5', cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} {...props} />
      ))}
    </div>
  );
}
