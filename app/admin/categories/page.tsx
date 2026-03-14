'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, Tag } from 'lucide-react';
import { propConfigAdminApi } from '@/lib/api';

// Built-in categories seeded from constants — admin can add/edit/toggle
const BUILT_IN_SLUGS = ['buy', 'rent', 'pg', 'commercial', 'industrial', 'builder_project'];

interface Faq {
  question: string;
  answer: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: boolean;
  sortOrder: number;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  introContent?: string;
  seoContent?: string;
  faqs?: Faq[];
}

const ICON_OPTIONS = ['🏠','🔑','🛏️','🏢','🏭','🏗️','📈','🏪','🌿','🏖️','🏔️','🏘️','🌆','🌉'];

const EMPTY: Omit<Category, 'id'> = {
  name: '', slug: '', icon: '🏠', description: '', status: true, sortOrder: 0,
  h1: '', metaTitle: '', metaDescription: '', metaKeywords: '', introContent: '', seoContent: '', faqs: [],
};

type TabType = 'basic' | 'seo';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Omit<Category, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propConfigAdminApi.getCategories();
      setCategories(res.data || []);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sortOrder: categories.length + 1 });
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      status: cat.status,
      sortOrder: cat.sortOrder,
      h1: cat.h1 || '',
      metaTitle: cat.metaTitle || '',
      metaDescription: cat.metaDescription || '',
      metaKeywords: cat.metaKeywords || '',
      introContent: cat.introContent || '',
      seoContent: cat.seoContent || '',
      faqs: cat.faqs || [],
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY);
    setShowIconPicker(false);
    setActiveTab('basic');
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').trim();

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: editing ? f.slug : generateSlug(name) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        icon: form.icon,
        description: form.description,
        status: form.status,
        sortOrder: form.sortOrder,
        h1: form.h1 || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        metaKeywords: form.metaKeywords || null,
        introContent: form.introContent || null,
        seoContent: form.seoContent || null,
        faqs: form.faqs && form.faqs.length > 0 ? form.faqs : null,
      };
      if (editing) {
        await propConfigAdminApi.updateCategory(editing.id, payload);
      } else {
        await propConfigAdminApi.createCategory(payload);
      }
      await fetchCategories();
      closeModal();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    try {
      await propConfigAdminApi.updateCategory(id, { status: !cat.status });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, status: !c.status } : c));
    } catch {
      setError('Failed to toggle status');
    }
  };

  const handleDelete = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && BUILT_IN_SLUGS.includes(cat.slug)) return;
    try {
      await propConfigAdminApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete category');
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setCategories(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    });
  };

  const moveDown = (idx: number) => {
    if (idx === filtered.length - 1) return;
    setCategories(prev => {
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    });
  };

  // FAQ helpers
  const addFaq = () => {
    setForm(f => ({ ...f, faqs: [...(f.faqs || []), { question: '', answer: '' }] }));
  };

  const updateFaq = (idx: number, field: 'question' | 'answer', value: string) => {
    setForm(f => {
      const faqs = [...(f.faqs || [])];
      faqs[idx] = { ...faqs[idx], [field]: value };
      return { ...f, faqs };
    });
  };

  const removeFaq = (idx: number) => {
    setForm(f => ({ ...f, faqs: (f.faqs || []).filter((_, i) => i !== idx) }));
  };

  const activeCount = categories.filter(c => c.status).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${activeCount} active / ${categories.length} total categories`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
          <div className="text-sm text-gray-500">Total Categories</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-400">{categories.length - activeCount}</div>
          <div className="text-sm text-gray-500">Inactive</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">SEO</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((cat, idx) => {
                const isBuiltIn = BUILT_IN_SLUGS.includes(cat.slug);
                const hasSeo = !!(cat.metaTitle || cat.introContent || cat.seoContent);
                return (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Sort order */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                        >▲</button>
                        <span className="text-xs text-gray-400 font-mono">{cat.sortOrder}</span>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === filtered.length - 1}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                        >▼</button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {cat.name}
                            {isBuiltIn && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">System</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-1">{cat.description || '—'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{cat.slug}</code>
                    </td>

                    {/* SEO indicator */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {hasSeo ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">SEO Ready</span>
                      ) : (
                        <span className="text-[10px] bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">No SEO</span>
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(cat.id)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          cat.status
                            ? 'bg-emerald-50 text-emerald-700 hover:opacity-80'
                            : 'bg-gray-100 text-gray-500 hover:opacity-80'
                        }`}
                      >
                        {cat.status
                          ? <><ToggleRight className="w-3.5 h-3.5" />Active</>
                          : <><ToggleLeft className="w-3.5 h-3.5" />Inactive</>
                        }
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isBuiltIn && (
                          <button
                            onClick={() => setDeleteConfirm(cat.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No categories found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'seo'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                SEO Content
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  {/* Icon picker */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Icon</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowIconPicker(p => !p)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 border border-gray-200 rounded-xl hover:border-primary-400 transition-colors"
                      >
                        <span className="text-2xl">{form.icon}</span>
                        <span className="text-sm text-gray-500">Click to change icon</span>
                      </button>
                      {showIconPicker && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-10 flex flex-wrap gap-2">
                          {ICON_OPTIONS.map(ic => (
                            <button
                              key={ic}
                              onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); }}
                              className={`text-2xl p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${form.icon === ic ? 'bg-primary-50 ring-2 ring-primary-400' : ''}`}
                            >{ic}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Buy, Rent, Commercial"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Slug *</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                      placeholder="e.g. buy, rent, commercial"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">URL-safe identifier (lowercase, underscores only)</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description of this category..."
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sort Order</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      min={1}
                      onChange={(e) => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.status}
                      onChange={(e) => setForm(f => ({ ...f, status: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (visible on site)</span>
                  </label>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">H1 Heading</label>
                    <input
                      type="text"
                      value={form.h1 || ''}
                      onChange={(e) => setForm(f => ({ ...f, h1: e.target.value }))}
                      placeholder="e.g. Buy Property in India – Apartments, Villas & Plots"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Meta Title</label>
                    <input
                      type="text"
                      value={form.metaTitle || ''}
                      onChange={(e) => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                      placeholder="SEO page title (50–60 chars)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">{(form.metaTitle || '').length}/200 chars</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Meta Description</label>
                    <textarea
                      value={form.metaDescription || ''}
                      onChange={(e) => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                      placeholder="SEO meta description (150–160 chars)"
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{(form.metaDescription || '').length}/500 chars</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Meta Keywords</label>
                    <input
                      type="text"
                      value={form.metaKeywords || ''}
                      onChange={(e) => setForm(f => ({ ...f, metaKeywords: e.target.value }))}
                      placeholder="comma separated keywords"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Intro Content</label>
                    <textarea
                      value={form.introContent || ''}
                      onChange={(e) => setForm(f => ({ ...f, introContent: e.target.value }))}
                      placeholder="Short introductory paragraph shown at the top of the page..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">SEO Content</label>
                    <textarea
                      value={form.seoContent || ''}
                      onChange={(e) => setForm(f => ({ ...f, seoContent: e.target.value }))}
                      placeholder="Detailed SEO content (separate paragraphs with blank lines)..."
                      rows={6}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Use blank lines to separate paragraphs</p>
                  </div>

                  {/* FAQs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">FAQs</label>
                      <button
                        onClick={addFaq}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add FAQ
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(form.faqs || []).map((faq, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500">FAQ {idx + 1}</span>
                            <button
                              onClick={() => removeFaq(idx)}
                              className="text-gray-300 hover:text-red-500 transition-colors text-xs"
                            >✕</button>
                          </div>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                            placeholder="Question"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 mb-2 bg-white"
                          />
                          <textarea
                            value={faq.answer}
                            onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                            placeholder="Answer"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none bg-white"
                          />
                        </div>
                      ))}
                      {(!form.faqs || form.faqs.length === 0) && (
                        <p className="text-xs text-gray-400 text-center py-4">No FAQs yet. Click "Add FAQ" to add one.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.slug.trim()}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete Category?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This category will be permanently removed. Existing properties in this category will not be affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
