'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home, User, LogOut, Settings, Heart, MapPin, Building2, TrendingUp, Search, X, Plus, Menu, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { openAuthModal, setSelectedCity, loadCityFromLS, saveCityToLS } from '@/lib/store/slices/uiSlice';
import { locationsApi } from '@/lib/api';
import { resolveImageSrc } from '@/components/common/OptimizedImage';
import { detectLocation } from '@/lib/geolocation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MegaSection {
  heading: string;
  icon: React.ReactNode;
  href: string;
  links: { label: string; href: string }[];
}

// ─── Mega menu content ────────────────────────────────────────────────────────

const MEGA_SECTIONS: MegaSection[] = [
  {
    heading: 'Buy',
    icon: <Home className="w-4 h-4" />,
    href: '/buy',
    links: [
      { label: 'Apartments / Flats', href: '/buy?type=apartment' },
      { label: 'Independent Houses', href: '/buy?type=house' },
      { label: 'Villas', href: '/buy?type=villa' },
      { label: 'Builder Floors', href: '/buy?type=builder_floor' },
      { label: 'Plots / Land', href: '/buy?type=plot' },
      { label: 'Farmhouse', href: '/buy?type=farm_house' },
    ],
  },
  {
    heading: 'Rent',
    icon: <Building2 className="w-4 h-4" />,
    href: '/rent',
    links: [
      { label: 'Apartments / Flats', href: '/rent?type=apartment' },
      { label: 'Independent Houses', href: '/rent?type=house' },
      { label: 'Villas', href: '/rent?type=villa' },
      { label: 'PG / Co-Living', href: '/pg' },
      { label: 'Studio Apartments', href: '/rent?type=studio' },
      { label: 'Furnished Homes', href: '/rent?furnishingStatus=fully_furnished' },
    ],
  },
  {
    heading: 'Commercial',
    icon: <TrendingUp className="w-4 h-4" />,
    href: '/commercial',
    links: [
      { label: 'Office Space — Buy', href: '/commercial?type=commercial_office&category=buy' },
      { label: 'Office Space — Rent', href: '/commercial?type=commercial_office&category=rent' },
      { label: 'Shop / Showroom', href: '/commercial?type=commercial_shop' },
      { label: 'Warehouse', href: '/commercial?type=commercial_warehouse' },
      { label: 'Industrial / Factory', href: '/commercial?type=factory' },
      { label: 'Co-working Space', href: '/commercial?type=co_working' },
    ],
  },
  {
    heading: 'New Projects',
    icon: <Search className="w-4 h-4" />,
    href: '/new-projects',
    links: [
      { label: 'New Launches', href: '/new-projects' },
      { label: 'Under Construction', href: '/new-projects?status=under_construction' },
      { label: 'Ready to Move', href: '/new-projects?status=ready_to_move' },
      { label: 'Township Projects', href: '/new-projects?type=township' },
      { label: 'Luxury Projects', href: '/new-projects?type=luxury' },
      { label: 'Affordable Projects', href: '/new-projects?type=affordable' },
    ],
  },
];

// ─── City Selector ────────────────────────────────────────────────────────────

const POPULAR_CITY_LIMIT = 5;

function CitySelector({ compact = false }: { compact?: boolean }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);
  const selectedCityId = useAppSelector((s) => s.ui.selectedCityId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dbCities, setDbCities] = useState<{ id: string; name: string }[]>([]);
  const [detecting, setDetecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load cities with active listings, sorted by most active
  useEffect(() => {
    locationsApi.getTopCities().then(r => {
      const raw = r.data;
      const arr: any[] = Array.isArray(raw) ? raw : raw?.cities ?? [];
      setDbCities(arr.map((c: any) => ({ id: c.id, name: c.cityName })));
    }).catch(() => {});
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = loadCityFromLS();
    if (saved.city && !selectedCity) {
      dispatch(setSelectedCity({ city: saved.city, cityId: saved.cityId }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? dbCities.filter((c) => c.name?.toLowerCase().includes(query.toLowerCase()))
    : dbCities;

  const handleSelect = (cityObj: { id: string; name: string }) => {
    dispatch(setSelectedCity({ city: cityObj.name, cityId: cityObj.id }));
    saveCityToLS(cityObj.name, cityObj.id);
    setOpen(false);
    setQuery('');
    if (pathname !== '/') router.push('/');
  };

  const handleAllCities = () => {
    dispatch(setSelectedCity({ city: '', cityId: '' }));
    saveCityToLS('', '');
    setOpen(false);
    setQuery('');
    if (pathname !== '/') router.push('/');
  };

  const handleDetectClick = () => {
    setDetecting(true);
    setOpen(false);
    detectLocation()
      .then((loc) => {
        if (!loc.city) return;
        const normalize = (s: string) => (s || '').toLowerCase().trim();
        const det = normalize(loc.city);
        let match = dbCities.find(c => normalize(c.name) === det);
        if (!match) match = dbCities.find(c => {
          const n = normalize(c.name);
          return det.includes(n) || n.includes(det);
        });
        if (match) {
          dispatch(setSelectedCity({ city: match.name, cityId: match.id }));
          saveCityToLS(match.name, match.id);
        } else if (loc.city) {
          // city not in DB but detected — store name without id
          dispatch(setSelectedCity({ city: loc.city, cityId: '' }));
          saveCityToLS(loc.city, '');
        }
      })
      .catch(() => {})
      .finally(() => setDetecting(false));
  };

  // Top cities (most active) — first N from the sorted-by-active list
  const popularToShow = dbCities.slice(0, POPULAR_CITY_LIMIT);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1 rounded-lg transition-colors border',
          compact
            ? 'px-2 py-1.5 text-xs border-gray-200 bg-gray-50 hover:bg-gray-100'
            : 'px-3 py-1.5 text-sm border-gray-200 hover:bg-gray-100 text-gray-600'
        )}
        title="Select City"
      >
        <MapPin className={cn(
          'flex-shrink-0',
          detecting ? 'text-orange-500 animate-pulse' : 'text-primary-600',
          compact ? 'w-3 h-3' : 'w-3.5 h-3.5'
        )} />
        <span className={cn('font-medium truncate', compact ? 'max-w-[70px]' : 'max-w-[110px]')}>
          {detecting ? '…' : selectedCity || (compact ? 'City' : 'All Cities')}
        </span>
        <ChevronDown className={cn(
          'text-gray-400 transition-transform flex-shrink-0',
          open && 'rotate-180',
          compact ? 'w-2.5 h-2.5' : 'w-3 h-3'
        )} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-[200] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              autoFocus
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {/* Auto-detect */}
            <button
              onClick={handleDetectClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 transition-colors text-left border-b border-gray-100"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {detecting ? 'Detecting…' : 'Auto-detect my city'}
            </button>

            {/* All Cities */}
            <button
              onClick={handleAllCities}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left border-b border-gray-100',
                !selectedCity && 'bg-primary-50 text-primary-700 font-semibold'
              )}
            >
              🏙️ All Cities
            </button>

            {/* Popular cities (shown when no search query) */}
            {!query && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popular Cities</span>
                </div>
                {popularToShow.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left',
                      (selectedCityId === c.id && c.id) || selectedCity === c.name
                        ? 'bg-primary-50 text-primary-700 font-semibold' : ''
                    )}
                  >
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    {c.name}
                  </button>
                ))}
                {dbCities.length > POPULAR_CITY_LIMIT && (
                  <div className="px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Cities</span>
                  </div>
                )}
              </>
            )}

            {/* Filtered results */}
            {filtered
              .filter(c => c.name && (query || !popularToShow.find(p => p.name.toLowerCase() === c.name.toLowerCase())))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left',
                    (selectedCityId === c.id || selectedCity === c.name) && 'bg-primary-50 text-primary-700 font-semibold'
                  )}
                >
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  {c.name}
                </button>
              ))}

            {filtered.length === 0 && query && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No cities found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SEO URL builder ──────────────────────────────────────────────────────────

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Converts a short internal href + optional city slug into a clean SEO URL.
 * Without a city the original path/query is kept as-is.
 */
function buildUrl(href: string, citySlug: string): string {
  if (!citySlug) return href;

  const [path, rawQs] = href.split('?');
  const p    = new URLSearchParams(rawQs || '');
  const type = p.get('type') || '';
  const cat  = p.get('category') || '';
  const fs   = p.get('furnishingStatus') || '';

  // Extra params: everything except type & category (e.g. bedrooms, maxPrice…)
  const ex = new URLSearchParams(rawQs || '');
  ex.delete('type');
  ex.delete('category');
  const xs = ex.toString();          // e.g. "bedrooms=3"
  const xq = xs ? `?${xs}` : '';    // e.g. "?bedrooms=3"
  const xsuf = (base: string) => xs ? `${base}&${xs}` : base; // join with existing qs

  // ── Buy ────────────────────────────────────────────────────────────────────
  if (path === '/buy') {
    if (type === 'apartment') return `/flats-for-sale-in-${citySlug}${xq}`;
    if (type === 'villa')     return `/villas-for-sale-in-${citySlug}${xq}`;
    if (type === 'plot')      return `/plots-for-sale-in-${citySlug}${xq}`;
    if (type)                 return xsuf(`/property-for-sale-in-${citySlug}?type=${type}`);
    return `/property-for-sale-in-${citySlug}${xq}`;
  }

  // ── Rent ───────────────────────────────────────────────────────────────────
  if (path === '/rent') {
    if (type === 'apartment') return `/flats-for-rent-in-${citySlug}${xq}`;
    if (type === 'studio')    return `/flats-for-rent-in-${citySlug}?type=studio`;
    if (fs)                   return `/property-for-rent-in-${citySlug}?furnishingStatus=${fs}`;
    if (type)                 return xsuf(`/property-for-rent-in-${citySlug}?type=${type}`);
    return `/property-for-rent-in-${citySlug}${xq}`;
  }

  // ── PG ─────────────────────────────────────────────────────────────────────
  if (path === '/pg') return `/pg-in-${citySlug}`;

  // ── Commercial ─────────────────────────────────────────────────────────────
  if (path === '/commercial') {
    if (type === 'commercial_office' && cat === 'rent') return `/office-space-for-rent-in-${citySlug}`;
    if (type) return `/commercial-property-in-${citySlug}?type=${type}${cat ? `&category=${cat}` : ''}`;
    return `/commercial-property-in-${citySlug}`;
  }

  // ── New Projects ───────────────────────────────────────────────────────────
  if (path === '/new-projects') {
    return `/new-projects-in-${citySlug}${rawQs ? `?${rawQs}` : ''}`;
  }

  return href;
}

// ─── Properties Mega Dropdown ─────────────────────────────────────────────────

function PropertiesMega({ onClose }: { onClose: () => void }) {
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);
  const citySlug     = selectedCity ? toSlug(selectedCity) : '';

  const u = (href: string) => buildUrl(href, citySlug);

  const viewAllHref  = citySlug ? `/property-in-${citySlug}` : '/properties';
  const headerLabel  = selectedCity ? `Browse Properties in ${selectedCity}` : 'Browse Properties';

  const dynamicSections = MEGA_SECTIONS.map(sec => ({
    ...sec,
    href:  u(sec.href),
    links: sec.links.map(l => ({ ...l, href: u(l.href) })),
  }));

  const quickLinks = [
    { label: '🏠 Ready to Move', href: u('/buy?possessionStatus=ready_to_move') },
    { label: '💰 Under 50L',     href: u('/buy?maxPrice=5000000') },
    { label: '🛏 3BHK Flats',    href: u('/buy?type=apartment&bedrooms=3') },
    { label: '🏢 PG / Hostel',   href: u('/pg') },
  ];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden w-[720px] max-w-[calc(100vw-2rem)]">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">{headerLabel}</span>
        <Link
          href={viewAllHref}
          onClick={onClose}
          className="text-primary-100 hover:text-white text-xs underline underline-offset-2 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-4 divide-x divide-gray-100 p-2">
        {dynamicSections.map((section) => (
          <div key={section.heading} className="px-4 py-4">
            <Link
              href={section.href}
              onClick={onClose}
              className="flex items-center gap-2 text-primary-600 font-bold text-sm mb-3 hover:text-primary-700 transition-colors group"
            >
              <span className="w-6 h-6 bg-primary-100 rounded-md flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                {section.icon}
              </span>
              {section.heading}
            </Link>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="text-xs text-gray-600 hover:text-primary-600 hover:translate-x-0.5 transition-all inline-block leading-relaxed"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center gap-6">
        <span className="text-xs text-gray-400 font-medium">Quick:</span>
        {quickLinks.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            onClick={onClose}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline transition-colors whitespace-nowrap"
          >
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg hover:bg-gray-100 transition-colors',
          compact ? 'p-1' : 'px-2 py-1.5'
        )}
      >
        <div className={cn(
          'rounded-full bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden',
          compact ? 'w-8 h-8 text-xs' : 'w-8 h-8 text-xs'
        )}>
          {(user?.avatar || user?.pendingAvatar)
            ? <img src={resolveImageSrc(user.avatar || user.pendingAvatar)} alt={user?.name || ''} className="w-full h-full object-cover" />
            : initials}
        </div>
        {!compact && (
          <div className="hidden lg:block text-left">
            <div className="text-sm font-medium text-gray-800 leading-tight max-w-[7rem] truncate">
              {user?.name}
            </div>
            <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
          </div>
        )}
        {!compact && <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />}
      </button>

      {open && (
        <div className={cn(
          'absolute bg-white shadow-xl rounded-xl border border-gray-100 py-1.5 z-[200]',
          compact ? 'right-0 top-full mt-2 w-52' : 'right-0 top-full mt-2 w-52'
        )}>
          <div className="px-4 py-2.5 border-b border-gray-100">
            <div className="font-semibold text-gray-900 text-sm truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.phone || user?.email}</div>
          </div>

          {user?.role === 'admin' && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-orange-400" /> Admin Panel
            </Link>
          )}
          {user?.role === 'agent' && (
            <Link href="/agent" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-violet-400" /> Agent Dashboard
            </Link>
          )}
          {(user?.role === 'owner' || user?.role === 'seller') && (
            <Link href="/owner" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Home className="w-4 h-4 text-emerald-400" /> Owner Dashboard
            </Link>
          )}
          {user?.role === 'buyer' && (
            <Link href="/buyer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Home className="w-4 h-4 text-cyan-400" /> Buyer Dashboard
            </Link>
          )}

          <Link
            href={
              user?.role === 'buyer' ? '/buyer/saved' :
              (user?.role === 'owner' || user?.role === 'seller') ? '/owner/properties' :
              '/agent/listings'
            }
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-4 h-4 text-gray-400" />
            {user?.role === 'buyer' ? 'Saved Properties' : 'My Listings'}
          </Link>

          <Link
            href={
              user?.role === 'buyer' ? '/buyer/profile' :
              (user?.role === 'owner' || user?.role === 'seller') ? '/owner/profile' :
              '/agent/profile'
            }
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-400" /> Profile
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mobile Drawer (logged-in slide menu) ─────────────────────────────────────

function MobileDrawer({ open, onClose, navLinks }: { open: boolean; onClose: () => void; navLinks: { key: string; label: string; href: string }[] }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);
  const selectedCityId = useAppSelector((s) => s.ui.selectedCityId);
  const [query, setQuery] = useState('');
  const [dbCities, setDbCities] = useState<{ id: string; name: string }[]>([]);
  const [detecting, setDetecting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    locationsApi.getTopCities().then(r => {
      const raw = r.data;
      const arr: any[] = Array.isArray(raw) ? raw : raw?.cities ?? [];
      setDbCities(arr.map((c: any) => ({ id: c.id, name: c.cityName })));
    }).catch(() => {});
  }, []);

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const filtered = query ? dbCities.filter(c => c.name?.toLowerCase().includes(query.toLowerCase())) : dbCities;

  const handleSelect = (cityObj: { id: string; name: string }) => {
    dispatch(setSelectedCity({ city: cityObj.name, cityId: cityObj.id }));
    saveCityToLS(cityObj.name, cityObj.id);
    setQuery('');
    onClose();
    if (pathname !== '/') router.push('/');
  };

  const handleAllCities = () => {
    dispatch(setSelectedCity({ city: '', cityId: '' }));
    saveCityToLS('', '');
    setQuery('');
    onClose();
    if (pathname !== '/') router.push('/');
  };

  const handleDetectClick = () => {
    setDetecting(true);
    detectLocation()
      .then((loc) => {
        if (!loc.city) return;
        const normalize = (s: string) => (s || '').toLowerCase().trim();
        let match = dbCities.find(c => normalize(c.name) === normalize(loc.city));
        if (!match) match = dbCities.find(c => normalize(c.name).includes(normalize(loc.city)) || normalize(loc.city).includes(normalize(c.name)));
        if (match) {
          dispatch(setSelectedCity({ city: match.name, cityId: match.id }));
          saveCityToLS(match.name, match.id);
        } else if (loc.city) {
          dispatch(setSelectedCity({ city: loc.city, cityId: '' }));
          saveCityToLS(loc.city, '');
        }
      })
      .catch(() => {})
      .finally(() => setDetecting(false));
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const dashHref =
    user?.role === 'admin'  ? '/admin'  :
    user?.role === 'agent'  ? '/agent'  :
    user?.role === 'owner' || user?.role === 'seller' ? '/owner' :
    '/buyer';

  const dashLabel =
    user?.role === 'admin'  ? 'Admin Panel'      :
    user?.role === 'agent'  ? 'Agent Dashboard'  :
    user?.role === 'owner' || user?.role === 'seller' ? 'Owner Dashboard' :
    'Buyer Dashboard';

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      {/* Drawer — full-height flex column; logout always pinned at bottom */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 right-0 z-[201] w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {(user?.avatar || user?.pendingAvatar)
                ? <img src={resolveImageSrc(user.avatar || user.pendingAvatar)} alt={user?.name || ''} className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.phone || user?.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable middle: city selector + nav links */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {/* City selector */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className={cn('w-4 h-4 flex-shrink-0', detecting ? 'text-orange-500 animate-pulse' : 'text-primary-600')} />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">City</span>
              <span className="ml-auto text-xs font-medium text-primary-600">{selectedCity || 'All Cities'}</span>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-400 bg-white"
            />
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-white">
              <button
                onClick={handleDetectClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 transition-colors text-left border-b border-gray-100"
              >
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {detecting ? 'Detecting…' : 'Auto-detect my city'}
              </button>
              <button
                onClick={handleAllCities}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left border-b border-gray-100', !selectedCity && 'bg-primary-50 text-primary-700 font-semibold')}
              >
                🏙️ All Cities
              </button>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left', (selectedCityId === c.id || selectedCity === c.name) && 'bg-primary-50 text-primary-700 font-semibold')}
                >
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="py-2">
            <Link href={dashHref} onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
              {dashLabel}
            </Link>
            <Link
              href={
                user?.role === 'buyer' ? '/buyer/saved' :
                (user?.role === 'owner' || user?.role === 'seller') ? '/owner/properties' :
                '/agent/listings'
              }
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Heart className="w-4 h-4 text-gray-400" />
              {user?.role === 'buyer' ? 'Saved Properties' : 'My Listings'}
            </Link>
            <Link
              href={
                user?.role === 'buyer' ? '/buyer/profile' :
                (user?.role === 'owner' || user?.role === 'seller') ? '/owner/profile' :
                user?.role === 'admin' ? '/admin' :
                '/agent/profile'
              }
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 text-gray-400" />
              Profile
            </Link>
            <Link
              href={selectedCity ? `/property-in-${toSlug(selectedCity)}` : '/properties'}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4 text-gray-400" />
              {selectedCity ? `Properties in ${selectedCity}` : 'Properties'}
            </Link>
            {navLinks.map(link => {
              const dynHref = selectedCity ? buildUrl(link.href, toSlug(selectedCity)) : link.href;
              return (
                <Link key={link.key} href={dynHref} onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Search className="w-4 h-4 text-gray-400" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sign out — always pinned at bottom */}
        <div className="border-t border-gray-100 p-4 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────

const NAV_LINKS: { key: string; label: string; href: string; defaultOn: boolean }[] = [
  { key: 'nav_agents_enabled',      label: 'Agents',       href: '/agents',       defaultOn: true  },
  { key: 'nav_services_enabled',    label: 'Services',     href: '/services',     defaultOn: true  },
  { key: 'nav_new_projects_enabled',label: 'New Projects', href: '/new-projects', defaultOn: true  },
  { key: 'nav_articles_enabled',    label: 'Articles',     href: '/articles',     defaultOn: false },
];

const NAV_CONFIG_KEY = 't4bs_nav_cfg';
const NAV_CONFIG_TTL = 5 * 60 * 1000; // 5 minutes

export default function Header() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);
  const citySlug     = selectedCity ? toSlug(selectedCity) : '';
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navCfg, setNavCfg] = useState<Record<string, string> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  // Load cached config immediately, then refresh in background
  useEffect(() => {
    try {
      const cached = localStorage.getItem(NAV_CONFIG_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < NAV_CONFIG_TTL) {
          setNavCfg(data);
          return; // skip fetch if fresh
        }
      }
    } catch { /* ignore */ }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/seo/config`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setNavCfg(data);
          localStorage.setItem(NAV_CONFIG_KEY, JSON.stringify({ ts: Date.now(), data }));
        }
      })
      .catch(() => {});
  }, []);

  function navEnabled(key: string, defaultOn: boolean): boolean {
    if (!navCfg) return defaultOn; // fallback while loading
    if (!(key in navCfg)) return defaultOn;
    return navCfg[key] === 'true';
  }

  const visibleNavLinks = NAV_LINKS.filter(l => navEnabled(l.key, l.defaultOn));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Hide on dashboard panels — those layouts have their own top bar
  // NOTE: use '/agent/' with trailing slash so '/agents/*' (public) is NOT hidden
  const isPanel =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/agent/') || pathname === '/agent' ||
    pathname.startsWith('/owner') ||
    pathname.startsWith('/buyer');
  if (isPanel) return null;

  return (
    <header
      ref={headerRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 bg-white',
        scrolled ? 'shadow-md' : 'border-b border-gray-100'
      )}
    >
      {/* Admin mode banner */}
      {user?.role === 'admin' && (
        <div className="bg-red-600 text-white text-xs flex items-center justify-center gap-3 px-4 py-1.5">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold">Admin Mode</span>
          <span className="hidden sm:inline text-red-200">— You are browsing as administrator</span>
          <Link href="/admin" className="ml-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-2.5 py-0.5 rounded-full text-[11px] transition-colors">
            Admin Panel →
          </Link>
        </div>
      )}
      {/* ─── Mobile Header ────────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 leading-tight">
            Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
          </span>
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!loading && (
            user ? (
              <>
                {/* Post FREE always visible for logged-in users */}
                <Link
                  href="/post-property"
                  className="flex items-center gap-1.5 bg-primary-600 active:bg-primary-700 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Post
                  <span className="badge-free text-[10px] px-1.5 py-0.5 rounded-full leading-none">&nbsp;FREE</span>
                </Link>
                {/* Hamburger → drawer (has location + user menu inside) */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </button>
              </>
            ) : (
              <>
                <CitySelector compact />
                <button
                  onClick={() => dispatch(openAuthModal({ mode: 'login', reason: 'post-property', redirectTo: '/post-property' }))}
                  className="flex items-center gap-1.5 bg-primary-600 active:bg-primary-700 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Post
                  <span className="badge-free text-[10px] px-1.5 py-0.5 rounded-full leading-none">&nbsp;FREE</span>
                </button>
              </>
            )
          )}
        </div>
      </div>

      {/* Mobile slide-out drawer (logged-in only) */}
      {user && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navLinks={visibleNavLinks} />}

      {/* ─── Desktop Header ───────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="container-max">
          <div className="flex items-center justify-between h-16 gap-2">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="flex items-center gap-0.5 flex-1 justify-center">
              <div ref={megaRef} className="relative">
                <button
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                  onClick={() => setMegaOpen((v) => !v)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    megaOpen ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  )}
                >
                  {selectedCity ? `Properties in ${selectedCity}` : 'Properties'}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', megaOpen && 'rotate-180')} />
                </button>

                {megaOpen && (
                  <div
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                  >
                    <PropertiesMega onClose={() => setMegaOpen(false)} />
                  </div>
                )}
              </div>

              {visibleNavLinks.map((link) => (
                <Link
                  key={link.key}
                  href={citySlug ? buildUrl(link.href, citySlug) : link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <CitySelector />

              {!loading && (
                user ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => dispatch(openAuthModal('login'))}
                    className="text-sm font-medium text-gray-700 hover:text-primary-600 px-3 py-2 transition-colors"
                  >
                    Login
                  </button>
                )
              )}

              <Link
                href="/post-property"
                className="btn-primary text-sm py-2 px-3 lg:px-4 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Property</span>
                <span className="badge-free text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {/* <s>₹99</s> */}&nbsp;FREE</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
