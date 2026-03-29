'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Search, Globe, FileText, ExternalLink } from 'lucide-react';
import { seoApi } from '@/lib/api';

interface AgentCitySeo {
  id: string;
  citySlug: string;
  cityName: string;
  slug: string;
  h1Title?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  introContent?: string;
  bottomContent?: string;
  faqJson?: { question: string; answer: string }[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaJson?: string;
  robots?: string;
  isActive: boolean;
}

const EMPTY_FORM = {
  citySlug: '',
  cityName: '',
  slug: '',
  h1Title: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  introContent: '',
  bottomContent: '',
  faqJson: [] as { question: string; answer: string }[],
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  schemaJson: '',
  robots: 'index,follow',
  isActive: true,
};

type Form = typeof EMPTY_FORM;

// ── FAQ Editor ────────────────────────────────────────────────────────────────
function FaqEditor({ faqs, onChange }: {
  faqs: { question: string; answer: string }[];
  onChange: (v: { question: string; answer: string }[]) => void;
}) {
  const add = () => onChange([...faqs, { question: '', answer: '' }]);
  const remove = (i: number) => onChange(faqs.filter((_, idx) => idx !== i));
  const update = (i: number, key: 'question' | 'answer', val: string) => {
    const next = [...faqs];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-600 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            value={faq.question}
            onChange={e => update(i, 'question', e.target.value)}
            placeholder="Question"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            value={faq.answer}
            onChange={e => update(i, 'answer', e.target.value)}
            placeholder="Answer"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
      ))}
      <button type="button" onClick={add}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
}

// ── Slide-Over ────────────────────────────────────────────────────────────────
function SlideOver({
  open, onClose, editId, form, setForm, onSave, saving,
}: {
  open: boolean; onClose: () => void; editId: string | null;
  form: Form; setForm: (fn: (f: Form) => Form) => void;
  onSave: () => void; saving: boolean;
}) {
  const [tab, setTab] = useState<'basic' | 'seo' | 'og'>('basic');

  if (!open) return null;

  const field = (label: string, key: keyof Form, opts?: { placeholder?: string; hint?: string; mono?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{opts?.hint && <span className="ml-1 text-gray-400 font-normal">{opts.hint}</span>}
      </label>
      <input
        type="text"
        value={(form[key] as string) || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${opts?.mono ? 'font-mono' : ''}`}
      />
    </div>
  );

  const textarea = (label: string, key: keyof Form, opts?: { placeholder?: string; rows?: number; hint?: string; mono?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{opts?.hint && <span className="ml-1 text-gray-400 font-normal">{opts.hint}</span>}
      </label>
      <textarea
        value={(form[key] as string) || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        rows={opts?.rows || 3}
        className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-y ${opts?.mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editId ? 'Edit Agent Listing SEO' : 'New Agent Listing SEO'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure SEO for /agents-in-[city] pages</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-0 flex-shrink-0">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['basic', 'seo', 'og'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'basic' && <><FileText className="w-3.5 h-3.5" /> Basic</>}
                {t === 'seo' && <><Globe className="w-3.5 h-3.5" /> SEO Content</>}
                {t === 'og' && <><ExternalLink className="w-3.5 h-3.5" /> OG / Schema</>}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {field('City Name', 'cityName', { placeholder: 'Noida' })}
                {field('City Slug', 'citySlug', { placeholder: 'noida', mono: true })}
              </div>
              {field('URL Slug', 'slug', { placeholder: 'agents-in-noida', mono: true, hint: 'auto-generated if empty' })}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Robots</label>
                <select value={form.robots} onChange={e => setForm(f => ({ ...f, robots: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="index,follow">index, follow</option>
                  <option value="noindex,follow">noindex, follow</option>
                  <option value="noindex,nofollow">noindex, nofollow</option>
                  <option value="index,nofollow">index, nofollow</option>
                </select>
              </div>
            </>
          )}

          {tab === 'seo' && (
            <>
              {field('H1 Title', 'h1Title', { placeholder: 'Real Estate Agents in {city}' })}
              {field('Meta Title', 'metaTitle', { placeholder: 'Top Agents in {city} | Think4BuySale' })}
              {textarea('Meta Description', 'metaDescription', { placeholder: 'Find RERA-certified agents in {city}...', rows: 3 })}
              {field('Meta Keywords', 'metaKeywords', { placeholder: 'agents noida, brokers noida, RERA noida' })}
              {field('Canonical URL', 'canonicalUrl', { placeholder: 'https://www.think4buysale.com/agents-in-noida', mono: true })}
              {textarea('Intro Content (Top)', 'introContent', {
                placeholder: 'HTML content displayed above the agent listing...',
                rows: 5,
              })}
              {textarea('Bottom Content', 'bottomContent', {
                placeholder: 'HTML content displayed below the agent listing...',
                rows: 5,
              })}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">FAQs</label>
                <FaqEditor
                  faqs={form.faqJson}
                  onChange={faqs => setForm(f => ({ ...f, faqJson: faqs }))}
                />
              </div>
            </>
          )}

          {tab === 'og' && (
            <>
              {field('OG Title', 'ogTitle', { placeholder: 'Find Top Agents in Noida' })}
              {textarea('OG Description', 'ogDescription', { placeholder: 'Connect with verified agents...', rows: 3 })}
              {field('OG Image URL', 'ogImage', { placeholder: 'https://...', mono: true })}
              {textarea('Custom Schema JSON-LD', 'schemaJson', {
                placeholder: '{"@context":"https://schema.org","@type":"..."}',
                rows: 8,
                mono: true,
                hint: 'Optional — paste raw JSON-LD',
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AgentListingSeoPage() {
  const [items, setItems] = useState<AgentCitySeo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await seoApi.adminGetAgentCityPages({ page, limit: 20, search: search || undefined });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setError('Failed to load agent city SEO pages');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(item: AgentCitySeo) {
    setEditId(item.id);
    setForm({
      citySlug: item.citySlug,
      cityName: item.cityName,
      slug: item.slug,
      h1Title: item.h1Title || '',
      metaTitle: item.metaTitle || '',
      metaDescription: item.metaDescription || '',
      metaKeywords: item.metaKeywords || '',
      canonicalUrl: item.canonicalUrl || '',
      introContent: item.introContent || '',
      bottomContent: item.bottomContent || '',
      faqJson: item.faqJson || [],
      ogTitle: item.ogTitle || '',
      ogDescription: item.ogDescription || '',
      ogImage: item.ogImage || '',
      schemaJson: item.schemaJson || '',
      robots: item.robots || 'index,follow',
      isActive: item.isActive,
    });
    setPanelOpen(true);
  }

  async function handleSave() {
    if (!form.citySlug || !form.cityName) {
      setError('City name and slug are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const slug = form.slug || `agents-in-${form.citySlug}`;
      const payload = { ...form, slug };
      if (editId) {
        await seoApi.adminUpdateAgentCityPage(editId, payload);
      } else {
        await seoApi.adminCreateAgentCityPage(payload);
      }
      setPanelOpen(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, cityName: string) {
    if (!confirm(`Delete SEO config for "${cityName}"?`)) return;
    try {
      await seoApi.adminDeleteAgentCityPage(id);
      load();
    } catch {
      setError('Failed to delete');
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Listing SEO</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage SEO content for <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/agents-in-[city]</code> pages
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition-colors">
          <Plus className="w-4 h-4" /> Add City
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by city name or slug..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">City</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">URL Slug</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Meta Title</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-400">
                No agent city SEO pages yet. Click "Add City" to create one.
              </td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{item.cityName}</div>
                  <div className="text-xs text-gray-400 font-mono">{item.citySlug}</div>
                </td>
                <td className="px-4 py-3">
                  <a href={`/agents-in-${item.citySlug}`} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1">
                    /{item.slug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                  {item.metaTitle || <span className="text-gray-300 italic">Not set</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id, item.cityName)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{total} total entries</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <SlideOver
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        editId={editId}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
