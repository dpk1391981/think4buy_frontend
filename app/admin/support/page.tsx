'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  HelpCircle, Star, Search, RefreshCw, ChevronDown,
  CheckCircle, Clock, XCircle, Eye, Filter, MessageSquare,
} from 'lucide-react';
import { supportApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  open:      'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  resolved:  'bg-green-100 text-green-700',
  closed:    'bg-slate-100 text-slate-500',
};

const STATUS_LABELS: Record<string, string> = {
  open:      'Open',
  in_review: 'In Review',
  resolved:  'Resolved',
  closed:    'Closed',
};

const TYPE_STYLES: Record<string, string> = {
  help:     'bg-indigo-100 text-indigo-700',
  feedback: 'bg-amber-100 text-amber-700',
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating}/5</span>
    </span>
  );
}

// ── Detail drawer ──────────────────────────────────────────────────────────────

function TicketDrawer({ ticket, onClose, onUpdate }: {
  ticket: any;
  onClose: () => void;
  onUpdate: (updated: any) => void;
}) {
  const [status,     setStatus]     = useState(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes || '');
  const [saving,     setSaving]     = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await supportApi.update(ticket.id, { status, adminNotes: adminNotes.trim() || undefined });
      onUpdate(updated.data);
    } catch { /* noop */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', TYPE_STYLES[ticket.type])}>
              {ticket.type}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[ticket.status])}>
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Name</p>
              <p className="font-medium text-slate-800">{ticket.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Submitted</p>
              <p className="text-slate-700">{new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
            </div>
            {ticket.email && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Email</p>
                <a href={`mailto:${ticket.email}`} className="text-indigo-600 hover:underline">{ticket.email}</a>
              </div>
            )}
            {ticket.phone && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                <a href={`tel:${ticket.phone}`} className="text-indigo-600 hover:underline">{ticket.phone}</a>
              </div>
            )}
            {ticket.category && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Category</p>
                <p className="text-slate-700">{ticket.category}</p>
              </div>
            )}
            {ticket.rating && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Rating</p>
                <StarDisplay rating={ticket.rating} />
              </div>
            )}
          </div>

          {/* Subject */}
          {ticket.subject && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Subject</p>
              <p className="text-slate-800 font-medium">{ticket.subject}</p>
            </div>
          )}

          {/* Message */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Message</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.message}
            </div>
          </div>

          {/* Admin controls */}
          <div className="border-t pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Actions</p>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Notes / Resolution</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes or resolution details…"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [tickets,  setTickets]  = useState<any[]>([]);
  const [stats,    setStats]    = useState<any>(null);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  // Filters
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType,   setFilterType]   = useState('');

  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        supportApi.getAll({ page, limit, search: search || undefined, status: filterStatus || undefined, type: filterType || undefined }),
        supportApi.getStats(),
      ]);
      setTickets(ticketsRes.data.items);
      setTotal(ticketsRes.data.total);
      setStats(statsRes.data);
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = (updated: any) => {
    setTickets((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelected(updated);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle size={24} className="text-indigo-600" /> Support Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Help queries and user feedback</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50 text-slate-600 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',     value: stats.total,                     color: 'text-slate-700' },
            { label: 'Open',      value: stats.byStatus?.open || 0,       color: 'text-blue-600'  },
            { label: 'In Review', value: stats.byStatus?.in_review || 0,  color: 'text-yellow-600'},
            { label: 'Avg Rating',value: stats.avgRating ? `${stats.avgRating}★` : '—', color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, message…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All Types</option>
          <option value="help">Help Queries</option>
          <option value="feedback">Feedback</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <MessageSquare size={32} />
            <p>No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 max-w-[200px]">Message</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{t.name}</p>
                      {t.email && <p className="text-xs text-slate-400">{t.email}</p>}
                      {t.phone && <p className="text-xs text-slate-400">{t.phone}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', TYPE_STYLES[t.type])}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{t.category || '—'}</td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="text-slate-700 line-clamp-2 text-xs">{t.subject || t.message}</p>
                    </td>
                    <td className="py-3 px-4"><StarDisplay rating={t.rating} /></td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[t.status])}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelected(t)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">
            <span>{total} tickets total</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border disabled:opacity-40 hover:bg-slate-50"
              >Prev</button>
              <span className="px-3 py-1 text-slate-700 font-medium">{page}/{totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border disabled:opacity-40 hover:bg-slate-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdated}
        />
      )}
    </div>
  );
}
