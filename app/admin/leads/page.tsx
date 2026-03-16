'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Target, Search, Copy, Check, UserCheck, ExternalLink,
  Flame, Thermometer, Snowflake, TrendingUp, Users,
  MapPin, IndianRupee, RefreshCw, Filter, ChevronDown,
  Calendar, Home,
} from 'lucide-react';
import { leadsApi, adminApi } from '@/lib/api';

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  new:                    'bg-blue-100 text-blue-700',
  contacted:              'bg-indigo-100 text-indigo-700',
  follow_up:              'bg-yellow-100 text-yellow-700',
  site_visit_scheduled:   'bg-purple-100 text-purple-700',
  site_visit_completed:   'bg-cyan-100 text-cyan-700',
  negotiation:            'bg-orange-100 text-orange-700',
  deal_in_progress:       'bg-pink-100 text-pink-700',
  deal_won:               'bg-green-100 text-green-700',
  deal_lost:              'bg-red-100 text-red-600',
};

const TEMP_BADGE: Record<string, { cls: string; icon: React.ReactNode }> = {
  hot:  { cls: 'bg-red-100 text-red-600',    icon: <Flame        className="w-3 h-3" /> },
  warm: { cls: 'bg-orange-100 text-orange-600', icon: <Thermometer  className="w-3 h-3" /> },
  cold: { cls: 'bg-blue-100 text-blue-600',  icon: <Snowflake    className="w-3 h-3" /> },
};

const SOURCE_LABEL: Record<string, string> = {
  find_property:   'Find Property Form',
  seo_form:        'SEO Form',
  property_page:   'Property Page',
  view_phone:      'View Phone',
  schedule_visit:  'Schedule Visit',
  contact_form:    'Contact Form',
  search:          'Search',
  whatsapp:        'WhatsApp',
  call:            'Call',
  manual:          'Manual',
  campaign:        'Campaign',
};

function fmt(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(v % 10_000_000 === 0 ? 0 : 1)} Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(v % 100_000 === 0 ? 0 : 1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLeadsPage() {
  // ── Data ──
  const [leads,   setLeads]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState<any>(null);

  // ── Filters ──
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterTemp,     setFilterTemp]     = useState('');
  const [filterType,     setFilterType]     = useState('');
  const [filterFor,      setFilterFor]      = useState('');
  const [filterSource,   setFilterSource]   = useState('');
  const [filterCity,     setFilterCity]     = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [search,         setSearch]         = useState('');
  const [showFilters,    setShowFilters]    = useState(false);

  // ── Assign modal ──
  const [assignModal,  setAssignModal]  = useState<any>(null);
  const [agentId,      setAgentId]      = useState('');
  const [assigning,    setAssigning]    = useState(false);
  const [agents,       setAgents]       = useState<any[]>([]);
  const [agentSearch,  setAgentSearch]  = useState('');
  const [copiedId,     setCopiedId]     = useState<string | null>(null);

  // ── Load leads ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsApi.getAll({
        page, limit: 20,
        status:      filterStatus   || undefined,
        temperature: filterTemp     || undefined,
        propertyType: filterType    || undefined,
        propertyFor:  filterFor     || undefined,
        source:       filterSource  || undefined,
        city:         filterCity    || undefined,
        dateFrom:     filterDateFrom || undefined,
        dateTo:       filterDateTo   || undefined,
        search:       search        || undefined,
      });
      setLeads(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterTemp, filterType, filterFor, filterSource, filterCity, filterDateFrom, filterDateTo, search]);

  // ── Load stats once ──
  useEffect(() => {
    leadsApi.getStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Copy helper ──
  const copyUuid = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Open assign modal ──
  const openAssign = async (lead: any) => {
    setAssignModal(lead);
    setAgentId(lead.assignedAgentId || '');
    setAgentSearch('');
    if (agents.length === 0) {
      try {
        const res = await adminApi.getAgents({ limit: 200 });
        setAgents(res.data?.items || res.data?.data || res.data || []);
      } catch {}
    }
  };

  const filteredAgents = agents.filter(a => {
    const q = agentSearch.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q);
  });

  const doAssign = async () => {
    if (!assignModal || !agentId.trim()) return;
    setAssigning(true);
    try {
      await leadsApi.assign(assignModal.id, { agentId });
      setAssignModal(null); setAgentId(''); setAgentSearch('');
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const resetFilters = () => {
    setFilterStatus(''); setFilterTemp(''); setFilterType('');
    setFilterFor(''); setFilterSource(''); setFilterCity('');
    setFilterDateFrom(''); setFilterDateTo(''); setSearch('');
    setPage(1);
  };

  const hasActiveFilters = !!(filterStatus || filterTemp || filterType || filterFor || filterSource || filterCity || filterDateFrom || filterDateTo || search);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} leads · track, assign & convert</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {[
            {
              label: 'Total Leads',
              value: stats.total,
              icon:  <Target className="w-4 h-4" />,
              color: 'bg-blue-50 border-blue-100 text-blue-700',
              val_color: 'text-blue-900',
            },
            {
              label: 'Hot',
              value: stats.byTemperature?.hot || 0,
              icon:  <Flame className="w-4 h-4" />,
              color: 'bg-red-50 border-red-100 text-red-600',
              val_color: 'text-red-700',
            },
            {
              label: 'Warm',
              value: stats.byTemperature?.warm || 0,
              icon:  <Thermometer className="w-4 h-4" />,
              color: 'bg-orange-50 border-orange-100 text-orange-600',
              val_color: 'text-orange-700',
            },
            {
              label: 'Cold',
              value: stats.byTemperature?.cold || 0,
              icon:  <Snowflake className="w-4 h-4" />,
              color: 'bg-sky-50 border-sky-100 text-sky-600',
              val_color: 'text-sky-700',
            },
            {
              label: 'New',
              value: stats.byStatus?.new || 0,
              icon:  <TrendingUp className="w-4 h-4" />,
              color: 'bg-emerald-50 border-emerald-100 text-emerald-600',
              val_color: 'text-emerald-700',
            },
            {
              label: 'Won',
              value: stats.byStatus?.deal_won || 0,
              icon:  <Users className="w-4 h-4" />,
              color: 'bg-violet-50 border-violet-100 text-violet-600',
              val_color: 'text-violet-700',
            },
          ].map((s, i) => (
            <div key={i} className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
              <span className="flex-shrink-0">{s.icon}</span>
              <div>
                <div className={`text-xl font-bold ${s.val_color}`}>{s.value}</div>
                <div className="text-xs font-medium opacity-80">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + Filter bar ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, phone, email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none text-gray-700"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow Up</option>
              <option value="site_visit_scheduled">Visit Scheduled</option>
              <option value="site_visit_completed">Visit Done</option>
              <option value="negotiation">Negotiation</option>
              <option value="deal_in_progress">Deal In Progress</option>
              <option value="deal_won">Deal Won</option>
              <option value="deal_lost">Deal Lost</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Temperature */}
          <div className="relative">
            <select
              value={filterTemp}
              onChange={e => { setFilterTemp(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none text-gray-700"
            >
              <option value="">All Temps</option>
              <option value="hot">🔥 Hot</option>
              <option value="warm">🌡 Warm</option>
              <option value="cold">❄️ Cold</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-medium transition-colors ${
              hasActiveFilters ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {[filterStatus, filterTemp, filterType, filterFor, filterSource, filterCity, filterDateFrom, filterDateTo].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Clear all
            </button>
          )}
        </div>

        {/* Advanced filter row */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">

            {/* Property Type */}
            <div className="relative">
              <Home className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none text-gray-700"
              >
                <option value="">All Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="plot">Plot / Land</option>
                <option value="rental">Rental / PG</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Property For */}
            <div className="relative">
              <select
                value={filterFor}
                onChange={e => { setFilterFor(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none text-gray-700"
              >
                <option value="">Buy / Rent / PG</option>
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
                <option value="pg">PG</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Source */}
            <div className="relative">
              <select
                value={filterSource}
                onChange={e => { setFilterSource(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none text-gray-700"
              >
                <option value="">All Sources</option>
                <option value="find_property">Find Property Form</option>
                <option value="seo_form">SEO Form</option>
                <option value="property_page">Property Page</option>
                <option value="view_phone">View Phone</option>
                <option value="contact_form">Contact Form</option>
                <option value="schedule_visit">Schedule Visit</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="call">Call</option>
                <option value="manual">Manual</option>
                <option value="campaign">Campaign</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* City search */}
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="City…"
                value={filterCity}
                onChange={e => { setFilterCity(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 w-36 text-gray-700"
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
              />
            </div>

            {/* Date To */}
            <input
              type="date"
              value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
            />
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No leads found</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="mt-3 text-sm text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Contact', 'Property Need', 'Budget', 'Location', 'Source', 'Status', 'Temp', 'Agent', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/70 transition-colors">

                    {/* Contact */}
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="font-semibold text-gray-900 text-xs">{l.contactName}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{l.contactPhone}</div>
                      {l.userType && (
                        <span className="text-[10px] font-semibold capitalize text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                          {l.userType}
                        </span>
                      )}
                    </td>

                    {/* Property Need */}
                    <td className="px-4 py-3 min-w-[130px]">
                      {l.propertyType && (
                        <div className="text-xs font-semibold text-gray-700 capitalize">{l.propertyType}</div>
                      )}
                      {l.propertyFor && (
                        <span className="text-[10px] font-bold uppercase text-white bg-primary-500 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                          {l.propertyFor}
                        </span>
                      )}
                      {!l.propertyType && !l.propertyFor && <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3 min-w-[120px]">
                      {l.budgetMin || l.budgetMax ? (
                        <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold">
                          <IndianRupee className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span>
                            {l.budgetMin ? fmt(Number(l.budgetMin)) : '—'}
                            {l.budgetMax ? ` – ${fmt(Number(l.budgetMax))}` : '+'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                      {(l.areaMin || l.areaMax) && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {l.areaMin || '?'}–{l.areaMax || '?'} {l.areaUnit || 'sqft'}
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 min-w-[120px]">
                      {l.city ? (
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-gray-700">{l.city}</div>
                            {l.locality && <div className="text-[10px] text-gray-500">{l.locality}</div>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {SOURCE_LABEL[l.source] || l.source?.replace(/_/g, ' ') || '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-600'}`}>
                        {l.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Temp */}
                    <td className="px-4 py-3">
                      {TEMP_BADGE[l.temperature] ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TEMP_BADGE[l.temperature].cls}`}>
                          {TEMP_BADGE[l.temperature].icon}
                          {l.temperature}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Agent */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {l.assignedAgentId ? (
                        <button
                          type="button"
                          onClick={() => copyUuid(l.assignedAgentId)}
                          title={l.assignedAgentId}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
                        >
                          <span className="font-mono">{l.assignedAgentId.slice(0, 8)}…</span>
                          {copiedId === l.assignedAgentId
                            ? <Check className="w-3 h-3 text-green-500" />
                            : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                        </button>
                      ) : (
                        <span className="text-red-400 font-medium text-[10px]">Unassigned</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAssign(l)}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          Assign
                        </button>
                        <Link
                          href={`/admin/leads/${l.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Assign Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Assign Lead to Agent</h3>
              <p className="text-xs text-gray-500 mt-0.5">{assignModal.contactName} — {assignModal.contactPhone}</p>
              {(assignModal.city || assignModal.propertyType) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignModal.city && <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{assignModal.city}{assignModal.locality ? `, ${assignModal.locality}` : ''}</span>}
                  {assignModal.propertyType && <span className="text-[11px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">{assignModal.propertyType}</span>}
                  {assignModal.budgetMin && <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{fmt(Number(assignModal.budgetMin))} – {assignModal.budgetMax ? fmt(Number(assignModal.budgetMax)) : 'Max'}</span>}
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-hidden">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Agent UUID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agentId}
                    onChange={e => setAgentId(e.target.value)}
                    placeholder="Select below or paste UUID…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  />
                  {agentId && (
                    <button type="button" onClick={() => copyUuid(agentId)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                      {copiedId === agentId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 min-h-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents by name, email, phone…"
                    value={agentSearch}
                    onChange={e => setAgentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  />
                </div>
                <div className="overflow-y-auto max-h-56 rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {filteredAgents.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400">
                      <UserCheck className="w-6 h-6 mx-auto mb-1 text-gray-300" />No agents found
                    </div>
                  ) : filteredAgents.map(a => (
                    <div
                      key={a.id}
                      onClick={() => setAgentId(a.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${agentId === a.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {a.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{a.name}</div>
                        <div className="text-xs text-gray-400 truncate">{a.email || a.phone}</div>
                        <div className="text-[10px] text-gray-300 font-mono mt-0.5 truncate">{a.id}</div>
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); copyUuid(a.id); }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 flex-shrink-0 transition-colors">
                        {copiedId === a.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {agentId === a.id && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={doAssign}
                disabled={assigning || !agentId.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {assigning ? 'Assigning…' : 'Assign Lead'}
              </button>
              <button
                onClick={() => { setAssignModal(null); setAgentId(''); setAgentSearch(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
