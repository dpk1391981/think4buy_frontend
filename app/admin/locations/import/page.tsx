'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { api } from '@/lib/api';
import {
  Upload,
  FileSpreadsheet,
  MapPin,
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
  Ban,
  Globe,
  Zap,
  Eye,
  Filter,
  BarChart3,
  FileClock,
  AlertCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface ImportJob {
  id: string;
  status: JobStatus;
  fileName: string;
  fileType: string;
  options: {
    geocode: boolean;
    forceGeocode: boolean;
    dryRun: boolean;
    fileFilter: string;
  };
  progress: number;
  totalRows: number;
  processedRows: number;
  citiesInserted: number;
  citiesUpdated: number;
  localitiesInserted: number;
  localitiesUpdated: number;
  localitiesUnchanged: number;
  logOutput?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Clock size={12} /> },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Loader2 size={12} className="animate-spin" /> },
  completed:  { label: 'Completed',  color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={12} /> },
  failed:     { label: 'Failed',     color: 'bg-red-100 text-red-700 border-red-200',       icon: <XCircle size={12} /> },
  cancelled:  { label: 'Cancelled',  color: 'bg-gray-100 text-gray-600 border-gray-200',   icon: <Ban size={12} /> },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function duration(start?: string, end?: string): string {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const ms = e - s;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function StatChip({ label, value, color = 'gray' }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    green:  'bg-green-50  text-green-700  border-green-200',
    blue:   'bg-blue-50   text-blue-700   border-blue-200',
    amber:  'bg-amber-50  text-amber-700  border-amber-200',
    gray:   'bg-gray-50   text-gray-600   border-gray-200',
  };
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg border text-center min-w-[72px] ${colors[color]}`}>
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-[10px] mt-1 leading-tight opacity-80">{label}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LocationImportPage() {
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [opts, setOpts] = useState({
    geocode:      false,
    forceGeocode: false,
    dryRun:       false,
    fileFilter:   '',
  });
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Active job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob]     = useState<ImportJob | null>(null);
  const [showLog, setShowLog]         = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  // Job history
  const [jobs, setJobs]   = useState<ImportJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [histLoading, setHistLoading] = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const LIMIT = 10;

  // ── Fetch job list ────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await api.get(`/admin/location-import/jobs?page=${page}&limit=${LIMIT}`);
      setJobs(res.data.data);
      setTotal(res.data.total);
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  }, [page]);

  // ── Poll active job ───────────────────────────────────────────────────────────

  const fetchActiveJob = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/admin/location-import/jobs/${id}`);
      setActiveJob(res.data);
      if (res.data.status === 'completed' || res.data.status === 'failed' || res.data.status === 'cancelled') {
        setActiveJobId(null);
        fetchJobs();
      }
    } catch { /* silent */ }
  }, [fetchJobs]);

  useEffect(() => {
    if (!activeJobId) return;
    const id = setInterval(() => fetchActiveJob(activeJobId), 2000);
    fetchActiveJob(activeJobId);
    return () => clearInterval(id);
  }, [activeJobId, fetchActiveJob]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (showLog && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeJob?.logOutput, showLog]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── File selection ────────────────────────────────────────────────────────────

  const handleFile = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setUploadError('Only .xlsx, .xls, and .csv files are accepted.');
      return;
    }
    setFile(f);
    setUploadError('');
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  // ── Upload & enqueue ──────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('geocode',      String(opts.geocode));
    fd.append('forceGeocode', String(opts.forceGeocode));
    fd.append('dryRun',       String(opts.dryRun));
    fd.append('fileFilter',   opts.fileFilter);

    try {
      const res = await api.post('/admin/location-import/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActiveJobId(res.data.id);
      setActiveJob(res.data);
      setShowLog(true);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Cancel / Delete ───────────────────────────────────────────────────────────

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await api.patch(`/admin/location-import/jobs/${id}/cancel`);
      if (id === activeJob?.id) {
        setActiveJobId(null);
        setActiveJob((j) => j ? { ...j, status: 'cancelled' } : j);
      }
      fetchJobs();
    } catch { /* silent */ } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job record?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/location-import/jobs/${id}`);
      fetchJobs();
    } catch { /* silent */ } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const isActive = activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={22} className="text-blue-600" />
            Import Locations
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload an XLSX or CSV file to bulk-import cities and localities into the database via background queue.
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh list"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Format guide */}
      <FormatGuide />

      {/* Upload + Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload zone */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Upload size={16} className="text-blue-500" /> Upload File
          </h2>

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet size={36} className="mx-auto text-green-500" />
                <p className="font-semibold text-green-700 text-sm truncate max-w-[260px] mx-auto">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB — click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileSpreadsheet size={36} className="mx-auto text-gray-300" />
                <p className="text-gray-600 font-medium text-sm">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400">Supported: .xlsx, .xls, .csv (max 50 MB)</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {uploadError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {uploading ? (
              <><Loader2 size={15} className="animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={15} /> Start Import</>
            )}
          </button>
        </div>

        {/* Right: Options */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Settings2 size={16} className="text-gray-500" /> Import Options
          </h2>

          <div className="space-y-3">
            <OptionToggle
              icon={<Globe size={14} className="text-blue-500" />}
              label="Enable Geocoding"
              description="Fetch lat/long/pincode via Nominatim (1 req/sec — slow for large files)"
              checked={opts.geocode}
              onChange={(v) => setOpts((o) => ({ ...o, geocode: v, forceGeocode: v ? o.forceGeocode : false }))}
            />

            <OptionToggle
              icon={<Zap size={14} className="text-amber-500" />}
              label="Force Re-geocode"
              description="Re-geocode entries that already have coordinates (only applies if geocoding is on)"
              checked={opts.forceGeocode}
              disabled={!opts.geocode}
              onChange={(v) => setOpts((o) => ({ ...o, forceGeocode: v }))}
            />

            <OptionToggle
              icon={<Eye size={14} className="text-purple-500" />}
              label="Dry Run"
              description="Preview cities/localities that would be imported — no DB changes"
              checked={opts.dryRun}
              onChange={(v) => setOpts((o) => ({ ...o, dryRun: v }))}
            />
          </div>

          {/* File filter */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Filter size={13} className="text-gray-400" />
              City Filter
              <Tooltip text="Process only cities whose name contains this string (case-insensitive). Leave blank to process all." />
            </label>
            <input
              type="text"
              placeholder='e.g. "Mumbai" or "noida"'
              value={opts.fileFilter}
              onChange={(e) => setOpts((o) => ({ ...o, fileFilter: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Warning for large geocode run */}
          {opts.geocode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              Geocoding calls Nominatim (1 req/sec rate limit). A 1,000-locality file may take ~20 minutes.
            </div>
          )}
        </div>
      </div>

      {/* Active Job Monitor */}
      {activeJob && (
        <ActiveJobCard
          job={activeJob}
          showLog={showLog}
          logRef={logRef}
          onToggleLog={() => setShowLog((v) => !v)}
          onCancel={() => handleCancel(activeJob.id)}
          cancelling={cancellingId === activeJob.id}
        />
      )}

      {/* Job History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileClock size={16} className="text-gray-500" />
            Import History
            {total > 0 && <span className="text-xs text-gray-400 font-normal">({total} total)</span>}
          </h2>
          <button onClick={fetchJobs} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Refresh
          </button>
        </div>

        {histLoading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileSpreadsheet size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No import jobs yet. Upload a file to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-6 py-3 font-medium">File</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Options</th>
                    <th className="text-right px-4 py-3 font-medium">Rows</th>
                    <th className="text-right px-4 py-3 font-medium">Cities</th>
                    <th className="text-right px-4 py-3 font-medium">Localities</th>
                    <th className="text-right px-4 py-3 font-medium">Duration</th>
                    <th className="text-right px-4 py-3 font-medium">Started</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      onViewLogs={() => {
                        setActiveJob(job);
                        setShowLog(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onCancel={() => handleCancel(job.id)}
                      onDelete={() => handleDelete(job.id)}
                      cancelling={cancellingId === job.id}
                      deleting={deletingId === job.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page * LIMIT >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormatGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Info size={14} />
          Supported File Formats
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {open && (
        <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-900">
          <FormatCard
            icon="📑"
            title="Format A — Multi-sheet XLSX"
            desc="Each sheet tab = one city. Columns: [S.N, City, Locality]. City name is read from the City column or the tab name."
          />
          <FormatCard
            icon="📄"
            title="Format B — Single-sheet XLSX"
            desc="One sheet with columns: City, Locality. Each row contains one city + locality pair."
          />
          <FormatCard
            icon="📋"
            title="Format C — CSV"
            desc="Single-sheet CSV with columns: City, Locality. UTF-8 encoding recommended."
          />
        </div>
      )}
    </div>
  );
}

function FormatCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-blue-200">
      <div className="text-lg mb-1">{icon}</div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="opacity-80 leading-relaxed">{desc}</div>
    </div>
  );
}

function OptionToggle({
  icon, label, description, checked, disabled, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
      ${checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
      <input
        type="checkbox"
        className="mt-0.5 accent-blue-600"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
          {icon}
          {label}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </label>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex">
      <Info size={11} className="text-gray-400 cursor-help" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 bg-gray-800 text-white text-xs rounded-md px-2 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg leading-snug">
        {text}
      </span>
    </span>
  );
}

function ActiveJobCard({
  job, showLog, logRef, onToggleLog, onCancel, cancelling,
}: {
  job: ImportJob;
  showLog: boolean;
  logRef: React.RefObject<HTMLPreElement>;
  onToggleLog: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const isActive = job.status === 'pending' || job.status === 'processing';
  const cfg = STATUS_CONFIG[job.status];

  return (
    <div className={`rounded-xl border-2 shadow-sm overflow-hidden
      ${job.status === 'processing' ? 'border-amber-300' : job.status === 'completed' ? 'border-green-300' : job.status === 'failed' ? 'border-red-300' : 'border-gray-200'}`}>

      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between
        ${job.status === 'processing' ? 'bg-amber-50' : job.status === 'completed' ? 'bg-green-50' : job.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <BarChart3 size={18} className="text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{job.fileName}</h3>
            <div className="text-xs text-gray-500 mt-0.5">Job ID: {job.id.slice(0, 8)}…</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          {isActive && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md px-2 py-1 transition-colors flex items-center gap-1"
            >
              {cancelling ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white px-6 py-4 space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span className="font-medium">{job.progress}%{job.totalRows > 0 ? ` (${job.processedRows} / ${job.totalRows} rows)` : ''}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${job.status === 'completed' ? 'bg-green-500' : job.status === 'failed' ? 'bg-red-400' : 'bg-blue-500'}`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex flex-wrap gap-2">
          <StatChip label="Total Rows"  value={job.totalRows}             color="gray" />
          <StatChip label="Cities +New" value={job.citiesInserted}        color="green" />
          <StatChip label="Cities Upd"  value={job.citiesUpdated}         color="blue" />
          <StatChip label="Loc +New"    value={job.localitiesInserted}    color="green" />
          <StatChip label="Loc Upd"     value={job.localitiesUpdated}     color="blue" />
          <StatChip label="Loc Unch"    value={job.localitiesUnchanged}   color="amber" />
        </div>

        {/* Options display */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {job.options?.geocode      && <span className="bg-blue-100 text-blue-700 rounded px-2 py-0.5 flex items-center gap-1"><Globe size={10} /> Geocode</span>}
          {job.options?.forceGeocode && <span className="bg-amber-100 text-amber-700 rounded px-2 py-0.5 flex items-center gap-1"><Zap size={10} /> Force Re-geocode</span>}
          {job.options?.dryRun       && <span className="bg-purple-100 text-purple-700 rounded px-2 py-0.5 flex items-center gap-1"><Eye size={10} /> Dry Run</span>}
          {job.options?.fileFilter   && <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5 flex items-center gap-1"><Filter size={10} /> Filter: {job.options.fileFilter}</span>}
        </div>

        {/* Error message */}
        {job.status === 'failed' && job.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
            <XCircle size={14} className="mt-0.5 shrink-0" />
            {job.errorMessage}
          </div>
        )}

        {/* Log viewer toggle */}
        <div>
          <button
            onClick={onToggleLog}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            {showLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {showLog ? 'Hide' : 'Show'} Log Output
          </button>

          {showLog && (
            <pre
              ref={logRef}
              className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[11px] leading-5 font-mono max-h-64 overflow-y-auto whitespace-pre-wrap break-all"
            >
              {job.logOutput ?? 'No log output yet…'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function JobRow({
  job, onViewLogs, onCancel, onDelete, cancelling, deleting,
}: {
  job: ImportJob;
  onViewLogs: () => void;
  onCancel: () => void;
  onDelete: () => void;
  cancelling: boolean;
  deleting: boolean;
}) {
  const isActive = job.status === 'pending' || job.status === 'processing';

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* File */}
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={14} className="text-gray-400 shrink-0" />
          <div>
            <div className="font-medium text-gray-800 text-sm max-w-[180px] truncate">{job.fileName}</div>
            <div className="text-xs text-gray-400 uppercase">{job.fileType}</div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <StatusBadge status={job.status} />
          {isActive && job.progress > 0 && (
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${job.progress}%` }} />
            </div>
          )}
        </div>
      </td>

      {/* Options */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {job.options?.geocode      && <span title="Geocoding enabled"        className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]"><Globe size={10} /></span>}
          {job.options?.forceGeocode && <span title="Force re-geocode"         className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]"><Zap size={10} /></span>}
          {job.options?.dryRun       && <span title="Dry run"                  className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]"><Eye size={10} /></span>}
          {job.options?.fileFilter   && <span title={`Filter: ${job.options.fileFilter}`} className="w-5 h-5 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]"><Filter size={10} /></span>}
          {!job.options?.geocode && !job.options?.dryRun && !job.options?.fileFilter && (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      </td>

      {/* Rows */}
      <td className="px-4 py-3 text-right text-sm text-gray-600">
        {job.totalRows > 0 ? (
          <span>{job.processedRows} / {job.totalRows}</span>
        ) : '—'}
      </td>

      {/* Cities */}
      <td className="px-4 py-3 text-right">
        {job.citiesInserted + job.citiesUpdated > 0 ? (
          <div className="text-xs text-right">
            <span className="text-green-600 font-medium">+{job.citiesInserted}</span>
            <span className="text-gray-300 mx-0.5">/</span>
            <span className="text-blue-600">~{job.citiesUpdated}</span>
          </div>
        ) : <span className="text-gray-300 text-xs">—</span>}
      </td>

      {/* Localities */}
      <td className="px-4 py-3 text-right">
        {job.localitiesInserted + job.localitiesUpdated + job.localitiesUnchanged > 0 ? (
          <div className="text-xs text-right">
            <span className="text-green-600 font-medium">+{job.localitiesInserted}</span>
            <span className="text-gray-300 mx-0.5">/</span>
            <span className="text-blue-600">~{job.localitiesUpdated}</span>
            <span className="text-gray-300 mx-0.5">/</span>
            <span className="text-gray-400">{job.localitiesUnchanged}</span>
          </div>
        ) : <span className="text-gray-300 text-xs">—</span>}
      </td>

      {/* Duration */}
      <td className="px-4 py-3 text-right text-xs text-gray-500">
        {duration(job.startedAt, job.completedAt)}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
        {fmtDate(job.startedAt ?? job.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={onViewLogs}
            className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded px-2 py-1 transition-colors"
            title="View logs"
          >
            Logs
          </button>

          {isActive && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="text-xs text-amber-500 hover:text-amber-700 border border-amber-200 rounded px-2 py-1 transition-colors"
              title="Cancel"
            >
              {cancelling ? <Loader2 size={10} className="animate-spin" /> : <Ban size={10} />}
            </button>
          )}

          {!isActive && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded px-2 py-1 transition-colors"
              title="Delete"
            >
              {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
