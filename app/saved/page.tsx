'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, Search, X, MapPin, Eye, Trash2,
  BedDouble, Maximize2, Building2, ChevronLeft, ChevronRight,
  Home, User, List,
} from 'lucide-react';
import { savedApi } from '@/lib/api';
import OptimizedImage from '@/components/common/OptimizedImage';
import { formatPrice, formatArea, getPropertyArea, getPrimaryImage, timeAgo, getCategoryLabel, getPropertyTypeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/auth/AuthGuard';

const PER_PAGE = 12;

const NAV_ITEMS = [
  { label: 'My Listings', icon: Home,  href: '/my-listings' },
  { label: 'Saved',       icon: Heart, href: '/saved',        active: true },
  { label: 'Profile',     icon: User,  href: '/profile' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

function SavedContent() {
  const [items, setItems]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await savedApi.getSaved({ page, limit: PER_PAGE });
      const items: any[] = res.data?.items ?? [];
      const total: number = res.data?.total ?? 0;

      // If backend has no records, check localStorage for IDs saved by old system
      // and push them to the backend, then reload
      if (items.length === 0 && page === 1) {
        try {
          const localIds: string[] = JSON.parse(localStorage.getItem('pf_wishlist') || '[]');
          if (localIds.length > 0) {
            await Promise.allSettled(localIds.map(id => savedApi.save(id)));
            // Re-fetch after syncing
            const res2 = await savedApi.getSaved({ page, limit: PER_PAGE });
            setItems(res2.data?.items ?? []);
            setTotal(res2.data?.total ?? 0);
            return;
          }
        } catch {}
      }

      setItems(items);
      setTotal(total);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleUnsave = async (propertyId: string) => {
    try {
      await savedApi.unsave(propertyId);
      setItems(prev => prev.filter(p => p.id !== propertyId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const filtered = query
    ? items.filter(p =>
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.city?.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const goPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-100 flex-col fixed inset-y-0 left-0 z-30 pt-16">
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Saved Properties</p>
              {!loading && <p className="text-xs text-gray-400">{total} saved</p>}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  item.active
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                )}>
                <Icon size={18} className="flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <Link href="/properties"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all">
            <Search size={18} /> Browse Properties
          </Link>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-h-screen pb-24 lg:pb-8">

        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="px-4 lg:px-6 h-16 flex items-center gap-3">
            <div className="lg:hidden flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h1 className="text-base font-black text-gray-900">Saved</h1>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter saved properties…"
                className="w-full bg-gray-100 rounded-xl pl-9 pr-8 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-rose-400 transition-all"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <Link href="/properties"
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 active:scale-95 transition-all shadow-sm shadow-rose-500/25">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 lg:px-6 pt-5">

          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{total}</span> saved properties
                {query && <span className="text-gray-400"> · {filtered.length} shown</span>}
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-gray-400">Page <span className="font-semibold text-gray-700">{page}</span> / {totalPages}</p>
              )}
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-44 bg-gray-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="flex gap-2"><div className="h-5 w-14 bg-gray-100 rounded-full" /><div className="h-5 w-20 bg-gray-100 rounded-full" /></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="flex gap-2 pt-1"><div className="h-10 bg-gray-100 rounded-xl flex-1" /><div className="h-10 bg-gray-100 rounded-xl w-12" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-5">
                {query
                  ? <Search className="w-9 h-9 text-rose-300" />
                  : <Heart className="w-9 h-9 text-rose-300" />
                }
              </div>
              <p className="text-lg font-black text-gray-800 mb-1">
                {query ? 'No matches' : 'No saved properties'}
              </p>
              <p className="text-sm text-gray-400 max-w-xs mb-7 leading-relaxed">
                {query
                  ? `Nothing matched "${query}".`
                  : 'Tap the ♥ icon on any listing to save it here for quick access.'}
              </p>
              {query ? (
                <button onClick={() => setQuery('')}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200">
                  Clear filter
                </button>
              ) : (
                <Link href="/properties"
                  className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/25 hover:bg-rose-600 active:scale-95 transition-all">
                  <Search className="w-4 h-4" /> Browse Properties
                </Link>
              )}
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <SavedCard key={p.id} p={p} onUnsave={handleUnsave} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && !query && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:border-rose-300 hover:text-rose-500 transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="w-9 text-center text-gray-400 text-sm">…</span>
                  : <button key={n} onClick={() => goPage(n as number)}
                      className={cn('w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-95',
                        page === n ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500')}>
                      {n}
                    </button>
                )}

              <button onClick={() => goPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:border-rose-300 hover:text-rose-500 transition-all active:scale-95">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function SavedCard({ p, onUnsave }: { p: any; onUnsave: (id: string) => void }) {
  const [removing, setRemoving] = useState(false);
  const thumb = p.images?.[0]?.url || getPrimaryImage([]);

  const handleRemove = async () => {
    setRemoving(true);
    await onUnsave(p.id);
    setRemoving(false);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div className="relative h-44 bg-gray-100">
        <OptimizedImage src={thumb} alt={p.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

        {/* Remove button */}
        <button onClick={handleRemove} disabled={removing}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50 active:scale-90">
          {removing
            ? <span className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            : <Heart className="w-3.5 h-3.5 fill-current" />
          }
        </button>

        {p.isPremium && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">Premium</span>
        )}

        <div className="absolute bottom-2.5 left-3">
          <p className="text-white font-black text-base leading-tight drop-shadow">{formatPrice(p.price, p.priceUnit)}</p>
          {(() => { const { area: a } = getPropertyArea(p); return a && p.price ? <p className="text-white/65 text-[10px]">₹{Math.round(p.price / a).toLocaleString('en-IN')}/sqft</p> : null; })()}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md capitalize">{getCategoryLabel(p.category)}</span>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md capitalize">{getPropertyTypeLabel(p.type)}</span>
          {p.bedrooms && <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><BedDouble className="w-2.5 h-2.5" />{p.bedrooms} BHK</span>}
          {(() => { const { area: a, areaUnit: u } = getPropertyArea(p); return a ? <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"><Maximize2 className="w-2.5 h-2.5" />{formatArea(a, u)}</span> : null; })()}
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{p.title}</h3>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <Link href={`/properties/${p.slug}`}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/20">
            <Eye className="w-3.5 h-3.5" /> View Property
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  return (
    <AuthGuard>
      <SavedContent />
    </AuthGuard>
  );
}
