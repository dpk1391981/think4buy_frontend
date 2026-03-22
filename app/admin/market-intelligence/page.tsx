'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import {
  BarChart2, RefreshCw, Star, StarOff, TrendingUp, TrendingDown,
  Minus, ArrowUp, ArrowDown, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Snapshot {
  id: string;
  city: string | null;
  state: string | null;
  avgPsf: number;
  prevAvgPsf: number;
  trend: 'up' | 'down' | 'stable';
  trendPct: number;
  listingCount: number;
  totalListingCount: number;
  avgMonthlyRent: number;
  rentYield: number;
  buySavingsPct: number;
  isFeatured: boolean;
  sortOrder: number;
  updatedAt: string;
}

function TrendBadge({ trend, pct }: { trend: string; pct: number }) {
  if (trend === 'up')   return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><TrendingUp className="w-3 h-3" />+{pct}%</span>;
  if (trend === 'down') return <span className="flex items-center gap-1 text-red-500 text-xs font-semibold"><TrendingDown className="w-3 h-3" />-{pct}%</span>;
  return <span className="flex items-center gap-1 text-gray-400 text-xs"><Minus className="w-3 h-3" />Stable</span>;
}

export default function MarketIntelligencePage() {
  const [snapshots, setSnapshots]   = useState<Snapshot[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null); // city name being refreshed
  const [refreshingCache, setRefreshingCache] = useState(false);
  const [saving, setSaving]         = useState<string | null>(null);   // id being saved
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listMarketSnapshots();
      setSnapshots(res.data?.data ?? []);
    } catch {
      showToast('Failed to load snapshots', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleFeatured = async (snap: Snapshot) => {
    setSaving(snap.id);
    try {
      await adminApi.updateMarketSnapshot(snap.id, { isFeatured: !snap.isFeatured });
      setSnapshots(prev =>
        prev.map(s => s.id === snap.id ? { ...s, isFeatured: !s.isFeatured } : s),
      );
      showToast(`${snap.city} ${!snap.isFeatured ? 'featured' : 'unfeatured'}`);
    } catch {
      showToast('Update failed', false);
    } finally {
      setSaving(null);
    }
  };

  const handleSortOrder = async (snap: Snapshot, dir: 'up' | 'down') => {
    const newOrder = dir === 'up' ? Math.max(0, snap.sortOrder - 10) : snap.sortOrder + 10;
    setSaving(snap.id);
    try {
      await adminApi.updateMarketSnapshot(snap.id, { sortOrder: newOrder });
      setSnapshots(prev =>
        prev.map(s => s.id === snap.id ? { ...s, sortOrder: newOrder } : s)
            .sort((a, b) => (a.isFeatured === b.isFeatured ? a.sortOrder - b.sortOrder : (a.isFeatured ? -1 : 1))),
      );
      showToast(`${snap.city} order updated`);
    } catch {
      showToast('Update failed', false);
    } finally {
      setSaving(null);
    }
  };

  const handleRefreshCity = async (city: string) => {
    setRefreshing(city);
    try {
      await adminApi.refreshMarketSnapshot(city);
      showToast(`${city} snapshot refreshed`);
      await load();
    } catch {
      showToast(`Refresh failed for ${city}`, false);
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      await adminApi.refreshPropertyCache();
      showToast('Property rankings cache refreshed');
    } catch {
      showToast('Cache refresh failed', false);
    } finally {
      setRefreshingCache(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing('__all__');
    try {
      const res = await adminApi.refreshMarketSnapshot(undefined, true);
      showToast(`Refreshed ${res.data?.refreshed ?? 0} cities`);
      await load();
    } catch {
      showToast('Refresh all failed', false);
    } finally {
      setRefreshing(null);
    }
  };

  const featured  = snapshots.filter(s => s.isFeatured).sort((a, b) => a.sortOrder - b.sortOrder);
  const remaining = snapshots.filter(s => !s.isFeatured).sort((a, b) => b.totalListingCount - a.totalListingCount);
  const ordered   = [...featured, ...remaining];

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
            <BarChart2 className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Market Intelligence</h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage which cities appear in the homepage Price Snapshot section.
            Pin cities to always show them; use sort order to control tab sequence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshCache}
            disabled={refreshingCache}
            title="Refresh Smart Pick / Trending property rankings"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', refreshingCache && 'animate-spin')} />
            Refresh Rankings
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={refreshing === '__all__'}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing === '__all__' && 'animate-spin')} />
            Refresh All Cities
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Cities', value: snapshots.length, icon: BarChart2 },
          { label: 'Pinned (Featured)', value: featured.length, icon: Star },
          { label: 'With Data', value: snapshots.filter(s => s.avgPsf > 0).length, icon: CheckCircle2 },
          { label: 'No Data Yet', value: snapshots.filter(s => s.avgPsf === 0).length, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-40" />
          <p className="text-sm">Loading snapshots…</p>
        </div>
      ) : ordered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="text-sm font-medium">No market snapshots yet</p>
          <p className="text-xs mt-1">Click "Refresh All Cities" to generate snapshots from your listings.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">City</th>
                  <th className="text-right px-4 py-3">Avg PSF</th>
                  <th className="text-right px-4 py-3">Trend</th>
                  <th className="text-right px-4 py-3">Listings</th>
                  <th className="text-right px-4 py-3">Rent Yield</th>
                  <th className="text-right px-4 py-3">Updated</th>
                  <th className="text-center px-4 py-3">Featured</th>
                  <th className="text-center px-4 py-3">Order</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((snap, idx) => {
                  const isRefreshing = refreshing === snap.city;
                  const isSaving     = saving === snap.id;
                  const staleHours   = snap.updatedAt
                    ? Math.round((Date.now() - new Date(snap.updatedAt).getTime()) / (1000 * 60 * 60))
                    : null;

                  return (
                    <tr
                      key={snap.id}
                      className={cn(
                        'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
                        snap.isFeatured && 'bg-primary-50/30',
                        idx === ordered.length - 1 && 'border-0',
                      )}
                    >
                      {/* City */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {snap.isFeatured && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{snap.city || snap.state || '—'}</p>
                            {snap.state && snap.city && (
                              <p className="text-[10px] text-gray-400">{snap.state}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Avg PSF */}
                      <td className="px-4 py-3 text-right">
                        {snap.avgPsf > 0 ? (
                          <span className="font-bold text-gray-900">
                            ₹{Math.round(snap.avgPsf).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">No data</span>
                        )}
                      </td>

                      {/* Trend */}
                      <td className="px-4 py-3 text-right">
                        <TrendBadge trend={snap.trend} pct={Math.round(Number(snap.trendPct) * 10) / 10} />
                      </td>

                      {/* Listings */}
                      <td className="px-4 py-3 text-right">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{snap.listingCount.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-gray-400">buy</p>
                        </div>
                      </td>

                      {/* Rent Yield */}
                      <td className="px-4 py-3 text-right">
                        {snap.rentYield > 0 ? (
                          <span className="text-blue-600 font-semibold">{snap.rentYield}%</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 text-right">
                        {snap.updatedAt ? (
                          <span className={cn(
                            'text-xs',
                            staleHours !== null && staleHours > 8 ? 'text-orange-500' : 'text-gray-400',
                          )}>
                            {staleHours !== null && staleHours < 1
                              ? '< 1h ago'
                              : staleHours !== null
                              ? `${staleHours}h ago`
                              : '—'}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">Never</span>
                        )}
                      </td>

                      {/* Featured toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(snap)}
                          disabled={isSaving}
                          title={snap.isFeatured ? 'Unpin city' : 'Pin city to homepage'}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-colors',
                            snap.isFeatured
                              ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100'
                              : 'bg-gray-50 text-gray-300 hover:text-yellow-400 hover:bg-yellow-50',
                            isSaving && 'opacity-50',
                          )}
                        >
                          {snap.isFeatured
                            ? <Star className="w-4 h-4 fill-yellow-400" />
                            : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Sort order */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSortOrder(snap, 'up')}
                            disabled={isSaving}
                            className="w-6 h-6 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"
                          >
                            <ArrowUp className="w-3 h-3 text-gray-500" />
                          </button>
                          <span className="text-xs text-gray-400 w-8 text-center">{snap.sortOrder}</span>
                          <button
                            onClick={() => handleSortOrder(snap, 'down')}
                            disabled={isSaving}
                            className="w-6 h-6 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center disabled:opacity-40"
                          >
                            <ArrowDown className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </td>

                      {/* Refresh */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRefreshCity(snap.city || '')}
                          disabled={isRefreshing || refreshing === '__all__'}
                          title="Recalculate from live DB"
                          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
                          Refresh
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>Snapshots are auto-refreshed every 4 hours via a background cron job.</li>
          <li>All price-per-sqft values are <strong>unit-normalised</strong> (Sq.Yd → Sq.Ft, Sq.Mt → Sq.Ft, Acres → Sq.Ft, etc.)</li>
          <li>Only <strong>buy</strong> listings are used for PSF stats; <strong>rent</strong> listings feed the rental yield.</li>
          <li>Pin (★) cities to always show them in the homepage Market Intelligence tabs.</li>
          <li>Use the ↑↓ arrows to control the tab display order (lower number = shown first).</li>
        </ul>
      </div>
    </div>
  );
}
