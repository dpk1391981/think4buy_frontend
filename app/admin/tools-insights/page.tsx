'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, Calculator, RefreshCw, MapPin,
  Loader2, CheckCircle, XCircle, AlertCircle, Search, Eye,
} from 'lucide-react';
import { insightsApi } from '@/lib/api';
import { api } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function StatCard({ title, value, sub, icon, color = 'violet' }: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string;
}) {
  const bg = { violet: 'bg-violet-50', green: 'bg-green-50', amber: 'bg-amber-50', blue: 'bg-blue-50' }[color] ?? 'bg-violet-50';
  return (
    <div className={`${bg} rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ── Snapshots Table ───────────────────────────────────────────────────────────

function SnapshotsTab() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [search,    setSearch]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/market-snapshots');
      setSnapshots(res.data?.data ?? []);
    } catch {
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const refresh = async (city: string, state: string) => {
    setRefreshing(city);
    try {
      await api.post('/home/market-snapshot/refresh', { city, state });
      await load();
    } finally {
      setRefreshing(null);
    }
  };

  const refreshAll = async () => {
    setRefreshing('all');
    try {
      await api.post('/home/market-snapshot/refresh', { all: true });
      await load();
    } finally {
      setRefreshing(null);
    }
  };

  const filtered = snapshots.filter(s =>
    !search || (s.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <button onClick={refreshAll} disabled={!!refreshing}
          className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
          {refreshing === 'all' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh All
        </button>
      </div>

      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-500" size={28} /></div>
        : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="py-3 px-4 text-left">City</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-right">Avg PSF</th>
                  <th className="py-3 px-4 text-right">Trend</th>
                  <th className="py-3 px-4 text-right">Listings</th>
                  <th className="py-3 px-4 text-center">Quality</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{s.city ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-500 capitalize">{s.propertyType ?? 'All'} / {s.listingType ?? 'All'}</td>
                    <td className="py-3 px-4 text-right font-medium">₹{Math.round(Number(s.avgPsf)).toLocaleString('en-IN')}</td>
                    <td className={`py-3 px-4 text-right font-medium ${s.trend === 'up' ? 'text-green-600' : s.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                      {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'} {Number(s.trendPct).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">{Number(s.listingCount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        s.dataQuality === 'high' ? 'bg-green-100 text-green-700' :
                        s.dataQuality === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {s.dataQuality ?? 'low'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s.isFeatured ? <CheckCircle size={15} className="text-green-500 mx-auto" /> : <XCircle size={15} className="text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => refresh(s.city, s.state)}
                          disabled={!!refreshing}
                          title="Refresh snapshot"
                          className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 disabled:opacity-40">
                          {refreshing === s.city ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        </button>
                        <a href={`/property-prices-in/${s.city?.toLowerCase()}`} target="_blank" rel="noopener noreferrer"
                          title="View SEO page"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          <Eye size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">No snapshots found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ── Demand Insights Tab ───────────────────────────────────────────────────────

function DemandTab() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsApi.demand().then(res => setData(res.data?.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-500" size={28} /></div>;
  if (!data)   return <div className="text-center py-12 text-gray-400">No demand data available.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Search size={15} className="text-violet-500" />Top Search Queries (30d)</h3>
        {data.topSearches?.length > 0 ? (
          <ol className="space-y-2">
            {data.topSearches.map((s: any, i: number) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="flex-1 truncate text-gray-700">{s.query}</span>
                <span className="text-xs text-gray-400 shrink-0">{s.count}×</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-gray-400">No search data yet.</p>}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calculator size={15} className="text-violet-500" />Popular BHK Types</h3>
        {data.popularBhk?.length > 0 ? (
          <div className="space-y-3">
            {data.popularBhk.map((b: any, i: number) => {
              const max = Math.max(...data.popularBhk.map((x: any) => Number(x.count)));
              const pct = (Number(b.count) / max) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{b.bhk} BHK</span>
                    <span className="text-gray-500">{Number(b.count).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-violet-500 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-400">No BHK data yet.</p>}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={15} className="text-violet-500" />Top Cities by Listings</h3>
        {data.topCities?.length > 0 ? (
          <div className="space-y-2">
            {data.topCities.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <span className="font-medium">{c.city}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-xs">₹{Math.round(Number(c.avgPsf)).toLocaleString('en-IN')}/sqft</div>
                  <div className="text-xs text-gray-400">{Number(c.listingCount).toLocaleString('en-IN')} listings</div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No city data yet.</p>}
      </div>
    </div>
  );
}

// ── Market Cards Preview Tab ──────────────────────────────────────────────────

function MarketCardsTab() {
  const [cards,   setCards]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city,    setCity]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await insightsApi.marketCards({ city: city || undefined });
      setCards(res.data?.data ?? []);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Filter by city (optional)..."
          className="flex-1 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Filter
        </button>
      </div>

      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-500" size={28} /></div>
        : cards.length > 0
          ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">{card.city || 'All'}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      card.trend === 'up' ? 'bg-green-100 text-green-700' :
                      card.trend === 'down' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{card.tag}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{card.insight}</p>
                  {card.avgPsf > 0 && <p className="text-xs text-gray-400 mt-2">Avg ₹{Math.round(Number(card.avgPsf)).toLocaleString('en-IN')}/sqft</p>}
                </div>
              ))}
            </div>
          )
          : <div className="text-center py-12 text-gray-400 text-sm">No market cards generated yet. Refresh market snapshots to generate insights.</div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const TABS = ['Market Snapshots', 'Demand Insights', 'Market Cards'] as const;
type Tab   = typeof TABS[number];

export default function AdminToolsInsightsPage() {
  const [tab,     setTab]     = useState<Tab>('Market Snapshots');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics/admin/summary?days=7').then(res => setSummary(res.data?.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tools &amp; Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Manage market data, insights, and analytics for the Tools section</p>
        </div>
        <a href="/tools" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-violet-300 text-violet-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors">
          <Eye size={15} />Preview Tools Page
        </a>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Events (7d)" value={Number(summary.totalEvents).toLocaleString('en-IN')} icon={<BarChart2 size={18} />} color="violet" />
          <StatCard title="Top Cities" value={summary.topCities?.length ?? 0} icon={<MapPin size={18} />} color="blue" />
          <StatCard title="Analytics Period" value={summary.period} sub="last N days" icon={<TrendingUp size={18} />} color="green" />
          <StatCard title="Categories Tracked" value={summary.topCategories?.length ?? 0} icon={<Calculator size={18} />} color="amber" />
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                tab === t ? 'border-b-2 border-violet-600 text-violet-700 -mb-px' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'Market Snapshots'  && <TrendingUp size={14} />}
              {t === 'Demand Insights'   && <Search size={14} />}
              {t === 'Market Cards'      && <BarChart2 size={14} />}
              {t}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'Market Snapshots' && <SnapshotsTab />}
          {tab === 'Demand Insights'  && <DemandTab />}
          {tab === 'Market Cards'     && <MarketCardsTab />}
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-800">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">About Market Snapshots</p>
          <p>Snapshots are computed from active property listings. Refresh individual cities or use &quot;Refresh All&quot; to update data. High-confidence snapshots require at least 10 listings with valid pricing. Snapshots auto-refresh nightly via cron.</p>
        </div>
      </div>
    </div>
  );
}
