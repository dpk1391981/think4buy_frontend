'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * On mount, reads the saved city from localStorage.
 * If a city is found, shows a full-page branded splash and redirects to
 * /properties-in-{slug}. The splash stays visible until the new page unmounts
 * this component, giving clear visual feedback that something is happening.
 */
export default function CityRedirect() {
  const router = useRouter();
  const [cityName, setCityName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('t4bs_city');
      if (!raw) return;
      const { city } = JSON.parse(raw) as { city: string; cityId: string };
      if (!city) return;
      setCityName(city);
      const slug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      router.replace(`/properties-in-${slug}`);
    } catch {
      // malformed JSON or no localStorage — ignore
    }
  }, [router]);

  if (!cityName) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 flex flex-col items-center justify-center">
      {/* background blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-300" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">Think4BuySale</span>
        </div>

        {/* City label */}
        <div>
          <p className="text-blue-200/60 text-sm mb-1 font-medium">Loading properties in</p>
          <h2 className="text-white text-3xl font-extrabold tracking-tight">
            {cityName}
          </h2>
        </div>

        {/* Spinner row */}
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finding the best listings…</span>
        </div>

        {/* Animated progress bar */}
        <div className="w-52 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-blue-400 rounded-full"
            style={{ animation: 'city-progress 1.6s ease-in-out infinite' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes city-progress {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
