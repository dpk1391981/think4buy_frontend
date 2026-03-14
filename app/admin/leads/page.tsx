'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Target, Search, Copy, Check, UserCheck, ExternalLink } from 'lucide-react';
import { leadsApi, adminApi } from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-indigo-100 text-indigo-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  site_visit_scheduled: 'bg-purple-100 text-purple-700',
  site_visit_completed: 'bg-cyan-100 text-cyan-700',
  negotiation: 'bg-orange-100 text-orange-700',
  deal_in_progress: 'bg-pink-100 text-pink-700',
  deal_won: 'bg-green-100 text-green-700',
  deal_lost: 'bg-red-100 text-red-600',
};

const TEMP_BADGE: Record<string, string> = {
  hot: 'bg-red-100 text-red-600',
  warm: 'bg-orange-100 text-orange-600',
  cold: 'bg-blue-100 text-blue-600',
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemp, setFilterTemp] = useState('');
  const [search, setSearch] = useState('');

  const [assignModal, setAssignModal] = useState<any>(null);
  const [agentId, setAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsApi.getAll({
        page, limit: 20,
        status: filterStatus || undefined,
        temperature: filterTemp || undefined,
        search: search || undefined,
      });
      setLeads(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterTemp, search]);

  useEffect(() => { load(); }, [load]);

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

  const copyUuid = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredAgents = agents.filter((a) => {
    const q = agentSearch.toLowerCase();
    return !q || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q) || a.id?.includes(q);
  });

  const doAssign = async () => {
    if (!assignModal || !agentId.trim()) return;
    setAssigning(true);
    try {
      await leadsApi.assign(assignModal.id, { agentId });
      setAssignModal(null);
      setAgentId('');
      setAgentSearch('');
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} leads in the system</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="follow_up">Follow Up</option>
          <option value="site_visit_scheduled">Visit Scheduled</option>
          <option value="negotiation">Negotiation</option>
          <option value="deal_won">Deal Won</option>
          <option value="deal_lost">Deal Lost</option>
        </select>
        <select
          value={filterTemp}
          onChange={(e) => { setFilterTemp(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Temps</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">🌡 Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No leads found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Contact', 'Source', 'Status', 'Temp', 'Score', 'Agent', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 text-xs">{l.contactName}</div>
                    <div className="text-gray-500 text-xs">{l.contactPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 capitalize">{l.source?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[l.status] || 'bg-gray-100 text-gray-600'}`}>
                      {l.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TEMP_BADGE[l.temperature] || ''}`}>
                      {l.temperature}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">{l.leadScore}</td>
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
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openAssign(l)}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100"
                      >
                        Assign
                      </button>
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View activity log"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Assign Lead to Agent</h3>
              <p className="text-xs text-gray-500 mt-0.5">{assignModal.contactName} — {assignModal.contactPhone}</p>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-hidden">
              {/* Manual UUID input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Agent UUID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Select below or paste UUID..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {agentId && (
                    <button
                      type="button"
                      onClick={() => copyUuid(agentId)}
                      title="Copy UUID"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                      {copiedId === agentId
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Agent list */}
              <div className="flex flex-col gap-2 min-h-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents by name, email, phone..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="overflow-y-auto max-h-56 rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {filteredAgents.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400">
                      <UserCheck className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                      No agents found
                    </div>
                  ) : filteredAgents.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setAgentId(a.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${agentId === a.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {a.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{a.name}</div>
                        <div className="text-xs text-gray-400 truncate">{a.email || a.phone}</div>
                        <div className="text-[10px] text-gray-300 font-mono mt-0.5 truncate">{a.id}</div>
                      </div>

                      {/* Copy UUID button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyUuid(a.id); }}
                        title="Copy UUID"
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 flex-shrink-0 transition-colors"
                      >
                        {copiedId === a.id
                          ? <Check className="w-3.5 h-3.5 text-green-500" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {agentId === a.id && (
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={doAssign}
                disabled={assigning || !agentId.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {assigning ? 'Assigning...' : 'Assign Lead'}
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
