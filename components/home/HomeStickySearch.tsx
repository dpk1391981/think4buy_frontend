'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, X, LocateFixed, Navigation } from 'lucide-react';
import { locationsApi } from '@/lib/api';
import { detectLocation } from '@/lib/geolocation';
import { parseSearchQuery } from '@/lib/parseSearchQuery';
import { cn } from '@/lib/utils';

export default function HomeStickySearch() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [q, setQ] = useState('');
  const [suggs, setSuggs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const deb = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSugg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchLocs = async (v: string) => {
    if (!v.trim() || v.length < 2) { setSuggs([]); return; }
    setBusy(true);
    try {
      const { data } = await locationsApi.search(v);
      setSuggs(data.slice(0, 6));
    } catch { setSuggs([]); } finally { setBusy(false); }
  };

  const doSearch = useCallback((city?: string, locality?: string) => {
    if (!city && !q.trim()) return;
    const p = new URLSearchParams();

    if (city) {
      // Suggestion selected — city resolved directly, no category override
      p.set('city', city);
      if (locality) p.set('locality', locality);
      // Still parse the typed query for any extra filters the user may have typed
      if (q.trim()) {
        const parsed = parseSearchQuery(q.trim());
        if (parsed.category) p.set('category', parsed.category);
        if (parsed.bedrooms) p.set('bedrooms', parsed.bedrooms);
        if (parsed.type)     p.set('type', parsed.type);
        if (parsed.minPrice) p.set('minPrice', String(parsed.minPrice));
        if (parsed.maxPrice) p.set('maxPrice', String(parsed.maxPrice));
      }
    } else {
      // Free-text — parse to extract all filters
      const parsed = parseSearchQuery(q.trim());
      if (parsed.category) p.set('category', parsed.category);
      if (parsed.city)     p.set('city', parsed.city);
      if (locality)        p.set('locality', locality);
      if (parsed.bedrooms) p.set('bedrooms', parsed.bedrooms);
      if (parsed.type)     p.set('type', parsed.type);
      if (parsed.minPrice) p.set('minPrice', String(parsed.minPrice));
      if (parsed.maxPrice) p.set('maxPrice', String(parsed.maxPrice));
      if (parsed.keyword)  p.set('keyword', parsed.keyword);
      // Fallback: nothing structural parsed → treat whole string as keyword
      if (!parsed.city && !parsed.bedrooms && !parsed.type && !parsed.category) {
        p.set('keyword', q.trim());
      }
    }

    router.push(`/properties?${p}`);
    setShowSugg(false);
  }, [q, router]);

  const handleDetect = async () => {
    setDetecting(true);
    setDetectErr('');
    try {
      const loc = await detectLocation();
      const city = loc.city || loc.locality;
      if (city) {
        const locality = loc.locality && loc.locality !== city ? loc.locality : undefined;
        setQ(locality ? `${locality}, ${city}` : city);
        doSearch(city, locality);
      } else {
        setDetectErr('City not found');
        setTimeout(() => setDetectErr(''), 3000);
      }
    } catch (e: any) {
      setDetectErr(e?.code === 1 ? 'Access denied' : 'Unavailable');
      setTimeout(() => setDetectErr(''), 3000);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-40 transition-all duration-300 ease-out',
        'top-14 lg:top-16',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none',
      )}
    >
      {/* Bar */}
      <div className="bg-white border-b border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div ref={containerRef} className="relative flex items-center gap-2 sm:gap-3 max-w-3xl">

            {/* ── Search pill ── */}
            <div className="flex-1 flex items-center h-10 sm:h-11 bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus-within:bg-white focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100/60 transition-all duration-200 overflow-visible relative">

              {/* Left icon */}
              <div className="flex items-center pl-3.5 pr-2 flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary-500" />
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={q}
                placeholder="City, locality or project..."
                onChange={e => {
                  setQ(e.target.value);
                  setShowSugg(true);
                  clearTimeout(deb.current);
                  deb.current = setTimeout(() => fetchLocs(e.target.value), 260);
                }}
                onFocus={() => { if (q.length >= 2) setShowSugg(true); }}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                className="flex-1 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none bg-transparent min-w-0"
              />

              {/* Right side: loader/clear */}
              <div className="flex items-center pr-2 gap-1 flex-shrink-0">
                {busy && !detecting && (
                  <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                )}
                {q && !busy && (
                  <button
                    onClick={() => { setQ(''); setSuggs([]); inputRef.current?.focus(); }}
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    aria-label="Clear"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* ── GPS / Detect location button ── */}
            <button
              onClick={handleDetect}
              disabled={detecting}
              title={detectErr || 'Detect my location'}
              className={cn(
                'flex items-center justify-center h-10 sm:h-11 w-10 sm:w-auto sm:px-4 sm:gap-2 rounded-xl sm:rounded-2xl border-2 font-semibold text-sm flex-shrink-0 transition-all duration-200',
                detectErr
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : detecting
                  ? 'border-primary-200 bg-primary-50 text-primary-500 cursor-wait'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 active:scale-95',
              )}
            >
              {detecting ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <Navigation className={cn('w-4 h-4 flex-shrink-0', detectErr ? 'text-red-400' : '')} />
              )}
              <span className="hidden sm:inline whitespace-nowrap">
                {detecting ? 'Detecting…' : detectErr || 'Near Me'}
              </span>
            </button>

            {/* ── Search button ── */}
            <button
              onClick={() => doSearch()}
              className="flex items-center justify-center h-10 sm:h-11 w-10 sm:w-auto sm:px-5 sm:gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 active:scale-95 text-white font-bold text-sm rounded-xl sm:rounded-2xl flex-shrink-0 transition-all duration-200 shadow-md shadow-primary-600/30"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Suggestions */}
            {showSugg && suggs.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 sm:right-[-88px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Locations</span>
                </div>
                {suggs.map((s, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 text-left transition-colors"
                    onClick={() => {
                      setQ(s.locality ? `${s.locality}, ${s.city}` : s.city);
                      setShowSugg(false);
                      doSearch(s.city, s.locality);
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {s.locality ? `${s.locality}, ${s.city}` : s.city}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.state}</div>
                    </div>
                    {s.propertyCount > 0 && (
                      <span className="text-xs font-medium text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full">
                        {s.propertyCount}+
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
