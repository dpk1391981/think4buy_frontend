'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';
type JobType   = 'image' | 'video';

interface MediaJob {
  id:               string;
  type:             JobType;
  status:           JobStatus;
  originalPath:     string;
  outputs:          Record<string, string> | null;
  entityType:       string | null;
  entityId:         string | null;
  queueJobId:       string | null;
  attemptCount:     number;
  errorMessage:     string | null;
  processingMs:     number | null;
  originalSizeBytes: number | null;
  createdAt:        string;
  updatedAt:        string;
}

interface Stats {
  queued:          number;
  processing:      number;
  completed:       number;
  failed:          number;
  totalImages:     number;
  totalVideos:     number;
  avgProcessingMs: number | null;
}

const TAB_STATUSES: { label: string; status: JobStatus | 'all' }[] = [
  { label: 'All',        status: 'all' },
  { label: 'Queued',     status: 'queued' },
  { label: 'Processing', status: 'processing' },
  { label: 'Completed',  status: 'completed' },
  { label: 'Failed',     status: 'failed' },
];

const STATUS_COLORS: Record<JobStatus, string> = {
  queued:     'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  completed:  'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<JobType, string> = {
  image: 'bg-purple-100 text-purple-700',
  video: 'bg-orange-100 text-orange-700',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatMs(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function MediaProcessingPage() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [jobs, setJobs]           = useState<MediaJob[]>([]);
  const [total, setTotal]         = useState(0);
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [retrying, setRetrying]   = useState<string | null>(null);

  const LIMIT = 50;

  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get<Stats>('/admin/media/stats');
      setStats(r.data);
    } catch {}
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (activeTab !== 'all') params.status = activeTab;
      if (typeFilter !== 'all') params.type = typeFilter;
      const r = await api.get<{ data: MediaJob[]; total: number }>('/admin/media/jobs', { params });
      setJobs(r.data.data);
      setTotal(r.data.total);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter, page]);

  // Load on mount and auto-refresh every 5 seconds when processing jobs exist
  useEffect(() => {
    fetchStats();
    fetchJobs();
  }, [fetchStats, fetchJobs]);

  useEffect(() => {
    const hasActive = stats && (stats.queued > 0 || stats.processing > 0);
    if (!hasActive) return;
    const id = setInterval(() => { fetchStats(); fetchJobs(); }, 5000);
    return () => clearInterval(id);
  }, [stats, fetchStats, fetchJobs]);

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      await api.post(`/admin/media/jobs/${jobId}/retry`);
      await Promise.all([fetchStats(), fetchJobs()]);
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this media job record?')) return;
    await api.delete(`/admin/media/jobs/${jobId}`);
    await Promise.all([fetchStats(), fetchJobs()]);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Processing Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor async image and video processing jobs. Auto-refreshes when jobs are active.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: 'Queued',      value: stats.queued,      color: 'blue'   },
            { label: 'Processing',  value: stats.processing,  color: 'yellow' },
            { label: 'Completed',   value: stats.completed,   color: 'green'  },
            { label: 'Failed',      value: stats.failed,      color: 'red'    },
            { label: 'Images',      value: stats.totalImages, color: 'purple' },
            { label: 'Videos',      value: stats.totalVideos, color: 'orange' },
            {
              label: 'Avg Time',
              value: stats.avgProcessingMs ? formatMs(stats.avgProcessingMs) : '—',
              color: 'gray',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TAB_STATUSES.map((t) => (
            <button
              key={t.status}
              onClick={() => { setActiveTab(t.status); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                activeTab === t.status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.status !== 'all' && stats && stats[t.status as JobStatus] > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  {stats[t.status as JobStatus]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>

        <button
          onClick={() => { fetchStats(); fetchJobs(); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            No media jobs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Original</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Size</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Attempts</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[job.type]}`}>
                        {job.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {job.status === 'processing' && (
                          <div className="animate-spin w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full" />
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[job.status]}`}>
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {job.entityType ? (
                        <div>
                          <div className="text-gray-700">{job.entityType}</div>
                          <div className="text-gray-400">{job.entityId?.slice(0, 8)}…</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[160px] truncate font-mono text-xs text-gray-500" title={job.originalPath}>
                        {job.originalPath.split('/').pop()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatBytes(job.originalSizeBytes)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatMs(job.processingMs)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{job.attemptCount}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(job.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={retrying === job.id}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {retrying === job.id ? '…' : 'Retry'}
                          </button>
                        )}
                        {job.errorMessage && (
                          <span title={job.errorMessage} className="cursor-help text-red-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outputs Detail Panel (for completed jobs) */}
      {jobs.some(j => j.status === 'completed' && j.outputs) && (
        <details className="bg-white rounded-xl border border-gray-200 p-4">
          <summary className="font-medium text-gray-700 cursor-pointer">
            View Output URLs (completed jobs)
          </summary>
          <div className="mt-4 space-y-3">
            {jobs
              .filter(j => j.status === 'completed' && j.outputs)
              .slice(0, 10)
              .map(job => (
                <div key={job.id} className="text-xs font-mono bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-600 mb-1">{job.id.slice(0, 8)}… ({job.type})</div>
                  {Object.entries(job.outputs ?? {}).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-400 w-20 flex-shrink-0">{k}:</span>
                      <span className="text-blue-600 truncate">{v}</span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </details>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} jobs</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
