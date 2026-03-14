/**
 * App Router streaming loading state for /properties/[slug].
 * Shown while the server fetches property data.
 */
import { Shimmer } from '@/components/skeleton';

export default function PropertyDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Image gallery skeleton — 4:3 hero */}
            <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/9]">
              <Shimmer className="absolute inset-0 w-full h-full rounded-none" />
              {/* Thumbnail strip */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Shimmer key={i} className="w-14 h-10 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Title block */}
            <div className="bg-white rounded-xl p-5 space-y-3">
              <Shimmer className="h-7 w-3/4" />
              <Shimmer className="h-4 w-1/2" />
              <div className="flex gap-4 pt-1">
                <Shimmer className="h-5 w-24 rounded-full" />
                <Shimmer className="h-5 w-24 rounded-full" />
              </div>
            </div>

            {/* Specs grid */}
            <div className="bg-white rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 text-center">
                  <Shimmer className="h-6 w-12 mx-auto" />
                  <Shimmer className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-5 space-y-2">
              <Shimmer className="h-5 w-32 mb-3" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} className={`h-4 ${i === 3 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-5">
              <Shimmer className="h-5 w-32 mb-4" />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Shimmer circle className="h-10 w-10" />
                    <Shimmer className="h-3 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Price + contact card */}
            <div className="bg-white rounded-xl p-5 space-y-4 border border-gray-100">
              <Shimmer className="h-8 w-2/3" />
              <Shimmer className="h-3 w-1/2" />
              <div className="h-px bg-gray-100" />
              <div className="flex items-center gap-3">
                <Shimmer circle className="h-12 w-12" />
                <div className="space-y-2">
                  <Shimmer className="h-4 w-28" />
                  <Shimmer className="h-3 w-20" />
                </div>
              </div>
              <Shimmer className="h-11 w-full rounded-xl" />
              <Shimmer className="h-11 w-full rounded-xl" />
            </div>

            {/* Inquiry form skeleton */}
            <div className="bg-white rounded-xl p-5 space-y-3 border border-gray-100">
              <Shimmer className="h-5 w-36" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} className="h-10 w-full rounded-lg" />
              ))}
              <Shimmer className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
