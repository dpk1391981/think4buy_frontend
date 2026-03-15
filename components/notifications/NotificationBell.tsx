'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

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

interface Props {
  panelHref: string; // e.g. '/agent/notifications'
  accentClass?: string; // e.g. 'bg-blue-600' for ring color
}

export default function NotificationBell({ panelHref, accentClass = 'bg-red-500' }: Props) {
  const { recent, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) markRead(n.id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className={cn(
            'absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[10px] font-black px-0.5 ring-1 ring-white',
            accentClass,
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {recent.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              recent.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                    !n.isRead && 'bg-blue-50/60 hover:bg-blue-50',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0', TYPE_COLOR[n.type] || TYPE_COLOR.system)}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn('text-xs font-semibold text-gray-900 leading-snug', !n.isRead && 'font-bold')}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />}
                    </div>
                    {n.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <Link
              href={panelHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
