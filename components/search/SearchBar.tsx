'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { locationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  initialCity?: string;
  initialSearch?: string;
  className?: string;
  size?: 'sm' | 'lg';
}

const CATEGORY_TABS = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'pg', label: 'PG' },
  { value: 'commercial', label: 'Commercial' },
];

export default function SearchBar({
  initialCity = '',
  initialSearch = '',
  className,
  size = 'lg',
}: SearchBarProps) {
  const router = useRouter();
  const [category, setCategory] = useState('buy');
  const [query, setQuery] = useState(initialCity || initialSearch);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (val: string) => {
    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await locationsApi.search(val);
      setSuggestions(data.slice(0, 8));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSearch = (overrideCity?: string, overrideLocality?: string) => {
    const params = new URLSearchParams({ category });
    const city = overrideCity || query;
    if (city) params.set('city', city);
    if (overrideLocality) params.set('locality', overrideLocality);
    router.push(`/properties?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (item: any) => {
    const display = item.locality
      ? `${item.locality}, ${item.city}`
      : item.city;
    setQuery(display);
    handleSearch(item.city, item.locality);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('w-full', className)}>
      {/* Category Tabs */}
      <div className="flex gap-1 mb-3">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategory(tab.value)}
            className={cn(
              'px-4 py-2 rounded-t-lg font-semibold text-sm transition-all duration-200',
              category === tab.value
                ? 'bg-white text-primary-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div
        className={cn(
          'bg-white rounded-xl shadow-xl flex items-center overflow-hidden',
          size === 'lg' ? 'h-14 md:h-16' : 'h-12',
        )}
      >
        <div className="relative flex-1" ref={inputRef}>
          <div className="flex items-center px-4 h-full">
            <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              placeholder="Search city, locality, project..."
              className={cn(
                'flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400',
                size === 'lg' ? 'text-base' : 'text-sm',
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-2" />}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-xl rounded-xl mt-1 z-50 overflow-hidden">
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 text-left transition-colors"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.locality ? `${item.locality}, ${item.city}` : item.city}
                    </p>
                    <p className="text-xs text-gray-400">{item.state}</p>
                  </div>
                  {item.propertyCount > 0 && (
                    <span className="ml-auto text-xs text-gray-400">
                      {item.propertyCount}+ properties
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200 mx-1 flex-shrink-0" />

        <button
          onClick={() => handleSearch()}
          className={cn(
            'bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center gap-2 transition-colors flex-shrink-0',
            size === 'lg' ? 'px-6 md:px-8 h-full' : 'px-5 h-full',
          )}
          aria-label="Search properties"
        >
          <Search className="w-5 h-5" />
          <span className={cn(size === 'sm' ? 'hidden' : 'hidden sm:inline')}>Search</span>
        </button>
      </div>
    </div>
  );
}
