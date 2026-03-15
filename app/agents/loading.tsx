export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-10 md:py-14">
        <div className="container-max space-y-4 max-w-3xl">
          <div className="h-6 w-52 bg-white/10 rounded-full animate-pulse" />
          <div className="h-11 w-3/4 bg-white/15 rounded-lg animate-pulse" />
          <div className="h-11 w-1/2 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-5 mt-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 w-28 bg-white/10 rounded-xl animate-pulse" />)}
          </div>
          <div className="flex gap-3 mt-4">
            <div className="flex-1 h-14 max-w-xl bg-white/10 rounded-2xl animate-pulse" />
            <div className="h-14 w-28 bg-amber-400/30 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* City tabs */}
      <div className="bg-white border-b border-gray-200 h-[48px]" />

      <div className="container-max py-8 space-y-6">
        {/* Carousel strip */}
        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex-shrink-0 w-[190px] h-[180px] bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 h-14 animate-pulse" />

        {/* List cards */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 animate-pulse">
              <div className="flex gap-5">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 bg-gray-200 rounded w-40" />
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="h-3.5 bg-gray-200 rounded w-52" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded-lg w-24" />
                    <div className="h-8 bg-gray-200 rounded-lg w-24" />
                    <div className="h-8 bg-gray-200 rounded-lg w-24" />
                    <div className="h-8 bg-gray-200 rounded-lg w-24" />
                  </div>
                  <div className="h-3.5 bg-gray-200 rounded w-full max-w-md" />
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                </div>
                <div className="hidden sm:flex flex-col gap-2.5 w-28">
                  <div className="h-10 bg-gray-200 rounded-xl" />
                  <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
