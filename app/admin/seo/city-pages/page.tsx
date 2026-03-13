'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Globe, Search } from 'lucide-react';
import { seoApi } from '@/lib/api';

const PAGE_TYPE_OPTIONS = [
  { value: 'buy', label: 'Buy Property' },
  { value: 'rent', label: 'Rent Property' },
  { value: 'pg', label: 'PG / Co-Living' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'new_projects', label: 'New Projects' },
];

function toSlug(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function autoSlug(cityName: string, pageType: string): string {
  const citySlug = toSlug(cityName);
  if (!citySlug) return '';
  switch (pageType) {
    case 'buy': return `buy-property-in-${citySlug}`;
    case 'rent': return `rent-property-in-${citySlug}`;
    case 'pg': return `pg-in-${citySlug}`;
    case 'commercial': return `commercial-property-in-${citySlug}`;
    case 'new_projects': return `new-projects-in-${citySlug}`;
    default: return `property-in-${citySlug}`;
  }
}

const EMPTY_FORM = {
  cityName: '',
  pageType: 'buy',
  slug: '',
  h1: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  introContent: '',
  seoContent: '',
  faqs: [] as { question: string; answer: string }[],
  isActive: true,
};

export default function AdminCityPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await seoApi.adminGetCityPages({ page, limit: 15, search: search || undefined });
      setPages(r.data.items || []);
      setTotal(r.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      cityName: p.cityName || '',
      pageType: p.pageType || 'buy',
      slug: p.slug || '',
      h1: p.h1 || '',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      metaKeywords: p.metaKeywords || '',
      introContent: p.introContent || '',
      seoContent: p.seoContent || '',
      faqs: p.faqs || [],
      isActive: p.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await seoApi.adminUpdateCityPage(editId, form);
      } else {
        await seoApi.adminCreateCityPage(form);
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await seoApi.adminDeleteCityPage(deleteId);
      setDeleteId(null);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete');
    }
  };

  const addFaq = () => setForm(f => ({ ...f, faqs: [...f.faqs, { question: '', answer: '' }] }));
  const removeFaq = (i: number) => setForm(f => ({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) }));
  const updateFaq = (i: number, field: 'question' | 'answer', val: string) =>
    setForm(f => ({ ...f, faqs: f.faqs.map((faq, idx) => idx === i ? { ...faq, [field]: val } : faq) }));

  const handleCityOrTypeChange = (cityName: string, pageType: string) => {
    const generatedSlug = autoSlug(cityName, pageType);
    setForm(f => {
      const currentAutoSlug = autoSlug(f.cityName, f.pageType);
      const shouldAutoUpdate = f.slug === '' || f.slug === currentAutoSlug;
      return { ...f, cityName, pageType, slug: shouldAutoUpdate ? generatedSlug : f.slug };
    });
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">City SEO Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage dynamic SEO content for city landing pages</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New City Page
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search city or slug..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : pages.length === 0 ? (
          <div className="p-16 text-center">
            <Globe className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No city pages yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['City', 'Page Type', 'Slug', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.cityName}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.pageType?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {(page - 1) * 15 + 1}&ndash;{Math.min(page * 15, total)} of {total}</span>
            <div className="flex gap-2">
              {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-3 h-8 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">&#8592; Prev</button>}
              {page * 15 < total && <button onClick={() => setPage(p => p + 1)} className="px-3 h-8 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">Next &#8594;</button>}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">{editId ? 'Edit City SEO Page' : 'New City SEO Page'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl">&#xd7;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Basic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City Name *</label>
                  <input value={form.cityName} onChange={(e) => handleCityOrTypeChange(e.target.value, form.pageType)}
                    placeholder="e.g. Mumbai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Page Type *</label>
                  <select value={form.pageType} onChange={(e) => handleCityOrTypeChange(form.cityName, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400">
                    {PAGE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Slug * <span className="font-normal text-gray-400">(URL path, auto-generated)</span></label>
                <input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="buy-property-in-mumbai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">H1 Heading</label>
                <input value={form.h1} onChange={(e) => setForm(f => ({ ...f, h1: e.target.value }))}
                  placeholder="Buy Property in Mumbai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                <input value={form.metaTitle} onChange={(e) => setForm(f => ({ ...f, metaTitle: e.target.value }))} maxLength={200}
                  placeholder="Buy Property in Mumbai - Think4BuySale" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea value={form.metaDescription} onChange={(e) => setForm(f => ({ ...f, metaDescription: e.target.value }))} maxLength={500} rows={2}
                  placeholder="Find the best properties for sale in Mumbai..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Keywords</label>
                <input value={form.metaKeywords} onChange={(e) => setForm(f => ({ ...f, metaKeywords: e.target.value }))}
                  placeholder="buy property mumbai, mumbai flats for sale, ..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Intro Content <span className="font-normal text-gray-400">(shown at top of page)</span></label>
                <textarea value={form.introContent} onChange={(e) => setForm(f => ({ ...f, introContent: e.target.value }))} rows={3}
                  placeholder="Mumbai is India's financial capital..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SEO Content <span className="font-normal text-gray-400">(shown at bottom of page)</span></label>
                <textarea value={form.seoContent} onChange={(e) => setForm(f => ({ ...f, seoContent: e.target.value }))} rows={4}
                  placeholder="Detailed SEO article content..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>

              {/* FAQs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">FAQs</label>
                  <button onClick={addFaq} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                    <Plus className="w-3 h-3" /> Add FAQ
                  </button>
                </div>
                <div className="space-y-3">
                  {form.faqs.map((faq, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">FAQ #{i + 1}</span>
                        <button onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <input value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)}
                        placeholder="Question..." className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                      <textarea value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} rows={2}
                        placeholder="Answer..." className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Status:</label>
                <button
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {form.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={handleSave} disabled={saving || !form.cityName || !form.slug}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Page'}
              </button>
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-5xl mb-3">&#x1F5D1;&#xFE0F;</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete City Page?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete the city SEO page.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
