'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { MapPin, ExternalLink, Pencil, UserCheck, UserX, CheckCircle2, XCircle, Clock, Image as ImageIcon, BadgeCheck } from 'lucide-react';
import { resolveImageSrc } from '@/components/common/OptimizedImage';

const TICK_BADGE: Record<string, { label: string; cls: string }> = {
  verified: { label: '✓ Verified', cls: 'bg-blue-100 text-blue-700'     },
  bronze:   { label: '◉ Bronze',   cls: 'bg-orange-100 text-orange-700' },
  silver:   { label: '◈ Silver',   cls: 'bg-slate-100 text-slate-600'   },
  gold:     { label: '★ Gold',     cls: 'bg-amber-100 text-amber-700'   },
};

function agentSlug(agent: any): string {
  const name = agent.name?.toLowerCase().replace(/\s+/g, '-') ?? 'agent';
  const city = (agent.city || 'india').toLowerCase().replace(/\s+/g, '-');
  const uid  = agent.id?.replace(/-/g, '') ?? '';
  return `${name}-in-${city}-${uid}`;
}

type TabType = 'all' | 'pending-images' | 'pending-professional';

export default function AdminAgentsPage() {
  const [tab, setTab] = useState<TabType>('all');

  // All agents tab state
  const [agents, setAgents]       = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [quotaModal, setQuotaModal] = useState<{ id: string; current: number } | null>(null);
  const [newQuota, setNewQuota]   = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pending images tab state
  const [pendingAgents, setPendingAgents]   = useState<any[]>([]);
  const [pendingTotal, setPendingTotal]     = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Pending professional tab state
  const [pendingProfAgents, setPendingProfAgents]   = useState<any[]>([]);
  const [pendingProfTotal, setPendingProfTotal]     = useState(0);
  const [pendingProfLoading, setPendingProfLoading] = useState(false);

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

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const r = await adminApi.getPendingAvatarAgents({ page: 1, limit: 50 });
      setPendingAgents(r.data.items ?? []);
      setPendingTotal(r.data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadPendingProf = useCallback(async () => {
    setPendingProfLoading(true);
    try {
      const r = await adminApi.getPendingProfessionalAgents({ page: 1, limit: 50 });
      setPendingProfAgents(r.data.items ?? []);
      setPendingProfTotal(r.data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setPendingProfLoading(false);
    }
  }, []);

  useEffect(() => { load(); loadPending(); loadPendingProf(); }, [load, loadPending, loadPendingProf]);

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

  async function handleApproveAvatar(id: string) {
    setActionLoading(id);
    try {
      await adminApi.approveAgentAvatar(id);
      loadPending();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectAvatar(id: string) {
    setActionLoading(id);
    try {
      await adminApi.rejectAgentAvatar(id);
      loadPending();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveProfessional(id: string) {
    setActionLoading(id);
    try {
      await adminApi.approveProfessionalDetails(id);
      loadPendingProf();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  }

  async function handleRejectProfessional(id: string) {
    setActionLoading(id);
    try {
      await adminApi.rejectProfessionalDetails(id);
      loadPendingProf();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
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

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Agents
        </button>
        <button
          onClick={() => setTab('pending-images')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'pending-images' ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Pending Images
          {pendingTotal > 0 && (
            <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
              tab === 'pending-images' ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
            }`}>
              {pendingTotal}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('pending-professional')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'pending-professional' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          Pending Professional
          {pendingProfTotal > 0 && (
            <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
              tab === 'pending-professional' ? 'bg-white text-violet-600' : 'bg-violet-500 text-white'
            }`}>
              {pendingProfTotal}
            </span>
          )}
        </button>
      </div>

      {/* Pending Images Tab */}
      {tab === 'pending-images' && (
        <div>
          {pendingLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : pendingAgents.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No pending agent images to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Current avatar */}
                      <div className="flex-shrink-0 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">Current</p>
                        {agent.avatar ? (
                          <img src={resolveImageSrc(agent.avatar)} alt={agent.name} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs">None</div>
                        )}
                      </div>
                      {/* Arrow */}
                      <div className="text-gray-400 text-xl">→</div>
                      {/* Pending avatar */}
                      <div className="flex-shrink-0 text-center">
                        <p className="text-[10px] text-orange-500 mb-1 font-medium">Pending</p>
                        <img src={resolveImageSrc(agent.pendingAvatar)} alt="Pending" className="w-14 h-14 rounded-xl object-cover border-2 border-orange-300" />
                      </div>
                      {/* Agent info */}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                        {agent.city && <p className="text-xs text-gray-400">{agent.city}{agent.state ? `, ${agent.state}` : ''}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveAvatar(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoading === agent.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectAvatar(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Professional Tab */}
      {tab === 'pending-professional' && (
        <div>
          {pendingProfLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : pendingProfAgents.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No pending professional details to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProfAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-xl border border-violet-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      {agent.avatar ? (
                        <img src={resolveImageSrc(agent.avatar)} alt={agent.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {agent.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                        {agent.company && <p className="text-xs text-gray-400 mt-0.5">{agent.company}</p>}
                        <div className="mt-2 space-y-1">
                          {agent.agentLicense && (
                            <p className="text-xs text-gray-700"><span className="font-medium text-gray-500">RERA/License:</span> {agent.agentLicense}</p>
                          )}
                          {agent.agentExperience > 0 && (
                            <p className="text-xs text-gray-700"><span className="font-medium text-gray-500">Experience:</span> {agent.agentExperience} yrs</p>
                          )}
                          {agent.agentBio && (
                            <p className="text-xs text-gray-600 mt-1 max-w-md line-clamp-3">{agent.agentBio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveProfessional(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoading === agent.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectProfessional(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Agents Tab */}
      {tab === 'all' && (
        <>
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
                      {['Agent', 'Location', 'Business / RERA', 'Listings Quota', 'Rating', 'Status', 'Actions'].map(h => (
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
                              {agent.avatar ? (
                                <img
                                  src={resolveImageSrc(agent.avatar)}
                                  alt={agent.name}
                                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {agent.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-gray-900">{agent.name}</span>
                                  {tick && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tick.cls}`}>
                                      {tick.label}
                                    </span>
                                  )}
                                  {agent.pendingAvatar && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                                      <Clock className="w-2.5 h-2.5" /> Img Pending
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

                          {/* Business / RERA */}
                          <td className="px-4 py-3">
                            <div className="text-gray-700">{agent.company || '—'}</div>
                            <div className="text-gray-400 text-xs">{agent.agentLicense || 'No RERA'}</div>
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
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {agent.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {agent.agentProfileStatus && agent.agentProfileStatus !== 'none' && (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  agent.agentProfileStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                                  agent.agentProfileStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  Prof: {agent.agentProfileStatus}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/agents/${agent.id}/edit`}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </Link>
                              <Link
                                href={`/agents/${slug}`}
                                target="_blank"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Profile
                              </Link>
                              <button
                                onClick={() => toggleStatus(agent.id)}
                                disabled={actionLoading === agent.id}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                                  agent.isActive
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                {agent.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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
        </>
      )}

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
