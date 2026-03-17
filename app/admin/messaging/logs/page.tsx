'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, ChevronLeft, CheckCircle, XCircle, Clock, AlertTriangle, SkipForward, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface Log {
  id: string;
  event: string;
  templateId?: string;
  recipientType: string;
  recipient: string;
  status: string;
  attempts: number;
  renderedBody?: string;
  errorMessage?: string;
  sentAt?: string;
  jobId?: string;
  contextData?: Record<string, any>;
  createdAt: string;
}

interface Pagination {
  items: Log[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  sent:     { color: 'bg-green-100 text-green-700',  icon: CheckCircle,    label: 'Sent'     },
  failed:   { color: 'bg-red-100 text-red-700',      icon: XCircle,        label: 'Failed'   },
  queued:   { color: 'bg-amber-100 text-amber-700',  icon: Clock,          label: 'Queued'   },
  retrying: { color: 'bg-orange-100 text-orange-700',icon: AlertTriangle,  label: 'Retrying' },
  skipped:  { color: 'bg-gray-100 text-gray-600',    icon: SkipForward,    label: 'Skipped'  },
};

const EVENTS = [
  'lead_created','lead_status_updated','lead_assigned','inquiry_created',
  'property_approved','property_rejected','site_visit_scheduled','deal_created','deal_won',
  'user_registered','otp_sent',
];

export default function MessageLogsPage() {
  const [data,     setData]     = useState<Pagination | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters,  setFilters]  = useState({ page: 1, limit: 20, event: '', status: '', recipientType: '' });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    api.get(`/admin/messaging/logs?${params}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(load, [load]);

  async function handleRetry(id: string) {
    setRetrying(id);
    try {
      await api.post(`/admin/messaging/logs/${id}/retry`);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Retry failed');
    } finally {
      setRetrying(null);
    }
  }

  function setFilter(key: string, value: string) {
    setFilters(p => ({ ...p, [key]: value, page: 1 }));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/messaging" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">Message Logs</h1>
          <p className="text-sm text-gray-500">Monitor delivery status, retries, and errors</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
          value={filters.event} onChange={e => setFilter('event', e.target.value)}>
          <option value="">All Events</option>
          {EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
          value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
          value={filters.recipientType} onChange={e => setFilter('recipientType', e.target.value)}>
          <option value="">All Recipients</option>
          {['buyer','agent','admin','owner'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">
          {data ? `${data.total} total` : ''}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500">No message logs found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map(log => {
              const s = STATUS_CONFIG[log.status] ?? { color: 'bg-gray-100 text-gray-600', icon: Clock, label: log.status };
              const Icon = s.icon;
              const isExpanded = expanded === log.id;
              return (
                <div key={log.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : log.id)}>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${s.color}`}>
                      <Icon className="w-3 h-3" />{s.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-600">{log.event}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{log.recipientType}</span>
                        <span className="text-xs text-gray-500 truncate max-w-32">{log.recipient}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                      {log.attempts > 0 && <p className="text-xs text-gray-400">{log.attempts} attempt{log.attempts !== 1 ? 's' : ''}</p>}
                    </div>
                    {log.status === 'failed' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRetry(log.id); }}
                        disabled={retrying === log.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-60 flex-shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {retrying === log.id ? '…' : 'Retry'}
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                      {log.renderedBody && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Message Sent</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-200">{log.renderedBody}</p>
                        </div>
                      )}
                      {log.errorMessage && (
                        <div>
                          <p className="text-xs font-semibold text-red-500 mb-1">Error</p>
                          <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 border border-red-100 font-mono break-all">{log.errorMessage}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                        <div><span className="font-semibold">Job ID:</span> {log.jobId ?? '—'}</div>
                        <div><span className="font-semibold">Template:</span> {log.templateId?.slice(0, 8) ?? '—'}</div>
                        <div><span className="font-semibold">Sent At:</span> {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}</div>
                        <div><span className="font-semibold">Log ID:</span> {log.id.slice(0, 8)}</div>
                      </div>
                      {log.contextData && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Context Data</summary>
                          <pre className="mt-2 p-3 bg-white rounded-lg border border-gray-200 overflow-x-auto text-gray-700">
                            {JSON.stringify(log.contextData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={filters.page <= 1}
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <span className="text-sm text-gray-600">{filters.page} / {data.totalPages}</span>
              <button disabled={filters.page >= data.totalPages}
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
