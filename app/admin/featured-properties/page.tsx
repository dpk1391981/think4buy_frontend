'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, homeApi } from '@/lib/api';
import {
  Star, StarOff, Crown, Rocket, RefreshCw,
  ExternalLink, Eye, CheckCircle2, AlertCircle,
  Zap, Search, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/common/OptimizedImage';
import { resolveImageUrl } from '@/lib/imageUtils';

function formatPrice(p: number): string {
  if (!p) return '—';
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)} Cr`;
  if (p >= 100000)   return `₹${(p / 100000).toFixed(1)} L`;
  return `₹${p.toLocaleString('en-IN')}`;
}

export default function FeaturedPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [tab, setTab]               = useState<'featured' | 'premium' | 'top'>('featured');
  const [loading, setLoading]       = useState(true);
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [saving, setSaving]         = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'top') {
        res = await homeApi.getTopProperties({ tab: 'smart_featured', limit: 20 });
        setProperties(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } else {
        const params: any = { limit: 50, approvalStatus: 'approved', sortBy: 'featuredScore', sortOrder: 'DESC' };
        if (tab === 'featured') params.isFeatured = true;
        if (tab === 'premium')  params.isPremium  = true;
        res = await adminApi.getProperties(params);
        const d = res.data;
        setProperties(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      }
    } catch {
      showToast('Failed to load properties', false);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleToggleFeatured = async (p: any) => {
    setSaving(p.id);
    try {
      await adminApi.togglePropertyFeatured(p.id);
      setProperties(prev => tab === 'featured'
        ? prev.filter(x => x.id !== p.id)
        : prev.map(x => x.id === p.id ? { ...x, isFeatured: !x.isFeatured } : x),
      );
      showToast(`${p.title.slice(0, 40)}… ${p.isFeatured ? 'removed from' : 'added to'} Featured`);
    } catch {
      showToast('Update failed', false);
    } finally {
      setSaving(null);
    }
  };

  const handleTogglePremium = async (p: any) => {
    setSaving(p.id);
    try {
      await adminApi.togglePropertyPremium(p.id);
      setProperties(prev => tab === 'premium'
        ? prev.filter(x => x.id !== p.id)
        : prev.map(x => x.id === p.id ? { ...x, isPremium: !x.isPremium } : x),
      );
      showToast(`${p.title.slice(0, 40)}… ${p.isPremium ? 'removed from' : 'added to'} Premium`);
    } catch {
      showToast('Update failed', false);
    } finally {
      setSaving(null);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      await adminApi.refreshPropertyCache();
      showToast('Smart Pick cache refreshed — rankings updated');
      if (tab === 'top') await load();
    } catch {
      showToast('Refresh failed', false);
    } finally {
      setRefreshingCache(false);
    }
  };

  const filtered = properties.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const TABS = [
    { id: 'featured' as const, label: 'Boosted',    icon: <Rocket className="w-3.5 h-3.5" />, desc: 'Properties with isFeatured = true' },
    { id: 'premium'  as const, label: 'Premium',    icon: <Crown className="w-3.5 h-3.5" />,  desc: 'Properties with isPremium = true' },
    { id: 'top'      as const, label: 'Smart Pick', icon: <Star className="w-3.5 h-3.5" />,   desc: 'Top 20 from AI rankings cache' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white',
          toast.ok ? 'bg-green-600' : 'bg-red-500',
        )}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-yellow-500" />
            <h1 className="text-xl font-bold text-gray-900">Featured Properties</h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage which properties appear in Smart Pick, Boosted, and Premium tabs on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshCache}
            disabled={refreshingCache}
            title="Recalculate Smart Pick rankings from live data"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', refreshingCache && 'animate-spin')} />
            Refresh Rankings
          </button>
          <Link
            href="/properties"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on Homepage
          </Link>
        </div>
      </div>

      {/* How it works info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 mb-5 space-y-0.5">
        <p className="font-semibold text-blue-800 mb-1">How homepage featured properties work</p>
        <p>🏆 <strong>Smart Pick</strong> — Auto-ranked by AI score (views, inquiries, recency, plan). Updated every 30 min by cron or via &quot;Refresh Rankings&quot;.</p>
        <p>🚀 <strong>Boosted</strong> — Properties where you toggle <em>isFeatured = ON</em> below. Appear on homepage immediately.</p>
        <p>⭐ <strong>Premium</strong> — Properties where you toggle <em>isPremium = ON</em> below. Higher visibility in search results.</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.desc}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.icon} {t.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                tab === t.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500',
              )}>
                {tab === t.id ? filtered.length : ''}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 w-56"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-36 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium">No properties found</p>
          {tab === 'featured' && <p className="text-xs mt-1">Mark properties as Featured from the Properties admin page.</p>}
          {tab === 'premium'  && <p className="text-xs mt-1">Mark properties as Premium from the Properties admin page.</p>}
          {tab === 'top'      && <p className="text-xs mt-1">Click &quot;Refresh Rankings&quot; to populate the Smart Pick cache.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p: any) => {
            const isSaving = saving === p.id;
            const img = p.images?.[0]?.url || p.primaryImage;
            const views7d = p._viewsLast7d ?? p.viewsLast7d ?? 0;
            const score   = p._score ?? p.listingScore ?? 0;

            return (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group">
                {/* Image */}
                <div className="relative h-36 bg-gray-100 overflow-hidden">
                  <OptimizedImage
                    src={resolveImageUrl(img)}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="200px"
                  />
                  {/* Score badge */}
                  {score > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      <BarChart2 className="w-2.5 h-2.5" />{Math.round(score)}
                    </div>
                  )}
                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {p.isFeatured && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white leading-none">🚀 Boosted</span>
                    )}
                    {p.isPremium && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white leading-none">⭐ Premium</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{p.title}</p>
                  <p className="text-[10px] text-gray-400 mb-2">{[p.locality, p.city].filter(Boolean).join(', ')}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{views7d > 0 ? `${views7d}w` : p.viewCount || 0}</span>
                    <span className="ml-auto font-semibold text-gray-700 text-xs">{formatPrice(p.price)}</span>
                  </div>

                  {/* Toggle buttons */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      disabled={isSaving}
                      title={p.isFeatured ? 'Remove Boosted' : 'Mark as Boosted (isFeatured)'}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50',
                        p.isFeatured
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600',
                      )}
                    >
                      <Rocket className="w-3 h-3" />
                      {p.isFeatured ? 'Boosted' : 'Boost'}
                    </button>
                    <button
                      onClick={() => handleTogglePremium(p)}
                      disabled={isSaving}
                      title={p.isPremium ? 'Remove Premium' : 'Mark as Premium'}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50',
                        p.isPremium
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600',
                      )}
                    >
                      <Crown className="w-3 h-3" />
                      {p.isPremium ? 'Premium' : 'Upgrade'}
                    </button>
                  </div>
                  <Link
                    href={`/properties/${p.slug || p.id}`}
                    target="_blank"
                    className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> View listing
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab !== 'top' && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          To feature more properties, go to{' '}
          <Link href="/admin/properties" className="text-primary-600 hover:underline">Admin → Properties</Link>
          {' '}and use the action menu to toggle Featured / Premium.
        </p>
      )}
    </div>
  );
}
