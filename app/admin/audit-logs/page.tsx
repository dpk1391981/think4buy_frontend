'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { rbacApi } from '@/lib/api';

interface AuditLog {
  id: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  summary: string | null;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  created:  'bg-green-100 text-green-700',
  updated:  'bg-blue-100 text-blue-700',
  deleted:  'bg-red-100 text-red-700',
  assigned: 'bg-purple-100 text-purple-700',
  changed:  'bg-orange-100 text-orange-700',
  removed:  'bg-gray-100 text-gray-600',
};

function actionBadgeColor(action: string): string {
  for (const [key, cls] of Object.entries(ACTION_COLOR)) {
    if (action.includes(key)) return cls;
  }
  return 'bg-gray-100 text-gray-600';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState({ action: '', resource: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rbacApi.getAuditLogs({
        page,
        limit: 25,
        action:   filters.action   || undefined,
        resource: filters.resource || undefined,
      });
      const d = res.data;
      setLogs(d.items ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(d.totalPages ?? 1);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          </div>
          <p className="text-sm text-gray-500">Immutable trail of all admin and RBAC actions</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-6">
        <input
          value={filters.action}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          placeholder="Filter by action (e.g. role.created)"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          value={filters.resource}
          onChange={e => setFilters(f => ({ ...f, resource: e.target.value }))}
          placeholder="Resource (e.g. role, user, property)"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl mb-4 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="text-xs text-gray-400 mb-3">
        Showing {logs.length} of {total.toLocaleString()} entries
      </div>

      {/* Log table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-px">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No audit logs found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 text-[10px] text-gray-400 w-32 mt-0.5">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${actionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        on <strong className="text-gray-700">{log.resource}</strong>
                        {log.resourceId && <span className="text-gray-400"> #{log.resourceId.slice(0, 8)}</span>}
                      </span>
                    </div>
                    {log.summary && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{log.summary}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    <div className="font-medium">{log.actorName ?? log.actorId.slice(0, 8)}</div>
                    {log.actorRole && <div className="text-gray-400">{log.actorRole}</div>}
                    {log.ipAddress && <div className="text-[10px] text-gray-300">{log.ipAddress}</div>}
                  </div>
                </button>

                {/* Expanded diff view */}
                {expanded === log.id && (log.before || log.after) && (
                  <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {log.before && (
                      <div>
                        <p className="text-[10px] font-semibold text-red-600 uppercase mb-1">Before</p>
                        <pre className="text-[10px] bg-red-50 text-red-800 rounded-xl p-3 overflow-auto max-h-40 font-mono">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div>
                        <p className="text-[10px] font-semibold text-green-600 uppercase mb-1">After</p>
                        <pre className="text-[10px] bg-green-50 text-green-800 rounded-xl p-3 overflow-auto max-h-40 font-mono">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
