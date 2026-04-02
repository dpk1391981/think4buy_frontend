'use client';

import { useEffect, useState } from 'react';
import { agencyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, UserPlus, Crown, Shield, User, Loader2,
  Trash2, ChevronDown, CheckCircle2, Clock, X, AlertCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'manager' | 'member';
  status: 'invited' | 'active' | 'removed' | 'declined';
  isPrimaryOwner: boolean;
  inviteExpiresAt?: string;
  joinedAt?: string;
  createdAt: string;
  // user info (if backend joins)
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userAvatar?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; icon: any; cls: string }> = {
  owner:   { label: 'Owner',   icon: Crown,  cls: 'bg-amber-100 text-amber-700'  },
  manager: { label: 'Manager', icon: Shield, cls: 'bg-blue-100 text-blue-700'    },
  member:  { label: 'Member',  icon: User,   cls: 'bg-gray-100 text-gray-600'    },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:   { label: 'Active',   cls: 'bg-green-100 text-green-700'  },
  invited:  { label: 'Invited',  cls: 'bg-yellow-100 text-yellow-700' },
  removed:  { label: 'Removed',  cls: 'bg-red-100 text-red-600'      },
  declined: { label: 'Declined', cls: 'bg-gray-100 text-gray-500'    },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Invite state
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole,  setInviteRole]  = useState<'manager' | 'member'>('member');
  const [inviting,    setInviting]    = useState(false);

  // Remove state
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removing,     setRemoving]    = useState(false);

  // Role-change
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    try {
      const r = await agencyApi.getMyMembers();
      setMembers(r.data || []);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleInvite() {
    if (!inviteUserId.trim()) { showToast('error', 'Enter a User ID'); return; }
    setInviting(true);
    try {
      await agencyApi.inviteMember(inviteUserId.trim(), inviteRole);
      showToast('success', 'Invite sent!');
      setInviteUserId('');
      setInviteOpen(false);
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(member: Member, newRole: 'manager' | 'member') {
    setActionLoading(member.userId);
    try {
      await agencyApi.updateMemberRole(member.userId, newRole);
      showToast('success', 'Role updated');
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await agencyApi.removeMember(removeTarget.userId, removeReason || undefined);
      showToast('success', 'Member removed');
      setRemoveTarget(null);
      setRemoveReason('');
      load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  }

  const isPremiumUser = (user as any)?.agentTick && (user as any).agentTick !== 'none';
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'invited');

  if (loading) {
    return (
      <div className="p-6 space-y-3 max-w-2xl">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Agency Members
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
            {pendingMembers.length > 0 && ` · ${pendingMembers.length} pending invite${pendingMembers.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isPremiumUser && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Premium gate banner */}
      {!isPremiumUser && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Premium Feature</p>
            <p className="text-xs mt-0.5">Upgrade to a verified badge plan to add team members to your agency and assign them leads.</p>
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">No members yet</p>
          <p className="text-gray-400 text-xs mt-1">Invite agents to join your agency and assign them leads.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {members.map(member => {
              const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
              const sc = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
              const RoleIcon = rc.icon;
              const isMe = member.userId === user?.id;

              return (
                <li key={member.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Avatar initials */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {member.userName
                      ? member.userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                      : <User className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {member.userName || member.userId}
                      </span>
                      {isMe && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">You</span>}
                      {member.isPrimaryOwner && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Founder</span>}
                    </div>
                    {member.userEmail && <p className="text-xs text-gray-500 truncate">{member.userEmail}</p>}
                    {member.status === 'invited' && member.inviteExpiresAt && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Invite expires {new Date(member.inviteExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Role badge */}
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${rc.cls}`}>
                    <RoleIcon className="w-3 h-3" />
                    {rc.label}
                  </span>

                  {/* Status badge */}
                  <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${sc.cls}`}>
                    {sc.label}
                  </span>

                  {/* Actions — only if caller is owner and target isn't primary owner */}
                  {!isMe && !member.isPrimaryOwner && member.status === 'active' && isPremiumUser && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Role toggle */}
                      <div className="relative">
                        <select
                          value={member.role}
                          disabled={actionLoading === member.userId}
                          onChange={e => handleRoleChange(member, e.target.value as 'manager' | 'member')}
                          className="appearance-none border border-gray-200 rounded-lg px-2 py-1.5 pr-6 text-xs font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                      <button
                        onClick={() => { setRemoveTarget(member); setRemoveReason(''); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Invite Modal ──────────────────────────────────────────────── */}
      {inviteOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setInviteOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Invite a Team Member</h3>

              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Agent User ID</label>
              <input
                type="text"
                value={inviteUserId}
                onChange={e => setInviteUserId(e.target.value)}
                placeholder="Paste the agent's user ID"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Role</label>
              <div className="flex gap-2 mb-6">
                {(['member', 'manager'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${
                      inviteRole === r
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-gray-400 mb-4">
                The agent will receive an invite notification. They have 7 days to accept.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Remove Modal ──────────────────────────────────────────────── */}
      {removeTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setRemoveTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Remove Member</h3>
              <p className="text-sm text-gray-500 mb-4">
                Remove <span className="font-semibold text-gray-700">{removeTarget.userName || removeTarget.userId}</span> from your agency?
              </p>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
                placeholder="e.g. Left the team"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {removing ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
