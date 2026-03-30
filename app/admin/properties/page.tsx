'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle, XCircle, Trash2, Star, StarOff, Power, PowerOff,
  Search, ExternalLink, Pencil, MoreVertical, Crown, RotateCcw,
  Globe, EyeOff, Link2, FileText, Settings2, X, RefreshCw, Info,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import OptimizedImage from '@/components/common/OptimizedImage';
import { resolveImageUrl } from '@/lib/imageUtils';

const STATUS_TABS = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Drafts',   value: 'draft' },
];

const PLAN_BADGE: Record<string, string> = {
  free:     'bg-gray-100 text-gray-600',
  basic:    'bg-blue-100 text-blue-700',
  premium:  'bg-purple-100 text-purple-700',
  featured: 'bg-yellow-100 text-yellow-700',
};

const APPROVAL_BADGE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  draft:    'bg-gray-100 text-gray-600',
};

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending:  'bg-orange-100 text-orange-700',
  sold:     'bg-blue-100 text-blue-700',
  rented:   'bg-indigo-100 text-indigo-700',
};

function formatPrice(p: number): string {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)} L`;
  return `₹${p.toLocaleString()}`;
}

/** Converts a title into a URL-friendly slug */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── SEO Modal ────────────────────────────────────────────────────────────────

interface SeoModalProps {
  property: any;
  onClose: () => void;
  onSaved: () => void;
}

function SeoModal({ property: p, onClose, onSaved }: SeoModalProps) {
  const [slug, setSlug]             = useState(p.slug || '');
  const [metaTitle, setMetaTitle]   = useState(p.metaTitle || '');
  const [metaDesc, setMetaDesc]     = useState(p.metaDescription || '');
  const [indexing, setIndexing]     = useState<boolean>(p.allowIndexing === true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [slugError, setSlugError]   = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

  const autoSlug = () => {
    const generated = slugify(p.title || '');
    setSlug(generated);
    setSlugError('');
  };

  const handleSlugChange = (val: string) => {
    // Allow only lowercase letters, digits, hyphens
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(clean);
    setSlugError('');
  };

  const validateSlug = (val: string) => {
    if (!val) return 'Slug is required';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val)) return 'Use lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)';
    return '';
  };

  const save = async () => {
    const err = validateSlug(slug);
    if (err) { setSlugError(err); return; }
    setSaving(true);
    setError('');
    try {
      await adminApi.updatePropertySeo(p.id, {
        slug: slug !== p.slug ? slug : undefined,
        metaTitle:       metaTitle || undefined,
        metaDescription: metaDesc  || undefined,
        allowIndexing:   indexing,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const autoTitle = p.metaTitle ? '' : `${p.title} | ${p.city}`;
  const autoDesc  = p.metaDescription ? '' : `${p.bedrooms ? p.bedrooms + ' BHK ' : ''}${p.type || ''} for ${p.category || ''} in ${p.locality || ''}, ${p.city || ''}. ${p.area ? p.area + ' sqft. ' : ''}Contact now.`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">SEO Settings</h2>
              <p className="text-xs text-gray-500 truncate max-w-xs">{p.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Indexing Toggle */}
          <div className="rounded-xl border-2 transition-colors p-4 cursor-pointer select-none"
            style={{ borderColor: indexing ? '#7c3aed' : '#e5e7eb', background: indexing ? '#f5f3ff' : '#f9fafb' }}
            onClick={() => setIndexing(v => !v)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${indexing ? 'bg-violet-600' : 'bg-gray-200'}`}>
                  {indexing ? <Globe className="w-4.5 h-4.5 text-white" size={18} /> : <EyeOff className="w-4.5 h-4.5 text-gray-500" size={18} />}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${indexing ? 'text-violet-900' : 'text-gray-700'}`}>
                    {indexing ? 'Indexed by Search Engines' : 'Not Indexed (noindex)'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {indexing
                      ? 'This page will appear in Google, Bing, etc.'
                      : 'Search engines will ignore this listing page'}
                  </div>
                </div>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${indexing ? 'bg-violet-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${indexing ? 'left-5.5' : 'left-0.5'}`} style={{ left: indexing ? '22px' : '2px' }} />
              </div>
            </div>
            {indexing && (
              <div className="mt-3 flex items-start gap-2 text-xs text-violet-700 bg-violet-100 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Make sure meta title, description, and slug are filled out before indexing for best SEO results.</span>
              </div>
            )}
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-gray-400" /> URL Slug
              </label>
              <button
                onClick={autoSlug}
                type="button"
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Auto-generate from title
              </button>
            </div>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-violet-400">
              <span className="bg-gray-50 px-3 py-2.5 text-xs text-gray-400 border-r border-gray-200 flex items-center whitespace-nowrap">
                /properties/
              </span>
              <input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. 3bhk-apartment-gurgaon-sector-56"
                className="flex-1 px-3 py-2.5 text-sm outline-none bg-white font-mono"
              />
            </div>
            {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
            <p className="text-xs text-gray-400 mt-1">
              Preview: <span className="font-mono text-gray-600">{baseUrl}/properties/{slug || '…'}</span>
            </p>
          </div>

          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" /> Meta Title
              </label>
              <span className={`text-xs font-medium ${metaTitle.length > 60 ? 'text-red-500' : metaTitle.length > 50 ? 'text-amber-500' : 'text-gray-400'}`}>
                {metaTitle.length}/200
              </span>
            </div>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={200}
              placeholder={autoTitle || 'Leave blank to auto-generate from title'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
            <p className="text-xs text-gray-400 mt-1">Ideal length: 50–60 characters. Shown in browser tab and Google results.</p>
            {/* SERP Preview */}
            {(metaTitle || autoTitle) && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-[11px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Google Preview</div>
                <div className="text-blue-600 text-sm font-medium truncate">{metaTitle || autoTitle}</div>
                <div className="text-green-600 text-xs mt-0.5 truncate">{baseUrl}/properties/{slug}</div>
                <div className="text-gray-500 text-xs mt-0.5 line-clamp-2">{metaDesc || autoDesc}</div>
              </div>
            )}
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-gray-400" /> Meta Description
              </label>
              <span className={`text-xs font-medium ${metaDesc.length > 160 ? 'text-red-500' : metaDesc.length > 130 ? 'text-amber-500' : 'text-gray-400'}`}>
                {metaDesc.length}/500
              </span>
            </div>
            <textarea
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={autoDesc || 'Leave blank to auto-generate from property details'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Ideal length: 120–160 characters. Shown below the title in Google results.</p>
          </div>

          {/* Canonical note */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
            <span>
              A canonical URL is set automatically when indexing is enabled.
              The property detail page also uses these fields for Open Graph (social sharing) and JSON-LD structured data.
            </span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save SEO Settings'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────

interface ActionMenuProps {
  property: any;
  onApprove: () => void;
  onReject: () => void;
  onReactivate: () => void;
  onToggleStatus: () => void;
  onToggleFeatured: () => void;
  onTogglePremium: () => void;
  onEditSeo: () => void;
  onDelete: () => void;
  loading: boolean;
}

function ActionMenu({ property: p, onApprove, onReject, onReactivate, onToggleStatus, onToggleFeatured, onTogglePremium, onEditSeo, onDelete, loading }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
          <div
            className="fixed w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-[201] py-1 overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <Link
              href={`/properties/${p.slug}`}
              target="_blank"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              View on Site
            </Link>

            <Link
              href={`/post-property?edit=${p.id}`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Pencil className="w-4 h-4" />
              Edit Property
            </Link>

            <button
              onClick={() => { onEditSeo(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-violet-700 hover:bg-violet-50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Edit SEO
            </button>

            <div className="border-t border-gray-100 my-1" />

            {p.approvalStatus !== 'approved' && (
              <button
                onClick={() => { onApprove(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Listing
              </button>
            )}
            {p.approvalStatus === 'rejected' && (
              <button
                onClick={() => { onReactivate(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reactivate (set Pending)
              </button>
            )}
            {p.approvalStatus !== 'rejected' && (
              <button
                onClick={() => { onReject(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject Listing
              </button>
            )}

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={() => { onToggleFeatured(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
            >
              {p.isFeatured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              {p.isFeatured ? 'Remove Featured' : 'Mark as Featured'}
            </button>

            <button
              onClick={() => { onTogglePremium(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Crown className="w-4 h-4" />
              {p.isPremium ? 'Remove Premium' : 'Mark as Premium'}
            </button>

            <button
              onClick={() => { onToggleStatus(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {p.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              {p.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Permanently
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [seoProperty, setSeoProperty] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (activeStatus === 'draft') {
        params.isDraft = true;
      } else if (activeStatus) {
        params.approvalStatus = activeStatus;
      }
      if (search) params.search = search;
      const r = await adminApi.getProperties(params);
      setProperties(r.data.items || r.data.properties || []);
      setTotal(r.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => { load(); }, [load]);

  const withLoading = async (id: string, fn: () => Promise<any>) => {
    setActionLoading(id);
    try { await fn(); await load(); }
    finally { setActionLoading(null); }
  };

  const approve       = (id: string) => withLoading(id, () => adminApi.approveProperty(id));
  const reactivate    = (id: string) => withLoading(id, () => adminApi.reactivateProperty(id));
  const toggleStatus  = (id: string) => withLoading(id, () => adminApi.togglePropertyStatus(id));
  const toggleFeatured = (id: string) => withLoading(id, () => adminApi.togglePropertyFeatured(id));
  const togglePremium = (id: string) => withLoading(id, () => adminApi.togglePropertyPremium(id));

  const reject = async () => {
    if (!rejectId) return;
    await withLoading(rejectId, () => adminApi.rejectProperty(rejectId, rejectReason));
    setRejectId(null);
    setRejectReason('');
  };

  const deleteProperty = async () => {
    if (!deleteId) return;
    await withLoading(deleteId, () => adminApi.deleteProperty(deleteId));
    setDeleteId(null);
  };

  const pendingCount = properties.filter(p => p.approvalStatus === 'pending' && !p.isDraft).length;

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total listings</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm font-medium">
            <span className="w-5 h-5 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center font-bold">{pendingCount}</span>
            Pending review
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setActiveStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeStatus === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search title, city, owner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-gray-500">No properties found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Property', 'Owner', 'Price', 'Plan', 'SEO', 'Approval', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Property */}
                    <td className="px-5 py-3 max-w-[260px]">
                      <div className="flex items-start gap-3">
                        {p.images?.[0]?.url ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                            <OptimizedImage src={resolveImageUrl(p.images[0].url)} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate text-sm">{p.title}</div>
                          <div className="text-gray-400 text-xs mt-0.5">{p.city} · {p.locality}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.isFeatured && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">
                                <Star className="w-2.5 h-2.5" fill="currentColor" /> Featured
                              </span>
                            )}
                            {p.isPremium && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full font-semibold">
                                <Crown className="w-2.5 h-2.5" /> Premium
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3">
                      <div className="text-gray-800 text-sm">{p.owner?.name || '—'}</div>
                      <div className="text-gray-400 text-xs capitalize">{p.owner?.role}</div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-gray-700 font-semibold whitespace-nowrap">
                      {formatPrice(p.price)}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PLAN_BADGE[p.listingPlan] || 'bg-gray-100 text-gray-600'}`}>
                        {p.listingPlan}
                      </span>
                    </td>

                    {/* SEO status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSeoProperty(p)}
                        title="Edit SEO settings"
                        className="flex flex-col gap-1 group"
                      >
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                          p.allowIndexing
                            ? 'bg-violet-50 text-violet-700 border-violet-200 group-hover:bg-violet-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-gray-200'
                        }`}>
                          {p.allowIndexing ? <Globe className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                          {p.allowIndexing ? 'Indexed' : 'noindex'}
                        </span>
                        {(p.metaTitle || p.metaDescription) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <FileText className="w-2.5 h-2.5" /> Meta set
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Approval status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.isDraft ? APPROVAL_BADGE['draft'] : APPROVAL_BADGE[p.approvalStatus]}`}>
                        {p.isDraft ? 'Draft' : p.approvalStatus}
                      </span>
                    </td>

                    {/* Active status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.approvalStatus === 'pending' && !p.isDraft && (
                          <button
                            onClick={() => approve(p.id)}
                            disabled={actionLoading === p.id}
                            title="Approve"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <ActionMenu
                          property={p}
                          loading={actionLoading === p.id}
                          onApprove={() => approve(p.id)}
                          onReject={() => { setRejectId(p.id); setRejectReason(''); }}
                          onReactivate={() => reactivate(p.id)}
                          onToggleStatus={() => toggleStatus(p.id)}
                          onToggleFeatured={() => toggleFeatured(p.id)}
                          onTogglePremium={() => togglePremium(p.id)}
                          onEditSeo={() => setSeoProperty(p)}
                          onDelete={() => setDeleteId(p.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, Math.ceil(total / 15)) }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pg ? 'bg-primary-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {pg}
                </button>
              ))}
              {Math.ceil(total / 15) > 5 && page < Math.ceil(total / 15) && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 h-8 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 text-gray-600"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SEO Modal */}
      {seoProperty && (
        <SeoModal
          property={seoProperty}
          onClose={() => setSeoProperty(null)}
          onSaved={load}
        />
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Reject Listing</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason so the owner can improve and resubmit.</p>
            <textarea
              placeholder="e.g. Poor quality images, missing details, suspicious pricing..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={reject}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button onClick={() => setRejectId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete Property?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the listing and all its images, inquiries, and data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={deleteProperty}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
