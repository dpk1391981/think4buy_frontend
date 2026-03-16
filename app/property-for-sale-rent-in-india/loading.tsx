export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-20 pb-12">
        <div className="container-max text-center px-4 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-white/20 rounded-full mx-auto" />
          <div className="h-10 w-80 bg-white/20 rounded-xl mx-auto" />
          <div className="h-4 w-64 bg-white/10 rounded mx-auto" />
          <div className="flex justify-center gap-8 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1 text-center">
                <div className="h-7 w-12 bg-white/20 rounded mx-auto" />
                <div className="h-3 w-16 bg-white/10 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="py-10 sm:py-14">
        <div className="container-max px-4">
          <div className="h-6 w-48 bg-gray-200 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-6 w-14 bg-gray-200 rounded" />
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-100 rounded w-full" />
                    <div className="h-2 bg-gray-100 rounded w-4/5" />
                    <div className="h-2 bg-gray-100 rounded w-3/5" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
