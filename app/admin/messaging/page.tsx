'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { MessageSquare, Settings, FileText, GitBranch, Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface Stats {
  byStatus: Record<string, number>;
  byEvent: Record<string, number>;
  today: number;
}

const STATUS_COLOR: Record<string, string> = {
  sent:     'text-green-600 bg-green-50',
  failed:   'text-red-600 bg-red-50',
  queued:   'text-amber-600 bg-amber-50',
  retrying: 'text-orange-600 bg-orange-50',
  skipped:  'text-gray-600 bg-gray-50',
};

const STATUS_ICON: Record<string, any> = {
  sent:     CheckCircle,
  failed:   XCircle,
  queued:   Clock,
  retrying: Activity,
};

export default function MessagingDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/admin/messaging/logs/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const total = stats
    ? Object.values(stats.byStatus).reduce((a, b) => a + b, 0)
    : 0;

  const sections = [
    {
      href:  '/admin/messaging/services',
      icon:  Settings,
      label: 'Messaging Services',
      desc:  'Configure WhatsApp (Meta/Twilio), SMS, and Email providers',
      color: 'from-blue-500 to-blue-600',
    },
    {
      href:  '/admin/messaging/templates',
      icon:  FileText,
      label: 'Message Templates',
      desc:  'Create reusable templates with {{variable}} placeholders',
      color: 'from-purple-500 to-purple-600',
    },
    {
      href:  '/admin/messaging/events',
      icon:  GitBranch,
      label: 'Event Mappings',
      desc:  'Map system events to Buyer / Agent / Admin templates',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      href:  '/admin/messaging/logs',
      icon:  Activity,
      label: 'Message Logs',
      desc:  'Monitor delivery status, retries, and errors',
      color: 'from-rose-500 to-rose-600',
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Messaging Centre</h1>
          <p className="text-sm text-gray-500">Plug-and-play multi-channel messaging via Redis Queue</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Today</p>
          <p className="text-3xl font-black text-gray-900">{stats?.today ?? '—'}</p>
          <p className="text-xs text-gray-400">messages queued</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-3xl font-black text-gray-900">{total || '—'}</p>
          <p className="text-xs text-gray-400">all time</p>
        </div>
        {Object.entries(stats?.byStatus ?? {}).slice(0, 2).map(([status, count]) => {
          const Icon = STATUS_ICON[status] ?? Activity;
          return (
            <div key={status} className={`rounded-2xl p-4 shadow-sm border border-transparent ${STATUS_COLOR[status] || 'bg-gray-50 text-gray-600'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <p className="text-xs font-medium capitalize">{status}</p>
              </div>
              <p className="text-3xl font-black">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}
              className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex items-start gap-4"
            >
              <div className={`w-11 h-11 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{s.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Architecture flow */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="font-bold">Message Flow</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            'User Action',
            'Event Triggered',
            'Redis Queue (BullMQ)',
            'Worker Picks Job',
            'Fetch Template',
            'Render Variables',
            'Send via Provider',
            'Log Result',
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="bg-white/10 rounded-lg px-3 py-1.5 font-medium">{step}</span>
              {i < arr.length - 1 && <span className="text-gray-400">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Top events */}
      {stats?.byEvent && Object.keys(stats.byEvent).length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Top Events</h2>
          <div className="space-y-2">
            {Object.entries(stats.byEvent).map(([event, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={event} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-700 w-40 truncate">{event}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
