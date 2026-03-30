'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ThumbsUp, Star, Search, RefreshCw, Eye,
  CheckSquare, Square, Globe, EyeOff,
  MessageSquare, Calendar, User, Filter,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { supportApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StarRating({ value }: { value: number | null }) {
  if (!value) return <span className="text-xs text-gray-300">—</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i < value ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200')}
        />
      ))}
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  open:      'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  resolved:  'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-500',
};

// ── Detail drawer ──────────────────────────────────────────────────────────────

function FeedbackDrawer({
  ticket,
  onClose,
  onToggleTestimonial,
  onStatusChange,
}: {
  ticket: any;
  onClose: () => void;
  onToggleTestimonial: (t: any) => void;
  onStatusChange: (t: any, status: string) => void;
}) {
  const [notes, setNotes]       = useState(ticket.adminNotes ?? '');
  const [saving, setSaving]     = useState(false);
  const [toggling, setToggling] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    try {
      await supportApi.update(ticket.id, { adminNotes: notes });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggleTestimonial(ticket); }
    finally { setToggling(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">{ticket.ticketNumber ?? ticket.id.slice(0, 8)}</p>
            <h3 className="font-bold text-gray-900 text-base">{ticket.subject ?? 'Feedback'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 flex-1">
          {/* Submitter info */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
              {ticket.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{ticket.name}</p>
              <p className="text-xs text-gray-400">{ticket.email ?? ticket.phone ?? 'No contact'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmt(ticket.createdAt)}</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
              <StarRating value={ticket.rating} />
              {ticket.category && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{ticket.category}</span>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {/* Testimonial toggle */}
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl border-2 transition-all',
            ticket.showAsTestimonial
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-gray-50',
          )}>
            <div>
              <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                <Globe className={cn('w-4 h-4', ticket.showAsTestimonial ? 'text-green-600' : 'text-gray-400')} />
                Publish as Homepage Testimonial
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ticket.showAsTestimonial ? 'Visible to all visitors on the homepage' : 'Currently hidden from homepage'}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                ticket.showAsTestimonial
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300',
              )}
            >
              {toggling ? '...' : ticket.showAsTestimonial ? 'Published ✓' : 'Publish'}
            </button>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
            <div className="flex gap-2 flex-wrap">
              {(['open', 'in_review', 'resolved', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(ticket, s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border',
                    ticket.status === s
                      ? `${STATUS_BADGE[s]} border-transparent`
                      : 'bg-white border-gray-200 text-gray-500 hover:border-primary-300',
                  )}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Admin notes */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Notes</p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes here…"
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
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState<any>(null);

  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShow,   setFilterShow]   = useState('');   // '' | 'published' | 'unpublished'

  const [selected, setSelected] = useState<any | null>(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT, type: 'feedback' };
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await supportApi.getAll(params);
      let data: any[] = res.data?.items ?? [];
      if (filterShow === 'published')   data = data.filter((t: any) => t.showAsTestimonial);
      if (filterShow === 'unpublished') data = data.filter((t: any) => !t.showAsTestimonial);
      setItems(data);
      setTotal(res.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterShow]);

  const loadStats = useCallback(async () => {
    try {
      const res = await supportApi.getStats();
      setStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleToggleTestimonial = async (ticket: any) => {
    await supportApi.toggleTestimonial(ticket.id);
    setItems((prev) =>
      prev.map((t) => t.id === ticket.id ? { ...t, showAsTestimonial: !t.showAsTestimonial } : t),
    );
    if (selected?.id === ticket.id) {
      setSelected((s: any) => ({ ...s, showAsTestimonial: !s.showAsTestimonial }));
    }
    loadStats();
  };

  const handleStatusChange = async (ticket: any, status: string) => {
    await supportApi.update(ticket.id, { status });
    setItems((prev) => prev.map((t) => t.id === ticket.id ? { ...t, status } : t));
    if (selected?.id === ticket.id) setSelected((s: any) => ({ ...s, status }));
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-primary-600" />
            Feedback &amp; Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage user feedback and publish reviews as homepage testimonials
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
            { label: 'Total Feedback',    value: stats.byType?.feedback ?? 0,      color: 'text-blue-700',   bg: 'bg-blue-50'   },
            { label: 'Published',         value: stats.testimonialCount ?? 0,       color: 'text-green-700',  bg: 'bg-green-50'  },
            { label: 'Avg Rating',        value: stats.avgRating ? `${stats.avgRating}★` : '—', color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Open',             value: stats.byStatus?.open ?? 0,         color: 'text-orange-700', bg: 'bg-orange-50' },
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
            placeholder="Search name, email, message…"
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
          value={filterShow}
          onChange={(e) => { setFilterShow(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Visibility</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Published</th>
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
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No feedback found</p>
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
                      <p className="text-[11px] text-gray-400 font-mono">{t.ticketNumber ?? t.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.email ?? t.phone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating value={t.rating} />
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-xs text-gray-600 line-clamp-2">{t.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_BADGE[t.status])}>
                        {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleTestimonial(t)}
                        title={t.showAsTestimonial ? 'Click to unpublish' : 'Click to publish on homepage'}
                        className={cn(
                          'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all',
                          t.showAsTestimonial
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                        )}
                      >
                        {t.showAsTestimonial
                          ? <><Globe className="w-3 h-3" /> Live</>
                          : <><EyeOff className="w-3 h-3" /> Hidden</>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400">{fmt(t.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all">
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
        <FeedbackDrawer
          ticket={selected}
          onClose={() => setSelected(null)}
          onToggleTestimonial={handleToggleTestimonial}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
