'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [quotaModal, setQuotaModal] = useState<{ id: string; current: number } | null>(null);
  const [newQuota, setNewQuota] = useState('');
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
    try {
      await adminApi.toggleAgentStatus(id);
      load();
    } finally { setActionLoading(null); }
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 text-sm mt-1">{total} registered agents</p>
        </div>
        <Link
          href="/admin/agents/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Agent
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <input
          type="text"
          placeholder="Search by name, email, company..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No agents found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Agent', 'Company / License', 'Listings Quota', 'Rating', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.map((agent) => {
                const pct = quotaPercent(agent.agentUsedQuota, agent.agentFreeQuota);
                return (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="text-gray-400 text-xs">{agent.email}</div>
                      {agent.phone && <div className="text-gray-400 text-xs">{agent.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{agent.company || '—'}</div>
                      <div className="text-gray-400 text-xs">{agent.agentLicense || 'No license'}</div>
                      {agent.agentExperience && (
                        <div className="text-gray-400 text-xs">{agent.agentExperience} yrs exp</div>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-36">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          {agent.agentUsedQuota} / {agent.agentFreeQuota} free
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
                        <div className="text-xs text-red-600 mt-0.5 font-medium">Quota exhausted — paid required</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {agent.agentRating ? (
                        <span className="text-yellow-600 font-medium">★ {agent.agentRating}</span>
                      ) : '—'}
                      {agent.totalDeals > 0 && (
                        <div className="text-xs text-gray-400">{agent.totalDeals} deals</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(agent.id)}
                        disabled={actionLoading === agent.id}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                          agent.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {agent.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
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
              onChange={(e) => setNewQuota(e.target.value)}
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
