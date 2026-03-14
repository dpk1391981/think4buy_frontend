'use client';

import { useState, useEffect, useCallback } from 'react';
import { articlesApi } from '@/lib/api';
import {
  Plus, Search, Edit2, Trash2, Eye, BookOpen, Star,
  ChevronLeft, ChevronRight, X, Tag, Globe, Image, FileText,
  CheckCircle, Clock, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'tips', label: 'Tips' },
  { value: 'market-insights', label: 'Market Insights' },
  { value: 'guides', label: 'Guides' },
  { value: 'legal', label: 'Legal' },
  { value: 'investment', label: 'Investment' },
];

const CATEGORY_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-700',
  tips: 'bg-green-100 text-green-700',
  'market-insights': 'bg-purple-100 text-purple-700',
  guides: 'bg-amber-100 text-amber-700',
  legal: 'bg-red-100 text-red-700',
  investment: 'bg-teal-100 text-teal-700',
};

type Tab = 'content' | 'seo' | 'media';

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'news',
  tags: [] as string[],
  status: 'draft',
  isFeatured: false,
  readTime: '',
  featuredImage: '',
  gallery: [] as string[],
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  ogImage: '',
  canonicalUrl: '',
};

function toSlug(t: string) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/--+/g, '-');
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>('content');
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [tagInput, setTagInput]     = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await articlesApi.adminList({ page, limit: 15, search: search || undefined, status: filterStatus || undefined, category: filterCategory || undefined });
      setArticles(res.data.items || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterCategory]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setActiveTab('content');
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(article: any) {
    setForm({
      title:         article.title || '',
      slug:          article.slug || '',
      excerpt:       article.excerpt || '',
      content:       article.content || '',
      category:      article.category || 'news',
      tags:          article.tags || [],
      status:        article.status || 'draft',
      isFeatured:    article.isFeatured || false,
      readTime:      article.readTime?.toString() || '',
      featuredImage: article.featuredImage || '',
      gallery:       article.gallery || [],
      metaTitle:     article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      metaKeywords:  article.metaKeywords || '',
      ogImage:       article.ogImage || '',
      canonicalUrl:  article.canonicalUrl || '',
    });
    setEditingId(article.id);
    setActiveTab('content');
    setFormError('');
    setModalOpen(true);
  }

  function handleTitleChange(title: string) {
    setForm(f => ({ ...f, title, slug: editingId ? f.slug : toSlug(title) }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  }

  function removeTag(t: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
  }

  function addGalleryUrl() {
    const u = galleryInput.trim();
    if (u && !form.gallery.includes(u)) setForm(f => ({ ...f, gallery: [...f.gallery, u] }));
    setGalleryInput('');
  }

  function removeGalleryUrl(u: string) {
    setForm(f => ({ ...f, gallery: f.gallery.filter(x => x !== u) }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError('Title is required'); setActiveTab('content'); return; }
    if (!form.content.trim()) { setFormError('Content is required'); setActiveTab('content'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        readTime: form.readTime ? Number(form.readTime) : undefined,
      };
      if (editingId) {
        await articlesApi.adminUpdate(editingId, payload);
      } else {
        await articlesApi.adminCreate(payload);
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await articlesApi.adminDelete(deleteId);
      setDeleteId(null);
      load();
    } catch { /* noop */ }
    finally { setDeleting(false); }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'seo',     label: 'SEO',     icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'media',   label: 'Media',   icon: <Image className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" /> Articles
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} articles total</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> New Article
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={load} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <BookOpen className="w-8 h-8" />
            <p className="text-sm">No articles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articles.map(article => (
                  <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {article.isFeatured && <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{article.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600')}>
                        {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {article.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="w-3 h-3" /> {article.viewCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : new Date(article.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {article.status === 'published' && (
                          <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View live">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => openEdit(article)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(article.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">Page {page} of {pages} ({total} total)</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create/Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[300] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 m-auto w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-white">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                    activeTab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg border border-red-100">{formError}</div>
              )}

              {/* ── Content tab ── */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                    <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                      placeholder="Article title..."
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Slug</label>
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                      placeholder="auto-generated-from-title"
                      className="input-field font-mono text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Read Time (mins)</label>
                      <input type="number" value={form.readTime} onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))}
                        placeholder="Auto-calculated if empty" className="input-field" min={1} />
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                          className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500" />
                        <span className="text-sm font-medium text-gray-700">Featured article</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Excerpt / Summary</label>
                    <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                      rows={2} placeholder="Short description shown in listing cards..."
                      className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Content * (Markdown supported)</label>
                    <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      rows={14} placeholder="## Article heading&#10;&#10;Write your article content here. Markdown formatting is supported."
                      className="input-field resize-y font-mono text-sm leading-relaxed" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {form.tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          <Tag className="w-2.5 h-2.5" />{t}
                          <button onClick={() => removeTag(t)} className="hover:text-red-500 ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="Add tag and press Enter..." className="input-field flex-1" />
                      <button type="button" onClick={addTag}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg text-gray-700 transition-colors">Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEO tab ── */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Title <span className="text-gray-400 font-normal">(max 60 chars)</span></label>
                    <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                      maxLength={200} placeholder="SEO title — leave blank to use article title"
                      className="input-field" />
                    <p className="text-xs text-gray-400 mt-1">{form.metaTitle.length}/200 chars</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Description <span className="text-gray-400 font-normal">(max 160 chars)</span></label>
                    <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                      maxLength={500} rows={3} placeholder="SEO description shown in Google search results..."
                      className="input-field resize-none" />
                    <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length}/500 chars</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Keywords</label>
                    <input value={form.metaKeywords} onChange={e => setForm(f => ({ ...f, metaKeywords: e.target.value }))}
                      placeholder="keyword1, keyword2, keyword3..."
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">OG Image URL <span className="text-gray-400 font-normal">(for social sharing)</span></label>
                    <input value={form.ogImage} onChange={e => setForm(f => ({ ...f, ogImage: e.target.value }))}
                      placeholder="https://..." className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Canonical URL <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))}
                      placeholder="https://www.think4buysale.com/articles/..." className="input-field" />
                  </div>
                  {/* SEO preview */}
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Google Preview</p>
                    <p className="text-base text-blue-700 font-medium leading-tight hover:underline cursor-pointer truncate">
                      {form.metaTitle || form.title || 'Article Title'}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      think4buysale.com › articles › {form.slug || 'slug'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {form.metaDescription || form.excerpt || 'Meta description will appear here...'}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Media tab ── */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Featured Image URL</label>
                    <input value={form.featuredImage} onChange={e => setForm(f => ({ ...f, featuredImage: e.target.value }))}
                      placeholder="https://..." className="input-field" />
                    {form.featuredImage && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-100">
                        <img src={form.featuredImage} alt="Featured" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Gallery Images</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {form.gallery.map((url, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 h-24 bg-gray-100">
                          <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <button onClick={() => removeGalleryUrl(url)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={galleryInput} onChange={e => setGalleryInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGalleryUrl(); } }}
                        placeholder="Paste image URL and press Enter..." className="input-field flex-1" />
                      <button type="button" onClick={addGalleryUrl}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg text-gray-700 transition-colors">Add</button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Add image URLs one by one. Supports jpg, png, webp.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setForm(f => ({ ...f, status: 'draft' })); setTimeout(handleSave, 0); }}
                  disabled={saving}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-50">
                  Save as Draft
                </button>
                <button onClick={() => { setForm(f => ({ ...f, status: 'published' })); setTimeout(handleSave, 0); }}
                  disabled={saving}
                  className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete confirm ───────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Delete Article?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone. The article will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
