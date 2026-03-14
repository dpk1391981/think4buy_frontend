'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, CheckCircle, Clock, XCircle, Building2, LayoutGrid,
  MapPin, Eye, Pencil, Star, Search, X, Home, List,
  ChevronLeft, ChevronRight, BedDouble, Maximize2, RefreshCw,
  TrendingUp, LogOut, User, Settings, Heart, Target,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { propertiesApi } from '@/lib/api';
import OptimizedImage from '@/components/common/OptimizedImage';
import {
  formatPrice, formatArea, getPrimaryImage,
  timeAgo, getPropertyTypeLabel, getCategoryLabel,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE = 9;

const STATUS_CONFIG = {
  active:   { label: 'Active',   dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle, color: 'text-emerald-600' },
  pending:  { label: 'Pending',  dot: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',       icon: Clock,        color: 'text-amber-600' },
  rejected: { label: 'Rejected', dot: 'bg-red-500',     pill: 'bg-red-50 text-red-600 ring-1 ring-red-200',            icon: XCircle,      color: 'text-red-500' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;
type ViewMode = 'grid' | 'list';

// ─── Sidebar nav items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'My Listings', icon: Home, href: '/my-listings', active: true },
  { label: 'Saved',       icon: Heart,  href: '/saved' },
  { label: 'Profile',     icon: User,   href: '/profile' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function MyListingsContent() {
  const { user } = useAuth();

  const [all, setAll]             = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]             = useState<string>('');
  const [query, setQuery]         = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage]           = useState(1);
  const [view, setView]           = useState<ViewMode>('grid');
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const topRef = useRef<HTMLDivElement>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const res = await propertiesApi.getAll({ limit: 200, sortBy: 'createdAt', sortOrder: 'DESC' });
      setAll(res.data?.data ?? res.data?.items ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  // ── Debounce search ──────────────────────────────────────────────────────────

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedQ(query); setPage(1); }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    '': all.length,
    active:   all.filter(p => p.status === 'active').length,
    pending:  all.filter(p => p.status === 'pending').length,
    rejected: all.filter(p => p.status === 'rejected').length,
  }), [all]);

  const filtered = useMemo(() => {
    let list = tab ? all.filter(p => p.status === tab) : all;
    if (debouncedQ) {
      const q = debouncedQ.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [all, tab, debouncedQ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const changeTab = (v: string) => { setTab(v); setPage(1); };

  const goPage = (n: number) => {
    setPage(n);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const initials = (user as any)?.name
    ? (user as any).name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'ME';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ══════════════════════════════════════════════════
          LEFT SIDEBAR — hidden on mobile, visible on lg+
      ══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-100 flex-col fixed inset-y-0 left-0 z-30 pt-16">

        {/* Profile block */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg shadow-blue-500/25">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{(user as any)?.name || 'My Account'}</p>
              <p className="text-xs text-gray-400 truncate">{(user as any)?.phone || (user as any)?.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                {(user as any)?.role || 'owner'}
              </span>
            </div>
          </div>

          {/* Stat row */}
          {!loading && (
            <div className="grid grid-cols-3 gap-2">
              {(['active', 'pending', 'rejected'] as StatusKey[]).map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => changeTab(tab === s ? '' : s)}
                    className={cn(
                      'rounded-xl py-2 text-center transition-all',
                      tab === s ? 'bg-blue-600 shadow-md shadow-blue-600/20' : 'bg-gray-50 hover:bg-gray-100',
                    )}
                  >
                    <p className={cn('text-lg font-black leading-none', tab === s ? 'text-white' : cfg.color)}>
                      {counts[s]}
                    </p>
                    <p className={cn('text-[9px] font-semibold mt-0.5', tab === s ? 'text-blue-100' : 'text-gray-400')}>
                      {cfg.label}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  item.active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                )}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Quick Actions</p>
            <Link
              href="/post-property"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
            >
              <Plus size={18} />
              Post New Property
            </Link>
          </div>
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <Settings size={16} /> Settings
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all">
            <LogOut size={16} /> Back to Site
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-h-screen pb-24 lg:pb-8">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="px-4 lg:px-6 h-16 flex items-center gap-3">

            {/* Mobile: title */}
            <div className="lg:hidden">
              <h1 className="text-base font-black text-gray-900">My Listings</h1>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md lg:max-w-sm xl:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search listings…"
                className="w-full bg-gray-100 rounded-xl pl-9 pr-8 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all"
              />
              {query && (
                <button onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-1">
                <button onClick={() => setView('grid')}
                  className={cn('p-1.5 rounded-lg transition-all', view === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600')}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setView('list')}
                  className={cn('p-1.5 rounded-lg transition-all', view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600')}>
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button onClick={() => load(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              </button>

              {/* Post — desktop only (sidebar has it too) */}
              <Link href="/post-property"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/25">
                <Plus className="w-4 h-4" /> Post
              </Link>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-4 lg:px-6 flex items-center gap-1.5 pb-3 overflow-x-auto scrollbar-hide">
            {[{ value: '', label: 'All' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(({ value, label }) => {
              const cfg = value ? STATUS_CONFIG[value as StatusKey] : null;
              return (
                <button key={value} onClick={() => changeTab(value)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all',
                    tab === value
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                  )}
                >
                  {cfg && <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />}
                  {label}
                  {!loading && <span className={cn('text-[10px]', tab === value ? 'opacity-75' : 'opacity-60')}>{counts[value as string] ?? 0}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content area ─────────────────────────────────────────────── */}
        <div className="flex-1 px-4 lg:px-6 pt-5" ref={topRef}>

          {/* Results count */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{filtered.length}</span>
                {' '}{debouncedQ || tab ? 'results' : 'properties'}
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-gray-400">
                  Page <span className="font-semibold text-gray-700">{safePage}</span> / {totalPages}
                </p>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className={cn(
              'gap-4',
              view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col',
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="flex gap-2"><div className="h-5 w-14 bg-gray-100 rounded-full" /><div className="h-5 w-20 bg-gray-100 rounded-full" /></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="flex gap-2 pt-1"><div className="h-10 bg-gray-100 rounded-xl flex-1" /><div className="h-10 bg-gray-100 rounded-xl flex-1" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5">
                {debouncedQ ? <Search className="w-9 h-9 text-blue-300" /> : <Building2 className="w-9 h-9 text-blue-300" />}
              </div>
              <p className="text-lg font-black text-gray-800 mb-1">
                {debouncedQ ? 'No results found' : tab ? `No ${tab} listings` : 'No listings yet'}
              </p>
              <p className="text-sm text-gray-400 max-w-xs mb-7 leading-relaxed">
                {debouncedQ
                  ? `Nothing matched "${debouncedQ}".`
                  : tab ? `You have no ${tab} properties.`
                  : 'Post your first property and reach thousands of buyers.'}
              </p>
              {debouncedQ ? (
                <button onClick={() => setQuery('')} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200">Clear search</button>
              ) : !tab ? (
                <Link href="/post-property" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Post Property FREE
                </Link>
              ) : null}
            </div>
          )}

          {/* Cards */}
          {!loading && paginated.length > 0 && (
            <div className={cn(
              'gap-4',
              view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col',
            )}>
              {paginated.map(p => (
                view === 'list'
                  ? <ListingRow key={p.id} p={p} />
                  : <ListingCard key={p.id} p={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8 mb-2">
              <button onClick={() => goPage(Math.max(1, safePage - 1))} disabled={safePage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="w-9 text-center text-gray-400 text-sm">…</span>
                  : <button key={n} onClick={() => goPage(n as number)}
                      className={cn('w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-95',
                        safePage === n ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600')}>
                      {n}
                    </button>
                )}

              <button onClick={() => goPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile FAB ─────────────────────────────────────────────────── */}
      <Link href="/post-property"
        className="fixed bottom-[72px] right-4 z-[60] flex items-center gap-2 pl-4 pr-5 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all lg:hidden">
        <Plus className="w-5 h-5" /> Post
      </Link>
    </div>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function ListingCard({ p }: { p: any }) {
  const status = STATUS_CONFIG[p.status as StatusKey] ?? STATUS_CONFIG.pending;
  const thumb  = p.images?.[0]?.url || getPrimaryImage([]);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative h-44 bg-gray-100">
        <OptimizedImage src={thumb} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={cn('flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 ring-1', status.pill)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
          {p.isPremium && <span className="flex items-center gap-0.5 pl-1.5 pr-2 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold"><Star className="w-2.5 h-2.5 fill-current" /> Premium</span>}
        </div>

        {(p.viewCount ?? 0) > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" /> {p.viewCount}
          </div>
        )}

        <div className="absolute bottom-2.5 left-3">
          <p className="text-white font-black text-base leading-tight drop-shadow">{formatPrice(p.price, p.priceUnit)}</p>
          {p.area && p.price && <p className="text-white/65 text-[10px]">₹{Math.round(p.price / p.area).toLocaleString('en-IN')}/sqft</p>}
        </div>
        <p className="absolute bottom-2.5 right-3 text-white/60 text-[10px]">{timeAgo(p.createdAt)}</p>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md capitalize">{getCategoryLabel(p.category)}</span>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md capitalize">{getPropertyTypeLabel(p.type)}</span>
          {p.bedrooms && <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><BedDouble className="w-2.5 h-2.5" />{p.bedrooms} BHK</span>}
          {p.area && <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><Maximize2 className="w-2.5 h-2.5" />{formatArea(p.area, p.areaUnit)}</span>}
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{p.title}</h3>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Link href={`/properties/${p.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 active:scale-95 transition-all">
            <Eye className="w-3.5 h-3.5" /> View
          </Link>
          <Link href={`/post-property?edit=${p.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/20">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function ListingRow({ p }: { p: any }) {
  const status = STATUS_CONFIG[p.status as StatusKey] ?? STATUS_CONFIG.pending;
  const thumb  = p.images?.[0]?.url || getPrimaryImage([]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex hover:shadow-md transition-all">
      {/* Thumb */}
      <div className="relative w-36 sm:w-44 flex-shrink-0">
        <OptimizedImage src={thumb} alt={p.title} fill className="object-cover" sizes="176px" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className={cn('flex items-center gap-1 pl-2 pr-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white ring-1', status.pill)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
            {(p.viewCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400"><Eye className="w-3 h-3" />{p.viewCount}</span>
            )}
          </div>
          <p className="font-bold text-gray-900 text-sm line-clamp-1 mb-0.5">{p.title}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
          </p>
          <p className="text-sm font-black text-blue-600">{formatPrice(p.price, p.priceUnit)}</p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Link href={`/properties/${p.slug}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 active:scale-95 transition-all">
            <Eye className="w-3 h-3" /> View
          </Link>
          <Link href={`/post-property?edit=${p.id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all">
            <Pencil className="w-3 h-3" /> Edit
          </Link>
          <span className="ml-auto text-[10px] text-gray-300">{timeAgo(p.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function MyListingsPage() {
  return (
    <AuthGuard>
      <MyListingsContent />
    </AuthGuard>
  );
}
