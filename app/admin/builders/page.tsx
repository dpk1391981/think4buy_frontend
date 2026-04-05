'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi } from '@/lib/api';
import { resolveImageSrc } from '@/components/common/OptimizedImage';
import {
  HardHat, Plus, Search, Pencil, Trash2, CheckCircle2, XCircle,
  Upload, X, ChevronLeft, ChevronRight, Globe, Building2, BadgeCheck,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Builder {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  builderCompanyName: string | null;
  builderReraNumber: string | null;
  builderExperience: number | null;
  builderWebsite: string | null;
  builderLogo: string | null;
  builderProjectCount: number;
  builderVerified: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  city: '', state: '', builderCompanyName: '',
  builderReraNumber: '', builderExperience: '',
  builderWebsite: '', builderProjectCount: '0',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBuildersPage() {
  const [builders, setBuilders]   = useState<Builder[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [actionId, setActionId]   = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<'create' | 'edit' | 'logo' | null>(null);
  const [editTarget, setEditTarget] = useState<Builder | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Logo upload
  const [logoFile, setLogoFile]   = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LIMIT = 15;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.getBuilders({ page, limit: LIMIT, search: search || undefined });
      setBuilders(r.data.items ?? []);
      setTotal(r.data.total ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // ── Open modals ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setModal('create');
  }

  function openEdit(b: Builder) {
    setEditTarget(b);
    setForm({
      name: b.name,
      email: b.email,
      password: '',
      phone: b.phone ?? '',
      city: b.city ?? '',
      state: b.state ?? '',
      builderCompanyName: b.builderCompanyName ?? '',
      builderReraNumber: b.builderReraNumber ?? '',
      builderExperience: b.builderExperience != null ? String(b.builderExperience) : '',
      builderWebsite: b.builderWebsite ?? '',
      builderProjectCount: String(b.builderProjectCount ?? 0),
    });
    setFormError('');
    setModal('edit');
  }

  function openLogo(b: Builder) {
    setEditTarget(b);
    setLogoFile(null);
    setLogoPreview(b.builderLogo ?? null);
    setModal('logo');
  }

  function closeModal() {
    setModal(null);
    setEditTarget(null);
    setLogoFile(null);
    setLogoPreview(null);
    setFormError('');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setFormError('');
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        builderCompanyName: form.builderCompanyName,
        builderReraNumber: form.builderReraNumber || undefined,
        builderExperience: form.builderExperience ? parseInt(form.builderExperience) : undefined,
        builderWebsite: form.builderWebsite || undefined,
        builderProjectCount: parseInt(form.builderProjectCount) || 0,
      };
      if (modal === 'create') {
        if (!form.password) { setFormError('Password is required'); return; }
        payload.password = form.password;
        await adminApi.createBuilder(payload);
      } else if (editTarget) {
        if (form.password) payload.password = form.password;
        await adminApi.updateBuilder(editTarget.id, payload);
      }
      closeModal();
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this builder? This cannot be undone.')) return;
    setActionId(id);
    try { await adminApi.deleteBuilder(id); load(); }
    catch { alert('Failed to delete builder'); }
    finally { setActionId(null); }
  }

  async function handleToggleVerify(id: string) {
    setActionId(id);
    try { await adminApi.toggleBuilderVerified(id); load(); }
    finally { setActionId(null); }
  }

  async function handleLogoUpload() {
    if (!logoFile || !editTarget) return;
    setSaving(true);
    try {
      await adminApi.uploadBuilderLogo(editTarget.id, logoFile);
      closeModal();
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? 'Upload failed');
    } finally {
      setSaving(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary-600" /> Builders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} builder{total !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Builder
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, company or RERA…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : builders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <HardHat className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No builders match your search.' : 'No builders yet. Click "Add Builder" to create one.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Builder</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Company / RERA</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Projects</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {builders.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">

                    {/* Builder avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => openLogo(b)}
                          title="Click to upload logo"
                          className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0 cursor-pointer border-2 border-transparent hover:border-primary-400 transition-colors"
                        >
                          {b.builderLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resolveImageSrc(b.builderLogo)} alt={b.builderCompanyName ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-indigo-600 font-bold text-xs">
                              {(b.builderCompanyName ?? b.name).slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{b.name}</p>
                          <p className="text-[11px] text-gray-400">{b.city ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Company / RERA */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {b.builderCompanyName ?? <span className="text-gray-400 italic">Not set</span>}
                      </p>
                      {b.builderReraNumber && (
                        <p className="text-[11px] text-gray-400 mt-0.5">RERA: {b.builderReraNumber}</p>
                      )}
                      {b.builderWebsite && (
                        <a href={b.builderWebsite} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-primary-500 hover:underline flex items-center gap-0.5 mt-0.5">
                          <Globe className="w-3 h-3" /> Website
                        </a>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{b.email}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{b.phone ?? '—'}</p>
                    </td>

                    {/* Projects */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                        {b.builderProjectCount}
                      </span>
                      {b.builderExperience != null && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{b.builderExperience} yrs exp</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${b.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {b.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {b.builderVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 w-fit">
                            <BadgeCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle verify */}
                        <button
                          onClick={() => handleToggleVerify(b.id)}
                          disabled={actionId === b.id}
                          title={b.builderVerified ? 'Remove verification' : 'Mark as verified'}
                          className={`p-1.5 rounded-lg transition-colors ${b.builderVerified ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          {actionId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                        </button>

                        {/* Upload logo */}
                        <button
                          onClick={() => openLogo(b)}
                          title="Upload brand logo"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(b)}
                          title="Edit builder"
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={actionId === b.id}
                          title="Delete builder"
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {total} builders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HardHat className="w-5 h-5 text-primary-600" />
                {modal === 'create' ? 'Add Builder' : 'Edit Builder'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account info */}
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
              </div>

              <Field label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Godrej Properties Admin" />
              <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="admin@example.com" />
              <Field
                label={modal === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                placeholder={modal === 'create' ? 'Min 8 characters' : '••••••••'}
              />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 9876543210" />
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Mumbai" />
              <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} placeholder="Maharashtra" />

              {/* Company info */}
              <div className="sm:col-span-2 mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company Details</p>
              </div>

              <Field label="Company Name *" value={form.builderCompanyName} onChange={(v) => setForm({ ...form, builderCompanyName: v })} placeholder="Godrej Properties Ltd." className="sm:col-span-2" />
              <Field label="RERA Number" value={form.builderReraNumber} onChange={(v) => setForm({ ...form, builderReraNumber: v })} placeholder="A51800000001" />
              <Field label="Experience (years)" type="number" value={form.builderExperience} onChange={(v) => setForm({ ...form, builderExperience: v })} placeholder="e.g. 25" />
              <Field label="Website URL" value={form.builderWebsite} onChange={(v) => setForm({ ...form, builderWebsite: v })} placeholder="https://www.example.com" />
              <Field label="Total Projects Delivered" type="number" value={form.builderProjectCount} onChange={(v) => setForm({ ...form, builderProjectCount: v })} placeholder="e.g. 120" />
            </div>

            {formError && (
              <p className="mx-6 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{formError}</p>
            )}

            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === 'create' ? 'Create Builder' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logo Upload Modal ─────────────────────────────────────────────── */}
      {modal === 'logo' && editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-600" /> Brand Logo
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-500 mb-4">
                Upload a brand logo for <strong>{editTarget.builderCompanyName ?? editTarget.name}</strong>.
                Max 5 MB · JPEG / PNG / WebP. Stored as WebP.
              </p>

              {/* Preview */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors overflow-hidden mb-4 bg-gray-50"
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImageSrc(logoPreview)} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400 p-3">
                    <Upload className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-xs">Click to select</span>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />

              {logoFile && (
                <p className="text-xs text-center text-gray-500 mb-4">{logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)</p>
              )}

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">{formError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleLogoUpload}
                disabled={saving || !logoFile}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Upload Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', placeholder = '', className = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
      />
    </div>
  );
}
