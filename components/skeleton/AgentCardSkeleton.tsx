/**
 * AgentCardSkeleton — mirrors the agent card layout in AgentsListingClient.
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface Props {
  className?: string;
  listView?: boolean;
}

export default function AgentCardSkeleton({ className, listView }: Props) {
  if (listView) {
    return (
      <div
        aria-label="Loading agent"
        className={cn('bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start', className)}
      >
        <Shimmer circle className="h-14 w-14 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-1/3" />
          <Shimmer className="h-3 w-1/4" />
          <div className="flex gap-3 pt-1">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-20" />
          </div>
        </div>
        <Shimmer className="h-8 w-20 rounded-lg flex-shrink-0" />
      </div>
    );
  }

  return (
    <div
      aria-label="Loading agent"
      className={cn('bg-white rounded-xl border border-gray-100 p-5 space-y-4', className)}
    >
      {/* Avatar + badge */}
      <div className="flex items-start gap-3">
        <Shimmer circle className="h-14 w-14 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-2/3" />
          <Shimmer className="h-3 w-1/3" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      </div>
      {/* Stats row */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-1">
          <Shimmer className="h-5 w-8 mx-auto" />
          <Shimmer className="h-3 w-14 mx-auto" />
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 space-y-1">
          <Shimmer className="h-5 w-8 mx-auto" />
          <Shimmer className="h-3 w-14 mx-auto" />
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 space-y-1">
          <Shimmer className="h-5 w-8 mx-auto" />
          <Shimmer className="h-3 w-14 mx-auto" />
        </div>
      </div>
      {/* Location */}
      <Shimmer className="h-3 w-2/3" />
      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <Shimmer className="flex-1 h-9 rounded-lg" />
        <Shimmer className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  );
}

/** Grid of AgentCardSkeletons */
export function AgentGridSkeleton({ count = 12, listView }: { count?: number; listView?: boolean }) {
  return (
    <div className={listView ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'}>
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} listView={listView} />
      ))}
    </div>
  );
}
