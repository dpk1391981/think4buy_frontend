/**
 * App Router streaming loading state for /agents.
 */
import { AgentGridSkeleton } from '@/components/skeleton';

export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero banner placeholder — exact height matches AgentsListingClient */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="skeleton-shimmer-dark h-4 w-48 rounded" />
          <div className="skeleton-shimmer-dark h-8 w-72 rounded" />
          <div className="skeleton-shimmer-dark h-4 w-96 rounded" />
          <div className="skeleton-shimmer-dark h-12 w-full max-w-xl rounded-xl mt-6" />
        </div>
      </div>

      {/* City chips bar */}
      <div className="bg-white border-b border-gray-100 h-[52px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton-shimmer h-6 w-36 rounded mb-6" />
        <AgentGridSkeleton count={12} />
      </div>
    </div>
  );
}
