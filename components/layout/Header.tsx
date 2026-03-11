'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, Home, User, LogOut, Settings, Heart, MapPin, Building2, TrendingUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { openAuthModal, setSelectedLocation, loadLocationFromLS, saveLocationToLS } from '@/lib/store/slices/uiSlice';
import { locationsApi } from '@/lib/api';
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

// ─── State Selector ───────────────────────────────────────────────────────────

function StateSelector() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dbStates, setDbStates] = useState<{ id: string; name: string }[]>([]);
  const [detecting, setDetecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load states from DB
  useEffect(() => {
    locationsApi.getStates().then(r => {
      const data = r.data;
      const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setDbStates(arr);
    }).catch(() => {});
  }, []);

  // Hydrate from localStorage; if nothing saved, auto-detect via geolocation
  useEffect(() => {
    const saved = loadLocationFromLS();
    if (saved.state) {
      if (!selectedState) {
        dispatch(setSelectedLocation({ state: saved.state, stateId: saved.stateId }));
      }
      return; // already have a location
    }
    // No saved location — try auto-detect silently
    setDetecting(true);
    detectLocation()
      .then((loc) => {
        if (!loc.state) return;
        // Wait until dbStates is loaded, or fetch now and match
        locationsApi.getStates().then(r => {
          const data = r.data;
          const arr: { id: string; name: string }[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
          const match = arr.find(
            s => s.name.toLowerCase() === loc.state.toLowerCase()
          );
          if (match) {
            dispatch(setSelectedLocation({ state: match.name, stateId: match.id }));
            saveLocationToLS(match.name, match.id);
          }
        }).catch(() => {});
      })
      .catch(() => {}) // silently ignore permission denied / unavailable
      .finally(() => setDetecting(false));
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
    ? dbStates.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : dbStates;

  const handleSelect = (stateObj: { id: string; name: string }) => {
    dispatch(setSelectedLocation({ state: stateObj.name, stateId: stateObj.id }));
    saveLocationToLS(stateObj.name, stateObj.id);
    setOpen(false);
    setQuery('');
    if (pathname !== '/') router.push('/');
  };

  const handleAllIndia = () => {
    dispatch(setSelectedLocation({ state: '', stateId: '' }));
    saveLocationToLS('', '');
    setOpen(false);
    setQuery('');
    if (pathname !== '/') router.push('/');
  };

  const handleDetectClick = () => {
    setDetecting(true);
    setOpen(false);
    detectLocation()
      .then((loc) => {
        if (!loc.state) return;
        const match = dbStates.find(s => s.name.toLowerCase() === loc.state.toLowerCase());
        if (match) {
          dispatch(setSelectedLocation({ state: match.name, stateId: match.id }));
          saveLocationToLS(match.name, match.id);
        }
      })
      .catch(() => {})
      .finally(() => setDetecting(false));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-600 transition-colors border border-gray-200"
        title="Select State"
      >
        <MapPin className={cn('w-3.5 h-3.5 flex-shrink-0', detecting ? 'text-orange-500 animate-pulse' : 'text-primary-600')} />
        <span className="max-w-[100px] truncate font-medium">
          {detecting ? 'Detecting…' : selectedState || '🇮🇳 All India'}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state..."
              autoFocus
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {/* Detect my location */}
            <button
              onClick={handleDetectClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 transition-colors text-left border-b border-gray-100"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              Detect my location
            </button>
            <button
              onClick={handleAllIndia}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left',
                !selectedState && 'bg-primary-50 text-primary-700 font-semibold'
              )}
            >
              🇮🇳 All India
            </button>
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left',
                  (selectedStateId === s.id || selectedState === s.name) && 'bg-primary-50 text-primary-700 font-semibold'
                )}
              >
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                {s.name}
              </button>
            ))}
            {filtered.length === 0 && query && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No states found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Properties Mega Dropdown ─────────────────────────────────────────────────

function PropertiesMega({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden w-[720px] max-w-[calc(100vw-2rem)]">
      {/* Top strip */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Browse Properties</span>
        <Link
          href="/properties"
          onClick={onClose}
          className="text-primary-100 hover:text-white text-xs underline underline-offset-2 transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 p-2">
        {MEGA_SECTIONS.map((section) => (
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

      {/* Bottom quick links */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center gap-6">
        <span className="text-xs text-gray-400 font-medium">Quick:</span>
        {[
          { label: '🏠 Ready to Move', href: '/buy?possessionStatus=ready_to_move' },
          { label: '💰 Under 50L', href: '/buy?maxPrice=5000000' },
          { label: '🛏 3BHK Flats', href: '/buy?type=apartment&bedrooms=3' },
          { label: '🏢 PG Near Metro', href: '/pg' },
        ].map((q) => (
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

function UserMenu() {
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
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-gray-800 leading-tight max-w-[7rem] truncate">
            {user?.name}
          </div>
          <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white shadow-xl rounded-xl border border-gray-100 py-1.5 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <div className="font-semibold text-gray-900 text-sm truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.phone || user?.email}</div>
          </div>

          {user?.role === 'admin' && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" /> Admin Panel
            </Link>
          )}
          {(user?.role === 'agent' || user?.role === 'seller') && (
            <Link href="/agent" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" /> Agent Panel
            </Link>
          )}
          {user?.role === 'buyer' && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Home className="w-4 h-4 text-gray-400" /> My Dashboard
            </Link>
          )}

          <Link
            href={user?.role === 'buyer' ? '/dashboard/saved' : '/my-listings'}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-4 h-4 text-gray-400" />
            {user?.role === 'buyer' ? 'Saved Properties' : 'My Listings'}
          </Link>

          <Link
            href={user?.role === 'buyer' ? '/dashboard/profile' : '/agent/profile'}
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

// ─── Mobile accordion section ─────────────────────────────────────────────────

function MobileSection({ section, onClose }: { section: MegaSection; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
      >
        <span className="flex items-center gap-2">
          <span className="text-primary-600">{section.icon}</span>
          {section.heading}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pl-10 pb-1 space-y-0.5">
          {section.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="block py-2 px-3 text-sm text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────

export default function Header() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mega on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 bg-white',
        scrolled ? 'shadow-md' : 'border-b border-gray-100'
      )}
    >
      <div className="container-max">
        <div className="flex items-center justify-between h-16 gap-2">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">

            {/* Properties mega trigger */}
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
                Properties
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

            {/* Standalone links */}
            {[
              { label: 'Agents', href: '/agents' },
              { label: 'Services', href: '/services' },
              { label: 'New Projects', href: '/new-projects' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StateSelector />

            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => dispatch(openAuthModal('login'))}
                  className="hidden md:block text-sm font-medium text-gray-700 hover:text-primary-600 px-3 py-2 transition-colors"
                >
                  Login
                </button>
              )
            )}

            <Link
              href="/post-property"
              className="btn-primary text-sm py-2 px-3 lg:px-4 hidden sm:flex items-center gap-1 whitespace-nowrap"
            >
              + Post <span className="hidden lg:inline">Property FREE</span>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-gray-100',
          mobileOpen ? 'max-h-[90vh] overflow-y-auto' : 'max-h-0'
        )}
      >
        <div className="py-2 px-2 space-y-0.5">
          {/* Properties accordion sections */}
          <div className="pb-1">
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Properties</p>
            {MEGA_SECTIONS.map((section) => (
              <MobileSection key={section.heading} section={section} onClose={() => setMobileOpen(false)} />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-1">
            {[
              { label: 'Agents', href: '/agents' },
              { label: 'Services', href: '/services' },
              { label: 'New Projects', href: '/new-projects' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Auth */}
          <div className="border-t border-gray-100 px-2 pt-3 pb-2 space-y-2">
            {user ? (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                </div>
              </div>
            ) : (
              <button
                className="btn-outline justify-center w-full"
                onClick={() => { setMobileOpen(false); dispatch(openAuthModal('login')); }}
              >
                Login / Register
              </button>
            )}
            <Link
              href="/post-property"
              className="btn-primary justify-center w-full flex"
              onClick={() => setMobileOpen(false)}
            >
              + Post Property FREE
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
