'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, Search, X, ChevronLeft, ChevronRight, ExternalLink,
  Building2, MapPin, Tag, RefreshCw, Trash2, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle2, Filter, Globe, Eye, EyeOff,
} from 'lucide-react';
import { seoApi } from '@/lib/api';
import { FOOTER_CATEGORIES } from '@/components/layout/FooterSeoLinks';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageRow {
  id: string;
  label: string;
  url: string;
  type: 'city' | 'locality';
  category: string | null;
  cityName: string | null;
  localityName: string | null;
  groupId: string;
  groupTitle: string | null;
  isActive: boolean;
  metaTitle: string | null;
  h1Title: string | null;
  robots: string;
}

interface PagedResult {
  items: PageRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'violet' }) {
  const cls: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-500',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls[color]}`}>{children}</span>;
}

const CAT_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'violet' | 'gray'> = {
  buy: 'blue', rent: 'green', flats: 'blue', 'flats-rent': 'green',
  villas: 'violet', plots: 'yellow', commercial: 'yellow', office: 'gray',
  'new-projects': 'violet', pg: 'gray',
};

function catLabel(value: string | null) {
  if (!value) return null;
  return FOOTER_CATEGORIES.find(c => c.value === value)?.short ?? value;
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────

function ConfirmDialog({ count, onConfirm, onCancel, busy }: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-100 rounded-xl"><Trash2 className="w-5 h-5 text-red-600" /></div>
          <div>
            <h3 className="font-bold text-gray-900">Delete {count} page{count > 1 ? 's' : ''}?</h3>
            <p className="text-xs text-gray-500 mt-0.5">This removes the footer SEO link entries. Cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {busy ? 'Deleting…' : 'Delete'}
          </button>
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const LIMIT = 50;

export default function AllSeoPages() {
  const [data, setData]           = useState<PagedResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Filters
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('');
  const [page, setPage]           = useState(1);

  // Selection
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  // Actions
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const r = await seoApi.adminGetAllFooterPages({
        page: p,
        limit: LIMIT,
        search:   search   || undefined,
        category: filterCat   || undefined,
        city:     filterCity  || undefined,
        isActive: filterActive !== '' ? filterActive === 'true' : undefined,
      });
      setData(r.data);
      setSelected(new Set());
    } catch {
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCat, filterCity, filterActive]);

  useEffect(() => { load(1); setPage(1); }, [filterCat, filterCity, filterActive]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { load(1); setPage(1); }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => { load(page); }, [page]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const toggleActive = async (row: PageRow) => {
    try {
      await seoApi.adminUpdateFooterLink(row.id, { isActive: !row.isActive });
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(r => r.id === row.id ? { ...r, isActive: !r.isActive } : r),
      } : prev);
      showToast(`${row.label} ${!row.isActive ? 'shown in' : 'hidden from'} footer`, true);
    } catch {
      showToast('Update failed', false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = (ids: string[]) => setDeleteIds(ids);

  const doDelete = async () => {
    setDeleting(true);
    let ok = 0, fail = 0;
    for (const id of deleteIds) {
      try { await seoApi.adminDeleteFooterLink(id); ok++; }
      catch { fail++; }
    }
    setDeleting(false);
    setDeleteIds([]);
    setSelected(new Set());
    showToast(`Deleted ${ok} page${ok !== 1 ? 's' : ''}${fail ? `, ${fail} failed` : ''}`, fail === 0);
    load(page);
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const allIds = data?.items.map(r => r.id) ?? [];
  const allChecked = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someChecked = !allChecked && allIds.some(id => selected.has(id));

  const toggleAll = () => {
    if (allChecked) { setSelected(new Set()); }
    else { setSelected(new Set(allIds)); }
  };
  const toggleRow = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white';

  return (
    <div className="p-6 max-w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-100 rounded-xl"><FileText className="w-5 h-5 text-blue-600" /></div>
            <h1 className="text-2xl font-bold text-gray-900">All SEO Pages</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">
            Every footer SEO link — created via Quick SEO or manually. Manage visibility, delete in bulk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/seo/quick-seo"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
            + Quick SEO
          </Link>
          <Link href="/admin/seo/footer-links"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Footer Links Editor
          </Link>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total pages',    value: data.total,                                      color: 'text-gray-900' },
            { label: 'Active',         value: data.items.filter(r => r.isActive).length,       color: 'text-green-600' },
            { label: 'City pages',     value: data.items.filter(r => r.type === 'city').length,    color: 'text-blue-600' },
            { label: 'Locality pages', value: data.items.filter(r => r.type === 'locality').length, color: 'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search label, URL, meta title…"
              className={`${inputCls} pl-9 w-full`} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={`${inputCls} min-w-[150px]`}>
            <option value="">All categories</option>
            {FOOTER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.short} — {c.label}</option>)}
          </select>

          {/* City filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={filterCity} onChange={e => setFilterCity(e.target.value)}
              placeholder="Filter by city…"
              className={`${inputCls} pl-9 min-w-[150px]`} />
            {filterCity && (
              <button onClick={() => setFilterCity('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>
            )}
          </div>

          {/* Status filter */}
          <select value={filterActive} onChange={e => setFilterActive(e.target.value as any)} className={`${inputCls}`}>
            <option value="">All statuses</option>
            <option value="true">Active (in footer)</option>
            <option value="false">Hidden (inactive)</option>
          </select>

          <button onClick={() => load(page)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Bulk action bar ────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <span className="font-semibold text-blue-800">{selected.size} selected</span>
          <button onClick={() => confirmDelete(Array.from(selected))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete selected
          </button>
          <button onClick={() => setSelected(new Set())} className="text-blue-600 hover:text-blue-800 text-xs">Clear selection</button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {error && (
          <div className="p-6 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium">No pages found</p>
            <p className="text-xs mt-1">Try adjusting filters or create pages via Quick SEO.</p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  {['Type', 'Label / URL', 'Category', 'City', 'Meta Title', 'Footer', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map(row => (
                  <tr key={row.id} className={`hover:bg-gray-50/60 transition-colors ${selected.has(row.id) ? 'bg-blue-50/40' : ''} ${!row.isActive ? 'opacity-60' : ''}`}>

                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      {row.type === 'city'
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full"><Building2 className="w-3 h-3" /> City</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full"><MapPin className="w-3 h-3" /> Locality</span>}
                    </td>

                    {/* Label + URL */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-gray-800 truncate" title={row.label}>{row.label}</p>
                      <a href={row.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 font-mono mt-0.5 group/url" title={`Open: ${row.url}`}>
                        <span className="truncate">{row.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-0 group-hover/url:opacity-100 transition-opacity" />
                      </a>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {row.category
                        ? <Badge color={CAT_COLOR[row.category] ?? 'gray'}>{catLabel(row.category)}</Badge>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>

                    {/* City */}
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[100px]">
                      <span className="truncate block" title={row.cityName ?? ''}>{row.cityName ?? '—'}</span>
                      {row.localityName && (
                        <span className="text-gray-400 truncate block" title={row.localityName}>{row.localityName}</span>
                      )}
                    </td>

                    {/* Meta Title */}
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">
                      <span className="block truncate" title={row.metaTitle ?? ''}>{row.metaTitle || <span className="italic text-gray-300">No meta title</span>}</span>
                    </td>

                    {/* Footer visibility toggle */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(row)} title={row.isActive ? 'Visible in footer — click to hide' : 'Hidden from footer — click to show'}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                        {row.isActive
                          ? <><Eye className="w-4 h-4 text-green-500" /><span className="text-green-600">Active</span></>
                          : <><EyeOff className="w-4 h-4 text-gray-400" /><span className="text-gray-400">Hidden</span></>}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={row.url} target="_blank" rel="noopener noreferrer"
                          title={`Open live page: ${row.url}`}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>
                        <Link href={`/admin/seo/footer-links?groupId=${row.groupId}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit in Footer Links">
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button onClick={() => confirmDelete([row.id])}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {data && data.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-500">
              Showing <strong>{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)}</strong> of <strong>{data.total.toLocaleString()}</strong> pages
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                  let p: number;
                  if (data.totalPages <= 7) p = i + 1;
                  else if (page <= 4) p = i + 1;
                  else if (page >= data.totalPages - 3) p = data.totalPages - 6 + i;
                  else p = page - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm dialog ───────────────────────────────────────────── */}
      {deleteIds.length > 0 && (
        <ConfirmDialog
          count={deleteIds.length}
          onConfirm={doDelete}
          onCancel={() => setDeleteIds([])}
          busy={deleting}
        />
      )}
    </div>
  );
}
