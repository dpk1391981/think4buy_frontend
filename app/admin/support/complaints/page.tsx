'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, Search, RefreshCw, Eye,
  UserCheck, UserX, Clock, CheckCircle2,
  MessageSquare, ChevronLeft, ChevronRight,
  X, Tag, User, Calendar, FileText,
  ClipboardList,
} from 'lucide-react';
import { supportApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_BADGE: Record<string, { cls: string; icon: React.ReactNode }> = {
  open:      { cls: 'bg-blue-100 text-blue-700',   icon: <Clock className="w-3 h-3" /> },
  in_review: { cls: 'bg-yellow-100 text-yellow-700', icon: <Eye className="w-3 h-3" /> },
  resolved:  { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:    { cls: 'bg-gray-100 text-gray-500',    icon: <X className="w-3 h-3" /> },
};

const PRIORITY_COLORS: Record<string, string> = {
  'Agent Complaint':   'bg-red-100 text-red-700',
  'Payment':          'bg-orange-100 text-orange-700',
  'Listing Issue':    'bg-yellow-100 text-yellow-700',
  'Website Bug':      'bg-purple-100 text-purple-700',
  'General':          'bg-gray-100 text-gray-600',
};

// ── Assign modal ──────────────────────────────────────────────────────────────

function AssignModal({
  ticket,
  members,
  onAssign,
  onClose,
}: {
  ticket: any;
  members: any[];
  onAssign: (memberId: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(ticket.assignedToId ?? '');
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try { await onAssign(selected); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Assign Ticket</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Ticket <span className="font-mono font-semibold">{ticket.ticketNumber ?? ticket.id.slice(0, 8)}</span> —
          select a team member to handle this complaint.
        </p>

        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto mb-4">
          {members.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-4">No admin members found</p>
          ) : (
            members.map((m) => (
              <label
                key={m.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                  selected === m.id
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-200',
                )}
              >
                <input
                  type="radio"
                  name="member"
                  value={m.id}
                  checked={selected === m.id}
                  onChange={() => setSelected(m.id)}
                  className="accent-primary-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize',
                  m.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
                )}>
                  {m.role.replace('_', ' ')}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all"
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail drawer ──────────────────────────────────────────────────────────────

function ComplaintDrawer({
  ticket,
  members,
  onClose,
  onStatusChange,
  onAssign,
  onUnassign,
}: {
  ticket: any;
  members: any[];
  onClose: () => void;
  onStatusChange: (t: any, status: string) => void;
  onAssign: (t: any, memberId: string) => void;
  onUnassign: (t: any) => void;
}) {
  const [notes,       setNotes]       = useState(ticket.adminNotes ?? '');
  const [saving,      setSaving]      = useState(false);
  const [showAssign,  setShowAssign]  = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    try { await supportApi.update(ticket.id, { adminNotes: notes }); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40" onClick={onClose} />
        <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-red-50">
            <div>
              <p className="text-[11px] font-mono text-red-400">{ticket.ticketNumber ?? ticket.id.slice(0, 8)}</p>
              <h3 className="font-bold text-gray-900 text-base">{ticket.subject ?? 'Complaint'}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5 flex-1">
            {/* Submitter */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">
                {ticket.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{ticket.name}</p>
                <p className="text-xs text-gray-400">{ticket.email ?? ticket.phone ?? 'No contact'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtTime(ticket.createdAt)}</p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                {ticket.category && (
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    PRIORITY_COLORS[ticket.category] ?? 'bg-gray-100 text-gray-600',
                  )}>
                    {ticket.category}
                  </span>
                )}
                <span className={cn(
                  'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                  STATUS_BADGE[ticket.status]?.cls,
                )}>
                  {STATUS_BADGE[ticket.status]?.icon}
                  {ticket.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Complaint Details</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">
                {ticket.message}
              </p>
            </div>

            {/* Assignment */}
            <div className="p-3 rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned To</p>
              {ticket.assignedToId ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                    {(ticket.assignedToName ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{ticket.assignedToName}</p>
                    <p className="text-xs text-gray-400">Assigned member</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowAssign(true)}
                      className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-all"
                    >
                      Reassign
                    </button>
                    <button
                      onClick={() => onUnassign(ticket)}
                      className="text-xs px-2 py-1 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-400 flex-1">No one assigned yet</p>
                  <button
                    onClick={() => setShowAssign(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Assign
                  </button>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['open', 'in_review', 'resolved', 'closed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(ticket, s)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border',
                      ticket.status === s
                        ? `${STATUS_BADGE[s]?.cls} border-transparent`
                        : 'bg-white border-gray-200 text-gray-500 hover:border-primary-300',
                    )}
                  >
                    {STATUS_BADGE[s]?.icon}
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {ticket.resolvedAt && (
                <p className="text-xs text-gray-400 mt-1.5">Resolved: {fmtTime(ticket.resolvedAt)}</p>
              )}
            </div>

            {/* Admin notes */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Internal Notes</p>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add investigation notes, resolution steps, escalation details…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={saveNotes}
                disabled={saving}
                className="self-end px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAssign && (
        <AssignModal
          ticket={ticket}
          members={members}
          onClose={() => setShowAssign(false)}
          onAssign={async (memberId) => {
            await onAssign(ticket, memberId);
            setShowAssign(false);
          }}
        />
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminComplaintsPage() {
  const [items,    setItems]    = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState<any>(null);
  const [members,  setMembers]  = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssign, setFilterAssign] = useState('');  // '' | 'assigned' | 'unassigned'

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT, type: 'help' };
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await supportApi.getAll(params);
      let data: any[] = res.data?.items ?? [];
      if (filterAssign === 'assigned')   data = data.filter((t: any) => !!t.assignedToId);
      if (filterAssign === 'unassigned') data = data.filter((t: any) => !t.assignedToId);
      setItems(data);
      setTotal(res.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterAssign]);

  const loadStats   = useCallback(async () => {
    try { const r = await supportApi.getStats();   setStats(r.data); } catch {}
  }, []);

  const loadMembers = useCallback(async () => {
    try { const r = await supportApi.getMembers(); setMembers(r.data ?? []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); loadMembers(); }, [loadStats, loadMembers]);

  const handleStatusChange = async (ticket: any, status: string) => {
    await supportApi.update(ticket.id, { status });
    setItems((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status } : t));
    if (selected?.id === ticket.id) setSelected((s: any) => ({ ...s, status }));
  };

  const handleAssign = async (ticket: any, memberId: string) => {
    const res = await supportApi.assignTicket(ticket.id, memberId);
    const updated = res.data;
    setItems((prev) => prev.map((t) => t.id === ticket.id ? { ...t, ...updated } : t));
    if (selected?.id === ticket.id) setSelected((s: any) => ({ ...s, ...updated }));
  };

  const handleUnassign = async (ticket: any) => {
    const res = await supportApi.unassignTicket(ticket.id);
    const updated = res.data;
    setItems((prev) => prev.map((t) => t.id === ticket.id ? { ...t, ...updated } : t));
    if (selected?.id === ticket.id) setSelected((s: any) => ({ ...s, ...updated }));
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Complaints &amp; Help Tickets
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage help requests, assign to team members and track resolution
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Complaints', value: stats.byType?.help ?? 0,         color: 'text-red-700',    bg: 'bg-red-50'    },
            { label: 'Open',            value: stats.byStatus?.open ?? 0,        color: 'text-blue-700',   bg: 'bg-blue-50'   },
            { label: 'In Review',       value: stats.byStatus?.in_review ?? 0,   color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Resolved',        value: stats.byStatus?.resolved ?? 0,    color: 'text-green-700',  bg: 'bg-green-50'  },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn('rounded-xl p-4', bg)}>
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ticket, name, email…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filterAssign}
          onChange={(e) => { setFilterAssign(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Tickets</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticket #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No complaints found</p>
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                    onClick={() => setSelected(t)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-mono font-semibold text-gray-700">{t.ticketNumber ?? `#${t.id.slice(0, 8)}`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.email ?? t.phone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.category ? (
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          PRIORITY_COLORS[t.category] ?? 'bg-gray-100 text-gray-600',
                        )}>
                          {t.category}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-xs text-gray-600 line-clamp-2">{t.subject ?? t.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'flex items-center gap-1 w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        STATUS_BADGE[t.status]?.cls,
                      )}>
                        {STATUS_BADGE[t.status]?.icon}
                        {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.assignedToId ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[10px]">
                            {(t.assignedToName ?? '?')[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">{t.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-300">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400">{fmt(t.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all"
                        onClick={(e) => { e.stopPropagation(); setSelected(t); }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {items.length} of {total}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <ComplaintDrawer
          ticket={selected}
          members={members}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
        />
      )}
    </div>
  );
}
