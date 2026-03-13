'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { agencyApi } from '@/lib/api';
import { ArrowLeft, Building2, UserCheck, UserX, UserPlus, Trash2, Loader2, Star } from 'lucide-react';

const TICK_BADGE: Record<string, { label: string; cls: string }> = {
  blue:    { label: '✓ Verified', cls: 'bg-blue-100 text-blue-700'     },
  gold:    { label: '★ Gold',     cls: 'bg-amber-100 text-amber-700'   },
  diamond: { label: '◆ Diamond',  cls: 'bg-violet-100 text-violet-700' },
};

export default function AgencyAgentsPage() {
  const { id } = useParams<{ id: string }>();
  const [agency, setAgency] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [unassignConfirm, setUnassignConfirm] = useState<{ id: string; name: string } | null>(null);

  // For assign modal — search unassigned agents
  const [agentSearch, setAgentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [agencyRes, agentsRes] = await Promise.all([
        agencyApi.getAgency(id),
        agencyApi.getAgencyAgents(id, { limit: 50 }),
      ]);
      setAgency(agencyRes.data);
      const items = agentsRes.data?.items ?? agentsRes.data ?? [];
      setAgents(Array.isArray(items) ? items : []);
    } catch {
      setError('Failed to load agency agents');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function searchUnassignedAgents(q: string) {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await agencyApi.adminGetAgentProfiles({ search: q, limit: 10 });
      setSearchResults(r.data?.items ?? r.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAssign(agentProfileId: string) {
    setActionLoading(agentProfileId);
    try {
      await agencyApi.adminAssignAgentToAgency(agentProfileId, id);
      setAssignModal(false);
      setAgentSearch('');
      setSearchResults([]);
      load();
    } catch {
      setError('Failed to assign agent');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnassign(agentProfileId: string) {
    setActionLoading(agentProfileId);
    try {
      await agencyApi.adminAssignAgentToAgency(agentProfileId, null);
      setUnassignConfirm(null);
      load();
    } catch {
      setError('Failed to unassign agent');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/agencies"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {agency?.logo ? (
              <img src={agency.logo} alt={agency.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <Building2 className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Agency Agents</h1>
            <p className="text-gray-500 text-xs truncate">{agency?.name ?? '...'}</p>
          </div>
        </div>
        <button
          onClick={() => { setAssignModal(true); setAgentSearch(''); setSearchResults([]); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Assign Agent
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Agents list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {agents.length === 0 ? (
          <div className="p-16 text-center">
            <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No agents assigned to this agency</p>
            <button
              onClick={() => { setAssignModal(true); setAgentSearch(''); setSearchResults([]); }}
              className="mt-4 text-sm text-blue-600 hover:underline font-medium"
            >
              Assign the first agent →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {agents.map((agent) => {
              const tick = agent.tick && agent.tick !== 'none' ? TICK_BADGE[agent.tick] : null;
              return (
                <div key={agent.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {agent.user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AG'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{agent.user?.name ?? '—'}</span>
                      {tick && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tick.cls}`}>
                          {tick.label}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{agent.user?.email ?? '—'}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {agent.experienceYears > 0 && <span>{agent.experienceYears} yrs exp</span>}
                      {agent.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <Star className="w-3 h-3 fill-current" />
                          {Number(agent.rating).toFixed(1)}
                        </span>
                      )}
                      {agent.totalListings > 0 && <span>{agent.totalListings} listings</span>}
                      {agent.totalDeals > 0 && <span>{agent.totalDeals} deals</span>}
                      {agent.licenseNumber && <span className="font-mono">{agent.licenseNumber}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/agents/${agent.userId}/edit`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setUnassignConfirm({ id: agent.id, name: agent.user?.name ?? 'this agent' })}
                      disabled={actionLoading === agent.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === agent.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Assign Agent to {agency?.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Search for an agent profile to assign</p>
            </div>
            <div className="p-5">
              <input
                type="text"
                placeholder="Search by agent name or email..."
                value={agentSearch}
                onChange={(e) => {
                  setAgentSearch(e.target.value);
                  searchUnassignedAgents(e.target.value);
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent mb-3"
                autoFocus
              />
              {searching ? (
                <div className="py-4 text-center text-gray-400 text-sm">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {searchResults.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900">{agent.user?.name ?? '—'}</div>
                        <div className="text-xs text-gray-500 truncate">{agent.user?.email ?? '—'}</div>
                        {agent.agencyId && (
                          <div className="text-xs text-amber-600">Currently in another agency</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAssign(agent.id)}
                        disabled={actionLoading === agent.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        {actionLoading === agent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : agentSearch.trim() ? (
                <div className="py-4 text-center text-gray-400 text-sm">No agents found</div>
              ) : null}
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => { setAssignModal(false); setSearchResults([]); setAgentSearch(''); }}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Confirm Modal */}
      {unassignConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Remove Agent</h3>
            <p className="text-sm text-gray-500 mb-4">
              Remove <strong>{unassignConfirm.name}</strong> from {agency?.name}? They will no longer be associated with this agency.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleUnassign(unassignConfirm.id)}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Remove
              </button>
              <button
                onClick={() => setUnassignConfirm(null)}
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
