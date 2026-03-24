'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, RefreshCw, Filter, ChevronDown,
  Calendar, Download, MessageSquare, Phone,
  MapPin, Tag, CheckCircle, Clock, XCircle,
  TrendingUp, Users, Inbox,
} from 'lucide-react';
import { serviceLeadsApi, servicesApi } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  new:       { label: 'New',       cls: 'bg-blue-100 text-blue-700',   icon: <Inbox       className="w-3 h-3" /> },
  contacted: { label: 'Contacted', cls: 'bg-yellow-100 text-yellow-700', icon: <Phone      className="w-3 h-3" /> },
  closed:    { label: 'Closed',    cls: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCSV(leads: any[]) {
  const headers = ['Name', 'Phone', 'Email', 'Service', 'Location', 'Interest', 'Message', 'Source', 'Status', 'Date'];
  const rows = leads.map(l => [
    l.name, l.phone, l.email || '', l.service?.name || l.serviceId,
    l.location || '', l.interest || '', (l.message || '').replace(/,/g, ' '),
    l.source || '', l.status, fmtDate(l.createdAt),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = `service-leads-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminServiceLeadsPage() {
  const [leads,   setLeads]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  // Filters
  const [filterService,  setFilterService]  = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');
  const [search,         setSearch]         = useState('');
  const [searchInput,    setSearchInput]    = useState('');

  const limit = 25;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ── Fetch services for filter dropdown ──
  useEffect(() => {
    servicesApi.getAll()
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setServices(list);
      })
      .catch(() => {});
  }, []);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const r = await serviceLeadsApi.getStats();
      setStats(r.data);
    } catch {}
  }, []);

  // ── Fetch leads ──
  const fetchLeads = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const r = await serviceLeadsApi.getAll({
        ...(filterService  && { serviceId: filterService }),
        ...(filterStatus   && { status:    filterStatus }),
        ...(filterLocation && { location:  filterLocation }),
        ...(filterDateFrom && { from:      filterDateFrom }),
        ...(filterDateTo   && { to:        filterDateTo }),
        ...(search         && { search }),
        page: p,
        limit,
      });
      const d = r.data;
      setLeads(Array.isArray(d) ? d : d?.data ?? []);
      setTotal(d?.total ?? (Array.isArray(d) ? d.length : 0));
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filterService, filterStatus, filterLocation, filterDateFrom, filterDateTo, search, page, limit]);

  useEffect(() => { fetchLeads(1); setPage(1); }, [filterService, filterStatus, filterLocation, filterDateFrom, filterDateTo, search]);
  useEffect(() => { fetchLeads(page); }, [page]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearch = () => { setSearch(searchInput); };

  // ── Status update ──
  const updateStatus = async (id: string, status: string) => {
    try {
      await serviceLeadsApi.update(id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      fetchStats();
    } catch {}
  };

  // ── Export all (fetches without pagination) ──
  const handleExport = async () => {
    try {
      const r = await serviceLeadsApi.getAll({
        ...(filterService  && { serviceId: filterService }),
        ...(filterStatus   && { status:    filterStatus }),
        ...(filterLocation && { location:  filterLocation }),
        ...(filterDateFrom && { from:      filterDateFrom }),
        ...(filterDateTo   && { to:        filterDateTo }),
        ...(search         && { search }),
        page: 1,
        limit: 10000,
      });
      const d = r.data;
      const all = Array.isArray(d) ? d : d?.data ?? [];
      exportCSV(all);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">Enquiries from Home Loan, Legal, Interior Design and other services</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchLeads(page); fetchStats(); }}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',     value: stats.total     ?? 0, icon: <Users       className="w-5 h-5 text-blue-500" />,   bg: 'bg-blue-50'   },
            { label: 'New',       value: stats.new       ?? 0, icon: <Inbox       className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
            { label: 'Contacted', value: stats.contacted ?? 0, icon: <Phone       className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
            { label: 'Closed',    value: stats.closed    ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-500" />,  bg: 'bg-green-50'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
              <div className="p-2 bg-white rounded-xl shadow-sm">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search name or phone…"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Service filter */}
          <div className="relative">
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
            >
              <option value="">All Services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Location */}
          <input
            type="text"
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            placeholder="Filter by city…"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 w-36"
          />

          {/* Date range */}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="px-2 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 w-36"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="px-2 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 w-36"
            />
          </div>

          {/* Clear filters */}
          {(filterService || filterStatus || filterLocation || filterDateFrom || filterDateTo || search) && (
            <button
              onClick={() => {
                setFilterService(''); setFilterStatus(''); setFilterLocation('');
                setFilterDateFrom(''); setFilterDateTo('');
                setSearch(''); setSearchInput('');
              }}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No leads found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name / Phone', 'Service', 'Location', 'Interest', 'Message', 'Source', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    {/* Name / Phone */}
                    <td className="px-4 py-3 min-w-[160px]">
                      <p className="font-semibold text-gray-900">{lead.name}</p>
                      <a href={`tel:+91${lead.phone}`} className="text-xs text-primary-600 hover:underline flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </a>
                      {lead.email && <p className="text-xs text-gray-400 truncate max-w-[160px]">{lead.email}</p>}
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-1 rounded-lg">
                        <Tag className="w-3 h-3" />
                        {lead.service?.name ?? '—'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      {lead.location
                        ? <span className="flex items-center gap-1 text-xs text-gray-600"><MapPin className="w-3 h-3" />{lead.location}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Interest */}
                    <td className="px-4 py-3">
                      {lead.interest
                        ? <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{lead.interest}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Message */}
                    <td className="px-4 py-3 max-w-[200px]">
                      {lead.message
                        ? <p className="text-xs text-gray-600 line-clamp-2">{lead.message}</p>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-500 capitalize">{lead.source || '—'}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={lead.status} />
                        <div className="relative">
                          <select
                            value={lead.status}
                            onChange={e => updateStatus(lead.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {fmtDate(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} leads
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${p === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
