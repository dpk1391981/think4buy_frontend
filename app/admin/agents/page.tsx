'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { MapPin, ExternalLink, Pencil, UserCheck, UserX } from 'lucide-react';

const TICK_BADGE: Record<string, { label: string; cls: string }> = {
  blue:    { label: '✓ Verified', cls: 'bg-blue-100 text-blue-700'     },
  gold:    { label: '★ Gold',     cls: 'bg-amber-100 text-amber-700'   },
  diamond: { label: '◆ Diamond',  cls: 'bg-violet-100 text-violet-700' },
};

function agentSlug(agent: any): string {
  const name = agent.name?.toLowerCase().replace(/\s+/g, '-') ?? 'agent';
  const city = (agent.city || 'india').toLowerCase().replace(/\s+/g, '-');
  const uid  = agent.id?.replace(/-/g, '') ?? '';
  return `${name}-in-${city}-${uid}`;
}

export default function AdminAgentsPage() {
  const [agents, setAgents]       = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [quotaModal, setQuotaModal] = useState<{ id: string; current: number } | null>(null);
  const [newQuota, setNewQuota]   = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      const r = await adminApi.getAgents(params);
      setAgents(r.data.items);
      setTotal(r.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(id: string) {
    setActionLoading(id);
    try { await adminApi.toggleAgentStatus(id); load(); }
    finally { setActionLoading(null); }
  }

  async function saveQuota() {
    if (!quotaModal) return;
    setActionLoading(quotaModal.id);
    try {
      await adminApi.updateQuota(quotaModal.id, parseInt(newQuota));
      setQuotaModal(null);
      load();
    } finally { setActionLoading(null); }
  }

  const quotaPercent = (used: number, total: number) =>
    total === 0 ? 0 : Math.min(100, Math.round((used / total) * 100));

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} registered agents</p>
        </div>
        <Link
          href="/admin/agents/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          + Create Agent
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <input
          type="text"
          placeholder="Search by name, email, company..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">🤝</div>
            <p className="text-gray-400 text-sm">No agents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Agent', 'Location', 'Company / RERA', 'Listings Quota', 'Rating', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map(agent => {
                  const pct  = quotaPercent(agent.agentUsedQuota, agent.agentFreeQuota);
                  const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK_BADGE[agent.agentTick] : null;
                  const slug = agentSlug(agent);

                  return (
                    <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                      {/* Agent */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {agent.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900">{agent.name}</span>
                              {tick && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tick.cls}`}>
                                  {tick.label}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400 text-xs">{agent.email}</div>
                            {agent.phone && <div className="text-gray-400 text-xs">{agent.phone}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        {(agent.city || agent.state) ? (
                          <div className="flex items-start gap-1 text-gray-700 text-xs">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              {agent.city && <div className="font-medium">{agent.city}</div>}
                              {agent.state && <div className="text-gray-400">{agent.state}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">— Not set</span>
                        )}
                      </td>

                      {/* Company / RERA */}
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{agent.company || '—'}</div>
                        <div className="text-gray-400 text-xs">{agent.agentLicense || 'No license'}</div>
                        {agent.agentExperience > 0 && (
                          <div className="text-gray-400 text-xs">{agent.agentExperience} yrs exp</div>
                        )}
                      </td>

                      {/* Quota */}
                      <td className="px-4 py-3 min-w-36">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">
                            {agent.agentUsedQuota} / {agent.agentFreeQuota}
                          </span>
                          <button
                            onClick={() => { setQuotaModal({ id: agent.id, current: agent.agentFreeQuota }); setNewQuota(String(agent.agentFreeQuota)); }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {pct >= 100 && (
                          <div className="text-xs text-red-600 mt-0.5 font-medium">Limit reached</div>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        {agent.agentRating ? (
                          <span className="text-amber-600 font-medium text-sm">★ {Number(agent.agentRating).toFixed(1)}</span>
                        ) : <span className="text-gray-300">—</span>}
                        {agent.totalDeals > 0 && (
                          <div className="text-xs text-gray-400">{agent.totalDeals} deals</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <Link
                            href={`/admin/agents/${agent.id}/edit`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            title="Edit agent"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>

                          {/* View profile */}
                          <Link
                            href={`/agent/${slug}`}
                            target="_blank"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="View public profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Profile
                          </Link>

                          {/* Toggle status */}
                          <button
                            onClick={() => toggleStatus(agent.id)}
                            disabled={actionLoading === agent.id}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                              agent.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                            title={agent.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {agent.isActive
                              ? <UserX className="w-3.5 h-3.5" />
                              : <UserCheck className="w-3.5 h-3.5" />
                            }
                            {agent.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quota modal */}
      {quotaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Update Free Listing Quota</h3>
            <p className="text-sm text-gray-500 mb-4">Current: {quotaModal.current} free listings</p>
            <input
              type="number"
              min={0}
              value={newQuota}
              onChange={e => setNewQuota(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={saveQuota}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setQuotaModal(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
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
