'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, TrendingUp, Flame, Thermometer,
  Snowflake, Target, Users, MapPin, BarChart2, Activity,
  IndianRupee, Calendar, Filter,
} from 'lucide-react';
import { leadsApi } from '@/lib/api';

// ─── Colour palettes ────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500', contacted: 'bg-indigo-500', follow_up: 'bg-yellow-500',
  site_visit_scheduled: 'bg-purple-500', site_visit_completed: 'bg-cyan-500',
  negotiation: 'bg-orange-500', deal_in_progress: 'bg-pink-500',
  deal_won: 'bg-green-500', deal_lost: 'bg-red-500',
  duplicate: 'bg-gray-400', junk: 'bg-gray-300',
};
const SOURCE_COLOR: Record<string, string> = {
  find_property: 'bg-violet-500', seo_form: 'bg-emerald-500',
  property_page: 'bg-blue-500',  view_phone: 'bg-amber-500',
  contact_form: 'bg-indigo-500', schedule_visit: 'bg-pink-500',
  whatsapp: 'bg-green-500', call: 'bg-cyan-500',
  manual: 'bg-gray-400', campaign: 'bg-orange-500',
  chatbot: 'bg-teal-500', walkin: 'bg-rose-500',
};
const SOURCE_LABEL: Record<string, string> = {
  find_property:'Find Property', seo_form:'SEO Form', property_page:'Property Page',
  view_phone:'View Phone', contact_form:'Contact Form', schedule_visit:'Schedule Visit',
  whatsapp:'WhatsApp', call:'Call', manual:'Manual', campaign:'Campaign',
  chatbot:'Chatbot', walkin:'Walk-in', property_alert:'Alert',
};
const TYPE_COLOR = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-orange-500','bg-pink-500'];

// ─── Small chart helpers ─────────────────────────────────────────────────────

function BarRow({ label, value, max, color, pct }: { label: string; value: number; max: number; color: string; pct?: number }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 group">
      <div className="w-28 text-xs text-gray-600 truncate flex-shrink-0">{label}</div>
      <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
        <div className={`h-full ${color} rounded-md transition-all duration-500`} style={{ width: `${width}%` }} />
      </div>
      <div className="w-12 text-right text-xs font-semibold text-gray-700 flex-shrink-0">{value.toLocaleString()}</div>
      {pct !== undefined && (
        <div className="w-10 text-right text-[10px] text-gray-400 flex-shrink-0">{pct}%</div>
      )}
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const last7 = data.slice(-7);
  return (
    <div className="flex items-end gap-1 h-24 mt-3">
      {data.map((d, i) => {
        const h = Math.round((d.count / max) * 96);
        const isRecent = data.length - i <= 7;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${d.date}: ${d.count}`}>
            <div
              className={`w-full rounded-t-sm transition-all ${isRecent ? 'bg-blue-500' : 'bg-blue-200'}`}
              style={{ height: `${Math.max(h, 2)}px` }}
            />
            {data.length <= 14 && (
              <div className="text-[9px] text-gray-400 rotate-45 origin-left translate-y-1">
                {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelStage({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-gray-600 capitalize">{label.replace(/_/g, ' ')}</div>
      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
        <div className={`h-full ${color} rounded-lg transition-all duration-500`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-semibold text-white mix-blend-difference">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="w-10 text-right text-xs text-gray-400">{pct}%</div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function LeadAnalyticsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom,setDateFrom]= useState('');
  const [dateTo,  setDateTo]  = useState('');
  const [city,    setCity]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsApi.getAnalytics({
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo   || undefined,
        city:     city     || undefined,
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, city]);

  useEffect(() => { load(); }, [load]);

  // ── Derived ──
  const topStatuses = data
    ? Object.entries(data.byStatus as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
    : [];
  const topSources = data
    ? Object.entries(data.bySource as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
    : [];
  const topCities = data
    ? Object.entries(data.byCity as Record<string, number>)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
    : [];
  const topTypes = data
    ? Object.entries(data.byPropertyType as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
    : [];

  const funnelOrder = [
    'new','contacted','follow_up','site_visit_scheduled','site_visit_completed',
    'negotiation','deal_in_progress','deal_won','deal_lost',
  ];

  const maxSource = topSources.length > 0 ? topSources[0][1] as number : 1;
  const maxCity   = topCities.length  > 0 ? topCities[0][1]  as number : 1;
  const maxAgent  = data?.agentPerformance?.length > 0 ? data.agentPerformance[0].total : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/leads" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Pipeline insights, source performance &amp; agent metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 text-gray-700" />
        </div>
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 text-gray-700" />
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="City filter…" value={city} onChange={e => setCity(e.target.value)}
            className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 w-36 text-gray-700" />
        </div>
        {(dateFrom || dateTo || city) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setCity(''); }}
            className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-gray-400">Failed to load analytics</div>
      ) : (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Leads',    value: data.total,                             icon: <Target className="w-5 h-5" />,      color: 'from-blue-500 to-blue-600',    bg: 'bg-blue-50' },
              { label: 'Today',          value: data.today,                             icon: <Calendar className="w-5 h-5" />,     color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Hot Leads',      value: data.byTemperature?.hot || 0,           icon: <Flame className="w-5 h-5" />,        color: 'from-red-500 to-red-600',      bg: 'bg-red-50' },
              { label: 'Deal Won',       value: data.byStatus?.deal_won || 0,           icon: <TrendingUp className="w-5 h-5" />,   color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50' },
            ].map((kpi, i) => (
              <div key={i} className={`${kpi.bg} rounded-2xl p-5`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} text-white flex items-center justify-center mb-3`}>
                  {kpi.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpi.value?.toLocaleString()}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* ── Daily Trend ── */}
          {data.dailyTrend?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800">Daily Lead Trend (Last 30 Days)</h3>
              </div>
              <p className="text-xs text-gray-400 mb-2">Total leads per day</p>
              <DailyChart data={data.dailyTrend} />
            </div>
          )}

          {/* ── Temperature Cards ── */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { key: 'hot',  label: 'Hot Leads',  icon: <Flame className="w-4 h-4" />,       cls: 'bg-red-50 border-red-100', badge: 'text-red-700' },
              { key: 'warm', label: 'Warm Leads', icon: <Thermometer className="w-4 h-4" />,  cls: 'bg-orange-50 border-orange-100', badge: 'text-orange-700' },
              { key: 'cold', label: 'Cold Leads', icon: <Snowflake className="w-4 h-4" />,    cls: 'bg-blue-50 border-blue-100', badge: 'text-blue-700' },
            ].map(t => {
              const v = data.byTemperature?.[t.key] || 0;
              const pct = data.total > 0 ? Math.round((v / data.total) * 100) : 0;
              return (
                <div key={t.key} className={`rounded-2xl border p-4 ${t.cls}`}>
                  <div className={`flex items-center gap-2 mb-2 ${t.badge}`}>
                    {t.icon}
                    <span className="text-xs font-bold">{t.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{v.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{pct}% of total</div>
                </div>
              );
            })}
          </div>

          {/* ── 3-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

            {/* Pipeline Funnel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-bold text-gray-800">Pipeline Funnel</h3>
              </div>
              <div className="space-y-2">
                {funnelOrder.map(s => {
                  const v = data.byStatus?.[s] || 0;
                  if (v === 0) return null;
                  return (
                    <FunnelStage
                      key={s}
                      label={s}
                      value={v}
                      total={data.total}
                      color={STATUS_COLOR[s] || 'bg-gray-400'}
                    />
                  );
                })}
              </div>
            </div>

            {/* Lead Sources */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-gray-800">Lead Sources</h3>
              </div>
              <div className="space-y-2.5">
                {topSources.map(([src, count], i) => (
                  <BarRow
                    key={src}
                    label={SOURCE_LABEL[src] || src.replace(/_/g, ' ')}
                    value={count as number}
                    max={maxSource as number}
                    color={SOURCE_COLOR[src] || 'bg-gray-400'}
                    pct={data.total > 0 ? Math.round(((count as number) / data.total) * 100) : 0}
                  />
                ))}
              </div>
            </div>

            {/* Property Types */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-gray-800">Property Types</h3>
              </div>
              {topTypes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data</p>
              ) : (
                <div className="space-y-2.5">
                  {topTypes.map(([type, count], i) => (
                    <BarRow
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      value={count as number}
                      max={(topTypes[0][1] as number) || 1}
                      color={TYPE_COLOR[i % TYPE_COLOR.length]}
                      pct={data.total > 0 ? Math.round(((count as number) / data.total) * 100) : 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Top Cities ── */}
          {topCities.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800">Top Cities by Leads</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {topCities.map(([city, count], i) => (
                  <BarRow
                    key={city}
                    label={city}
                    value={count as number}
                    max={maxCity as number}
                    color={i === 0 ? 'bg-blue-600' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-blue-400' : 'bg-blue-300'}
                    pct={data.total > 0 ? Math.round(((count as number) / data.total) * 100) : 0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Agent Performance Table ── */}
          {data.agentPerformance?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-bold text-gray-800">Top Agent Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 rounded-xl">
                    <tr>
                      {['#', 'Agent', 'Total Leads', 'New', 'Won', 'Lost', 'Conversion', 'Load'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.agentPerformance.map((a: any, i: number) => (
                      <tr key={a.agentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/agents/${a.agentSlug}`} target="_blank"
                            className="group flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {a.agentName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                              {a.agentName}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{a.total}</td>
                        <td className="px-4 py-3 text-blue-700 font-medium">{a.newCount}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">{a.won}</td>
                        <td className="px-4 py-3 text-red-500">{a.lost}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${a.conversionRate >= 20 ? 'bg-green-500' : a.conversionRate >= 10 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(a.conversionRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{a.conversionRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${Math.min(Math.round((a.total / maxAgent) * 100), 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400">{a.total}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
