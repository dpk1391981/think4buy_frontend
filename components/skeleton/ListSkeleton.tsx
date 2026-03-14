/**
 * ListSkeleton — skeleton for list/row style layouts (leads, deals, notifications etc.)
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface ListRowSkeletonProps {
  /** Show a leading avatar/icon circle */
  avatar?: boolean;
  /** Show a trailing action button placeholder */
  action?: boolean;
  className?: string;
}

export function ListRowSkeleton({ avatar = true, action = false, className }: ListRowSkeletonProps) {
  return (
    <div
      aria-label="Loading"
      className={cn('flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50 last:border-0', className)}
    >
      {avatar && <Shimmer circle className="h-10 w-10 flex-shrink-0" />}
      <div className="flex-1 space-y-2 min-w-0">
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-3 w-1/3" />
      </div>
      {action && <Shimmer className="h-7 w-16 rounded-lg flex-shrink-0" />}
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
  avatar?: boolean;
  action?: boolean;
  className?: string;
}

/** Renders `count` list rows wrapped in a card container */
export default function ListSkeleton({ count = 6, avatar = true, action = false, className }: ListSkeletonProps) {
  return (
    <div aria-busy="true" className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} avatar={avatar} action={action} />
      ))}
    </div>
  );
}
