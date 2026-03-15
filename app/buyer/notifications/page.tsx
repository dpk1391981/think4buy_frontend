'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_COLOR: Record<string, string> = {
  lead:     'bg-blue-100 text-blue-700',
  property: 'bg-emerald-100 text-emerald-700',
  system:   'bg-gray-100 text-gray-600',
  message:  'bg-purple-100 text-purple-700',
  admin:    'bg-orange-100 text-orange-700',
};

const TYPE_ICON: Record<string, string> = {
  lead:     '🎯',
  property: '🏠',
  system:   '⚙️',
  message:  '💬',
  admin:    '🔔',
};

const FILTERS = [
  { label: 'All',      value: '' },
  { label: 'Leads',    value: 'lead' },
  { label: 'Property', value: 'property' },
  { label: 'System',   value: 'system' },
];

export default function BuyerNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (p = 1, type = typeFilter) => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getAll({ page: p, limit: 20, type: type || undefined });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, typeFilter); }, [typeFilter]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total · {unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-purple-600 font-semibold hover:text-purple-800"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-colors',
              typeFilter === f.value
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No notifications</p>
          <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={cn(
                'bg-white rounded-2xl border p-4 flex gap-3 cursor-pointer transition-all hover:shadow-sm',
                n.isRead ? 'border-gray-100' : 'border-purple-200 bg-purple-50/40',
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0', TYPE_COLOR[n.type] || TYPE_COLOR.system)}>
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm text-gray-900', !n.isRead && 'font-bold')}>{n.title}</p>
                  {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0 mt-1" />}
                </div>
                {n.message && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', TYPE_COLOR[n.type] || TYPE_COLOR.system)}>
                    {n.type}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 bg-white"
          >← Prev</button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => load(page + 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 bg-white"
          >Next →</button>
        </div>
      )}
    </div>
  );
}
