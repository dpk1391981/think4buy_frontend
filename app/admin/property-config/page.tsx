'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, GripVertical, X, Check, Tag,
  Building2, Layers, Star, Settings2, AlertTriangle, Filter,
} from 'lucide-react';
import { propConfigAdminApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropCategory {
  id: string; name: string; slug: string; icon: string;
  description: string; status: boolean; sortOrder: number;
}
interface PropType {
  id: string; name: string; slug: string; icon: string;
  status: boolean; sortOrder: number; categoryId: string;
  aliasOf?: string | null;
  category?: { id: string; name: string };
}
interface Amenity {
  id: string; name: string; icon: string; category: string; status: boolean;
}
interface Field {
  id: string; propTypeId: string; fieldName: string; fieldLabel: string;
  fieldType: string; optionsJson: string[] | null; placeholder: string;
  isRequired: boolean; sortOrder: number;
}

const TABS = [
  { key: 'categories',      label: 'Categories',     icon: Tag },
  { key: 'types',           label: 'Property Types',  icon: Building2 },
  { key: 'amenities',       label: 'Amenities',       icon: Star },
  { key: 'fields',          label: 'Form Fields',     icon: Settings2 },
  { key: 'listing-filters', label: 'Listing Filters', icon: Filter },
] as const;

type Tab = typeof TABS[number]['key'];

const FIELD_TYPES = ['text', 'number', 'dropdown', 'checkbox', 'radio', 'textarea', 'dependent'];
const ICON_OPTIONS = ['🏠','🔑','🛏️','🏢','🏭','🏗️','📈','🏪','🌿','🏖️','🏔️','🏘️','🌆',
                      '🏙️','🏡','📐','🖥️','🛍️','🏬','💼','🌾','📍','📌','🌐','🏚️'];

function toast(msg: string, ok = true) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.className = `fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-xl ${ok ? 'bg-emerald-600' : 'bg-red-600'}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── Shared: Delete Dialog ────────────────────────────────────────────────────

function DeleteDialog({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 text-lg mb-1">Delete {label}?</h3>
        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: Categories ────────────────────────────────────────────────────────

function CategoriesTab() {
  const [cats, setCats] = useState<PropCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PropCategory | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const EMPTY = { name: '', slug: '', icon: '🏠', description: '', status: true, sortOrder: 0 };
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await propConfigAdminApi.getCategories(); setCats(r.data); }
    catch { toast('Failed to load categories', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const genSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').trim();

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, sortOrder: cats.length + 1 }); setShowModal(true); };
  const openEdit = (c: PropCategory) => { setEditing(c); setForm({ name: c.name, slug: c.slug, icon: c.icon, description: c.description, status: c.status, sortOrder: c.sortOrder }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setShowIconPicker(false); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      if (editing) { await propConfigAdminApi.updateCategory(editing.id, form); toast('Category updated'); }
      else { await propConfigAdminApi.createCategory(form); toast('Category created'); }
      await load(); closeModal();
    } catch (e: any) { toast(e?.response?.data?.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleToggle = async (c: PropCategory) => {
    try { await propConfigAdminApi.updateCategory(c.id, { status: !c.status }); await load(); }
    catch { toast('Toggle failed', false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await propConfigAdminApi.deleteCategory(delId); toast('Category deleted'); await load(); }
    catch (e: any) { toast(e?.response?.data?.message || 'Delete failed', false); }
    finally { setDelId(null); }
  };

  const filtered = cats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 w-52 bg-white" />
          </div>
          <span className="text-sm text-gray-500">{cats.filter(c=>c.status).length} active / {cats.length} total</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Description</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.icon}</span>
                      <span className="font-semibold text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{c.slug}</code>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-500 text-xs line-clamp-1">{c.description || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(c)} className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors', c.status ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                      {c.status ? <><ToggleRight className="w-3.5 h-3.5" />Active</> : <><ToggleLeft className="w-3.5 h-3.5" />Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDelId(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No categories found</div>}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Icon */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Icon</label>
                <button onClick={() => setShowIconPicker(p => !p)} className="flex items-center gap-3 w-full px-3 py-2.5 border border-gray-200 rounded-xl hover:border-primary-400 transition-colors">
                  <span className="text-2xl">{form.icon}</span>
                  <span className="text-sm text-gray-500">Click to change</span>
                </button>
                {showIconPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-10 flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); }} className={cn('text-2xl p-1.5 rounded-lg hover:bg-gray-100', form.icon === ic && 'bg-primary-50 ring-2 ring-primary-400')}>{ic}</button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : genSlug(e.target.value) }))} placeholder="e.g. Residential" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="e.g. residential" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sort Order</label>
                <input type="number" value={form.sortOrder} min={0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Active (visible on site)</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.slug.trim()} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && <DeleteDialog label="Category" onConfirm={handleDelete} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ─── Tab 2: Property Types ────────────────────────────────────────────────────

function PropertyTypesTab() {
  const [types, setTypes] = useState<PropType[]>([]);
  const [cats, setCats] = useState<PropCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PropType | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const EMPTY = { name: '', slug: '', icon: '🏙️', categoryId: '', status: true, sortOrder: 0, aliasOf: '' };
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, cr] = await Promise.all([propConfigAdminApi.getTypes(), propConfigAdminApi.getCategories()]);
      setTypes(tr.data); setCats(cr.data);
    } catch { toast('Failed to load', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const genSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').trim();
  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, sortOrder: types.length + 1 }); setShowModal(true); };
  const openEdit = (t: PropType) => { setEditing(t); setForm({ name: t.name, slug: t.slug, icon: t.icon, categoryId: t.categoryId, status: t.status, sortOrder: t.sortOrder, aliasOf: t.aliasOf ?? '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setShowIconPicker(false); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.categoryId) return;
    setSaving(true);
    try {
      const payload = { ...form, aliasOf: form.aliasOf?.trim() || null };
      if (editing) { await propConfigAdminApi.updateType(editing.id, payload); toast('Type updated'); }
      else { await propConfigAdminApi.createType(payload); toast('Type created'); }
      await load(); closeModal();
    } catch (e: any) { toast(e?.response?.data?.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleToggle = async (t: PropType) => {
    try { await propConfigAdminApi.updateType(t.id, { status: !t.status }); await load(); }
    catch { toast('Toggle failed', false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await propConfigAdminApi.deleteType(delId); toast('Deleted'); await load(); }
    catch (e: any) { toast(e?.response?.data?.message || 'Delete failed', false); }
    finally { setDelId(null); }
  };

  const filtered = types.filter(t =>
    (filterCat === '' || t.categoryId === filterCat) &&
    (t.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by category for display
  const grouped = cats.reduce<Record<string, PropType[]>>((acc, c) => {
    acc[c.id] = filtered.filter(t => t.categoryId === c.id);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search types..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 w-44 bg-white" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white">
            <option value="">All Categories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <span className="text-sm text-gray-500">{types.filter(t=>t.status).length} active / {types.length} total</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Type
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-4">
          {cats.map(cat => {
            const catTypes = grouped[cat.id] || [];
            if (filterCat && filterCat !== cat.id) return null;
            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <span className="text-xs text-gray-400 ml-1">({catTypes.length} types)</span>
                </div>
                {catTypes.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 text-xs">No types — <button onClick={() => { setForm(f => ({ ...f, categoryId: cat.id })); setShowModal(true); }} className="text-primary-600 hover:underline">Add one</button></div>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-50">
                      {catTypes.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 w-12 text-xs text-gray-400 font-mono">{t.sortOrder}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{t.icon}</span>
                              <span className="font-medium text-gray-900">{t.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex flex-col gap-0.5">
                              <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{t.slug}</code>
                              {t.aliasOf && <span className="text-xs text-amber-600">alias of: {t.aliasOf}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => handleToggle(t)} className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium', t.status ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                              {t.status ? <><ToggleRight className="w-3.5 h-3.5" />Active</> : <><ToggleLeft className="w-3.5 h-3.5" />Inactive</>}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => setDelId(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Property Type' : 'Add Property Type'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Icon */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Icon</label>
                <button onClick={() => setShowIconPicker(p => !p)} className="flex items-center gap-3 w-full px-3 py-2.5 border border-gray-200 rounded-xl hover:border-primary-400">
                  <span className="text-2xl">{form.icon}</span><span className="text-sm text-gray-500">Click to change</span>
                </button>
                {showIconPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-10 flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(ic => <button key={ic} onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); }} className={cn('text-2xl p-1.5 rounded-lg hover:bg-gray-100', form.icon === ic && 'bg-primary-50 ring-2 ring-primary-400')}>{ic}</button>)}
                  </div>
                )}
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                  <option value="">Select category...</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : genSlug(e.target.value) }))} placeholder="e.g. Apartment" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '_') }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Alias Of (Slug)</label>
                <input type="text" value={form.aliasOf} onChange={e => setForm(f => ({ ...f, aliasOf: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="e.g. apartment (leave blank if standalone)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono" />
                <p className="text-xs text-gray-400 mt-1">Set to group this type with another. e.g. flat → apartment</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sort Order</label>
                  <input type="number" value={form.sortOrder} min={0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.categoryId} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && <DeleteDialog label="Property Type" onConfirm={handleDelete} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ─── Tab 3: Amenities ─────────────────────────────────────────────────────────

function AmenitiesTab() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [types, setTypes] = useState<PropType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Mapping modal
  const [mapType, setMapType] = useState<PropType | null>(null);
  const [mappedIds, setMappedIds] = useState<string[]>([]);
  const [mapSaving, setMapSaving] = useState(false);

  const EMPTY = { name: '', icon: '', category: 'basic', status: true };
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, tr] = await Promise.all([propConfigAdminApi.getAmenities(), propConfigAdminApi.getTypes()]);
      setAmenities(ar.data); setTypes(tr.data);
    } catch { toast('Failed to load', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (a: Amenity) => { setEditing(a); setForm({ name: a.name, icon: a.icon || '', category: a.category, status: a.status }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) { await propConfigAdminApi.updateAmenity(editing.id, form); toast('Amenity updated'); }
      else { await propConfigAdminApi.createAmenity(form); toast('Amenity created'); }
      await load(); closeModal();
    } catch (e: any) { toast(e?.response?.data?.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleToggle = async (a: Amenity) => {
    try { await propConfigAdminApi.updateAmenity(a.id, { status: !a.status }); await load(); }
    catch { toast('Toggle failed', false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await propConfigAdminApi.deleteAmenity(delId); toast('Deleted'); await load(); }
    catch (e: any) { toast(e?.response?.data?.message || 'Delete failed', false); }
    finally { setDelId(null); }
  };

  const openMap = async (t: PropType) => {
    setMapType(t);
    try {
      const r = await propConfigAdminApi.getTypeAmenities(t.id);
      setMappedIds(r.data.map((x: any) => x.amenityId));
    } catch { setMappedIds([]); }
  };

  const saveMap = async () => {
    if (!mapType) return;
    setMapSaving(true);
    try { await propConfigAdminApi.setTypeAmenities(mapType.id, mappedIds); toast('Mapping saved'); setMapType(null); }
    catch { toast('Save failed', false); }
    finally { setMapSaving(false); }
  };

  const toggleMap = (id: string) => setMappedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filtered = amenities.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search amenities..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 w-52 bg-white" />
          </div>
          <span className="text-sm text-gray-500">{amenities.filter(a=>a.status).length} active / {amenities.length} total</span>
        </div>
        <div className="flex gap-2">
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 shadow-sm">
            <Plus className="w-4 h-4" /> Add Amenity
          </button>
        </div>
      </div>

      {/* Amenities table + Type Mapping side-by-side on large screens */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Amenities list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <div className="py-16 text-center text-gray-400 text-sm">Loading...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amenity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Icon Key</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {a.icon ? <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{a.icon}</code> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(a)} className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium', a.status ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                        {a.status ? <><ToggleRight className="w-3.5 h-3.5" />Active</> : <><ToggleLeft className="w-3.5 h-3.5" />Inactive</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDelId(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <div className="py-12 text-center text-gray-400 text-sm">No amenities found</div>}
        </div>

        {/* Map amenities to property types */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Map to Property Type</p>
            <p className="text-xs text-gray-400 mt-0.5">Select a type to configure amenities</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {types.map(t => (
              <button key={t.id} onClick={() => openMap(t)} className={cn('w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm', mapType?.id === t.id && 'bg-primary-50')}>
                <span className="text-base">{t.icon}</span>
                <span className="flex-1 font-medium text-gray-800">{t.name}</span>
                {t.category && <span className="text-xs text-gray-400">{t.category.name}</span>}
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mapping Panel */}
      {mapType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Amenities for {mapType.icon} {mapType.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{mappedIds.length} selected</p>
              </div>
              <button onClick={() => setMapType(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {amenities.filter(a => a.status).map(a => {
                  const checked = mappedIds.includes(a.id);
                  return (
                    <label key={a.id} className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all', checked ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:border-gray-200')}>
                      <input type="checkbox" checked={checked} onChange={() => toggleMap(a.id)} className="sr-only" />
                      <div className={cn('w-4 h-4 rounded flex items-center justify-center flex-shrink-0', checked ? 'bg-primary-600' : 'border-2 border-gray-300')}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{a.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setMapType(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveMap} disabled={mapSaving} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                {mapSaving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Amenity' : 'Add Amenity'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Amenity Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Swimming Pool" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Icon Key</label>
                <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. pool, gym, security" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono" />
                <p className="text-xs text-gray-400 mt-1">Material icon name or emoji</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                  <option value="basic">Basic</option>
                  <option value="society">Society</option>
                  <option value="security">Security</option>
                  <option value="recreation">Recreation</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Amenity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && <DeleteDialog label="Amenity" onConfirm={handleDelete} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ─── Tab 4: Form Fields ───────────────────────────────────────────────────────

function FormFieldsTab() {
  const [types, setTypes] = useState<PropType[]>([]);
  const [cats, setCats] = useState<PropCategory[]>([]);
  const [selectedType, setSelectedType] = useState<PropType | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  const EMPTY_FIELD = { fieldName: '', fieldLabel: '', fieldType: 'text', optionsJson: null as string[] | null, placeholder: '', isRequired: false, sortOrder: 0 };
  const [form, setForm] = useState(EMPTY_FIELD);
  const [optionInput, setOptionInput] = useState('');

  const loadMeta = useCallback(async () => {
    try {
      const [tr, cr] = await Promise.all([propConfigAdminApi.getTypes(), propConfigAdminApi.getCategories()]);
      setTypes(tr.data); setCats(cr.data);
    } catch { toast('Failed to load types', false); }
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const loadFields = useCallback(async (typeId: string) => {
    setLoading(true);
    try { const r = await propConfigAdminApi.getFields(typeId); setFields(r.data); }
    catch { toast('Failed to load fields', false); }
    finally { setLoading(false); }
  }, []);

  const selectType = (t: PropType) => { setSelectedType(t); loadFields(t.id); };

  const genKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').trim();

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FIELD, sortOrder: fields.length + 1 }); setOptionInput(''); setShowModal(true); };
  const openEdit = (f: Field) => {
    setEditing(f);
    setForm({ fieldName: f.fieldName, fieldLabel: f.fieldLabel, fieldType: f.fieldType, optionsJson: f.optionsJson, placeholder: f.placeholder || '', isRequired: f.isRequired, sortOrder: f.sortOrder });
    setOptionInput('');
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const needsOptions = ['dropdown', 'radio', 'checkbox', 'dependent'].includes(form.fieldType);

  const addOption = () => {
    const v = optionInput.trim();
    if (!v) return;
    setForm(f => ({ ...f, optionsJson: [...(f.optionsJson || []), v] }));
    setOptionInput('');
  };

  const removeOption = (idx: number) => {
    setForm(f => ({ ...f, optionsJson: (f.optionsJson || []).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.fieldLabel.trim() || !form.fieldName.trim() || !selectedType) return;
    if (needsOptions && (!form.optionsJson || form.optionsJson.length === 0)) {
      toast('Please add at least one option', false); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, optionsJson: needsOptions ? form.optionsJson : null };
      if (editing) { await propConfigAdminApi.updateField(editing.id, payload); toast('Field updated'); }
      else { await propConfigAdminApi.createField(selectedType.id, payload); toast('Field created'); }
      await loadFields(selectedType.id); closeModal();
    } catch (e: any) { toast(e?.response?.data?.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delId || !selectedType) return;
    try { await propConfigAdminApi.deleteField(delId); toast('Deleted'); await loadFields(selectedType.id); }
    catch { toast('Delete failed', false); }
    finally { setDelId(null); }
  };

  const filteredTypes = types.filter(t => filterCat === '' || t.categoryId === filterCat);
  const groupedTypes = cats.reduce<Record<string, PropType[]>>((acc, c) => {
    acc[c.id] = filteredTypes.filter(t => t.categoryId === c.id);
    return acc;
  }, {});

  const FIELD_TYPE_COLORS: Record<string, string> = {
    text: 'bg-blue-50 text-blue-700', number: 'bg-purple-50 text-purple-700',
    dropdown: 'bg-orange-50 text-orange-700', radio: 'bg-pink-50 text-pink-700',
    checkbox: 'bg-teal-50 text-teal-700', textarea: 'bg-gray-100 text-gray-600',
    dependent: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 min-h-[500px]">
      {/* Left: type selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Select Property Type</p>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-400 bg-white">
            <option value="">All Categories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
          {cats.map(cat => {
            const catTypes = groupedTypes[cat.id] || [];
            if (filterCat && filterCat !== cat.id) return null;
            if (!catTypes.length) return null;
            return (
              <div key={cat.id}>
                <div className="px-4 py-2 bg-gray-50/70">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat.icon} {cat.name}</span>
                </div>
                {catTypes.map(t => (
                  <button key={t.id} onClick={() => selectType(t)} className={cn('w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm', selectedType?.id === t.id && 'bg-primary-50 border-r-2 border-primary-500')}>
                    <span className="text-base">{t.icon}</span>
                    <span className={cn('flex-1 font-medium', selectedType?.id === t.id ? 'text-primary-700' : 'text-gray-800')}>{t.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: fields */}
      <div className="lg:col-span-2">
        {!selectedType ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex items-center justify-center">
            <div className="text-center text-gray-400 p-8">
              <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a property type to manage its form fields</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-100 px-4 py-3">
              <div>
                <p className="font-semibold text-gray-900">{selectedType.icon} {selectedType.name} — Form Fields</p>
                <p className="text-xs text-gray-400 mt-0.5">{fields.length} fields configured</p>
              </div>
              <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700">
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-400 text-sm">Loading fields...</div>
            ) : fields.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No fields yet. <button onClick={openAdd} className="text-primary-600 hover:underline">Add the first field</button></p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Label</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Field Key</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Required</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fields.map((f, idx) => (
                      <tr key={f.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{f.sortOrder || idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {f.fieldLabel}
                          {f.optionsJson && f.optionsJson.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {f.optionsJson.slice(0, 4).map(o => <span key={o} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{o}</span>)}
                              {f.optionsJson.length > 4 && <span className="text-[10px] text-gray-400">+{f.optionsJson.length - 4} more</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{f.fieldName}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-1 rounded-lg font-semibold', FIELD_TYPE_COLORS[f.fieldType] || 'bg-gray-100 text-gray-600')}>{f.fieldType}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {f.isRequired ? <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-semibold">Yes</span> : <span className="text-xs text-gray-300">No</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDelId(f.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Field' : 'Add Field'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Field Label *</label>
                  <input type="text" value={form.fieldLabel} onChange={e => setForm(f => ({ ...f, fieldLabel: e.target.value, fieldName: editing ? f.fieldName : genKey(e.target.value) }))} placeholder="e.g. Carpet Area" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Field Key *</label>
                  <input type="text" value={form.fieldName} onChange={e => setForm(f => ({ ...f, fieldName: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="e.g. carpet_area" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Field Type *</label>
                  <select value={form.fieldType} onChange={e => setForm(f => ({ ...f, fieldType: e.target.value, optionsJson: null }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sort Order</label>
                  <input type="number" value={form.sortOrder} min={0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
              {/* Placeholder (hidden for dependent — we use placeholder field for unit options) */}
              {form.fieldType !== 'dependent' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Placeholder</label>
                  <input type="text" value={form.placeholder} onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))} placeholder="e.g. 950" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              )}
              {/* Options for dropdown/radio/checkbox/dependent */}
              {needsOptions && (
                <div className="space-y-4">
                  {/* Label options */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                      {form.fieldType === 'dependent' ? 'Label Options (select column) *' : 'Options *'}
                    </label>
                    {form.fieldType === 'dependent' && (
                      <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 mb-2">
                        Each row: <strong>Label (select)</strong> → <strong>Number</strong> → <strong>Unit (select)</strong>. Users can add multiple rows.
                      </p>
                    )}
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="Type option and press Enter" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
                      <button onClick={addOption} className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(form.optionsJson || []).map((o, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg">
                          {o}
                          <button onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    {(!form.optionsJson || !form.optionsJson.length) && <p className="text-xs text-amber-600 mt-1">At least one option required</p>}
                  </div>
                  {/* Unit options — only for dependent field type, stored in placeholder as pipe-separated */}
                  {form.fieldType === 'dependent' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Unit Options (unit column)</label>
                      <input
                        type="text"
                        value={form.placeholder}
                        onChange={e => setForm(f => ({ ...f, placeholder: e.target.value }))}
                        placeholder="e.g. sq.ft|sq.m|acres|cents|Unit"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">Separate units with <code className="bg-gray-100 px-1 rounded">|</code> — leave empty to hide unit column</p>
                      {form.placeholder && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {form.placeholder.split('|').map(u => u.trim()).filter(Boolean).map(u => (
                            <span key={u} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-lg font-medium">{u}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm(f => ({ ...f, isRequired: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Required field</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.fieldLabel.trim() || !form.fieldName.trim()} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Field'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && <DeleteDialog label="Field" onConfirm={handleDelete} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ─── Tab 5: Listing Filters ───────────────────────────────────────────────────

const WIDGET_TYPES = [
  { value: 'price_range',    label: 'Price Range (preset chips)' },
  { value: 'bedroom_select', label: 'Bedroom Select (BHK chips)' },
  { value: 'property_type',  label: 'Property Type (from DB)' },
  { value: 'area_range',     label: 'Area Range (preset chips)' },
  { value: 'option_select',  label: 'Option Select (custom options)' },
  { value: 'amenity_picker', label: 'Amenity Picker (from DB)' },
  { value: 'text_input',     label: 'Text Search Input' },
  { value: 'toggle_boolean', label: 'Boolean Toggle' },
];

const ALL_CATEGORIES = ['buy', 'rent', 'pg', 'commercial', 'industrial', 'builder_project', 'investment'];

interface LFC {
  id: string; filterKey: string; label: string; icon: string | null;
  widgetType: string; optionsJson: {value: string; label: string}[] | null;
  categories: string[]; defaultOpen: boolean; showOnMobile: boolean;
  isActive: boolean; sortOrder: number;
}

function ListingFiltersTab() {
  const [items,    setItems]    = useState<LFC[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal,setShowModal]= useState(false);
  const [editing,  setEditing]  = useState<LFC | null>(null);
  const [delId,    setDelId]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const EMPTY: Omit<LFC, 'id'> = {
    filterKey: '', label: '', icon: '', widgetType: 'option_select',
    optionsJson: [], categories: [], defaultOpen: false, showOnMobile: true,
    isActive: true, sortOrder: 0,
  };
  const [form, setForm] = useState<Omit<LFC, 'id'>>(EMPTY);
  const [optInput, setOptInput] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await propConfigAdminApi.getListingFilters(); setItems(r.data); }
    catch { toast('Failed to load filters', false); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sortOrder: items.length + 1 });
    setOptInput('');
    setShowModal(true);
  };

  const openEdit = (f: LFC) => {
    setEditing(f);
    setForm({
      filterKey: f.filterKey, label: f.label, icon: f.icon || '',
      widgetType: f.widgetType, optionsJson: f.optionsJson || [],
      categories: f.categories, defaultOpen: f.defaultOpen,
      showOnMobile: f.showOnMobile, isActive: f.isActive, sortOrder: f.sortOrder,
    });
    setOptInput('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.filterKey.trim() || !form.label.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, optionsJson: form.optionsJson?.length ? form.optionsJson : null };
      if (editing) { await propConfigAdminApi.updateListingFilter(editing.id, payload); toast('Filter updated'); }
      else         { await propConfigAdminApi.createListingFilter(payload); toast('Filter created'); }
      await load(); closeModal();
    } catch (e: any) { toast(e?.response?.data?.message || 'Error', false); }
    finally { setSaving(false); }
  };

  const handleToggle = async (f: LFC) => {
    try { await propConfigAdminApi.updateListingFilter(f.id, { isActive: !f.isActive }); await load(); }
    catch { toast('Toggle failed', false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try { await propConfigAdminApi.deleteListingFilter(delId); toast('Filter deleted'); await load(); }
    catch { toast('Delete failed', false); }
    finally { setDelId(null); }
  };

  const addOption = () => {
    const trimmed = optInput.trim();
    if (!trimmed) return;
    const [value, ...rest] = trimmed.split(':');
    const label = rest.join(':').trim() || value.trim();
    setForm(f => ({ ...f, optionsJson: [...(f.optionsJson || []), { value: value.trim(), label }] }));
    setOptInput('');
  };

  const removeOption = (idx: number) =>
    setForm(f => ({ ...f, optionsJson: (f.optionsJson || []).filter((_, i) => i !== idx) }));

  const toggleCategory = (slug: string) =>
    setForm(f => ({
      ...f,
      categories: f.categories.includes(slug)
        ? f.categories.filter(c => c !== slug)
        : [...f.categories, slug],
    }));

  const showOptions = ['option_select'].includes(form.widgetType);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {items.filter(f => f.isActive).length} active / {items.length} total —
          <span className="ml-1 text-gray-400">Defines which filters appear in the property listing sidebar.</span>
        </p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 shadow-sm">
          <Plus className="w-4 h-4" /> Add Filter
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-2">
          {items.map(f => (
            <div key={f.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <span className="text-lg w-6 text-center flex-shrink-0">{f.icon || '—'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                  <span className="text-xs text-gray-400 font-mono">{f.filterKey}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{f.widgetType}</span>
                  {f.categories.length > 0 && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {f.categories.join(', ')}
                    </span>
                  )}
                  {f.categories.length === 0 && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">All categories</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleToggle(f)}
                  className={cn('p-1.5 rounded-lg transition-colors', f.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100')}
                  title={f.isActive ? 'Disable' : 'Enable'}
                >
                  {f.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(f)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDelId(f.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] rounded-t-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Filter' : 'Add Listing Filter'}</h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Filter Key + Label */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Filter Key *</label>
                  <input
                    value={form.filterKey}
                    onChange={e => setForm(f => ({ ...f, filterKey: e.target.value.trim() }))}
                    placeholder="e.g. furnishingStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">URL query param name</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Label *</label>
                  <input
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Furnishing"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              {/* Icon + Widget Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Icon (emoji)</label>
                  <input
                    value={form.icon || ''}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🏠"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Widget Type *</label>
                  <select
                    value={form.widgetType}
                    onChange={e => setForm(f => ({ ...f, widgetType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
                  >
                    {WIDGET_TYPES.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options (for option_select) */}
              {showOptions && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Options</label>
                  <div className="space-y-1.5 mb-2">
                    {(form.optionsJson || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-mono text-gray-500 flex-1">{opt.value}</span>
                        <span className="text-xs text-gray-700 flex-1">{opt.label}</span>
                        <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={optInput}
                      onChange={e => setOptInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addOption()}
                      placeholder="value:Label (e.g. furnished:Furnished)"
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                    />
                    <button onClick={addOption} className="px-3 py-1.5 bg-primary-600 text-white rounded-xl text-xs font-semibold">
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Format: <code>value:Display Label</code> — if no colon, value is used as label</p>
                </div>
              )}

              {/* Categories */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  Show for Categories
                  <span className="font-normal text-gray-400 ml-1">(empty = all categories)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map(slug => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleCategory(slug)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        form.categories.includes(slug)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-primary-400',
                      )}
                    >
                      {slug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.defaultOpen} onChange={e => setForm(f => ({ ...f, defaultOpen: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                  <span className="text-xs font-medium text-gray-700">Open by default</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.showOnMobile} onChange={e => setForm(f => ({ ...f, showOnMobile: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                  <span className="text-xs font-medium text-gray-700">Show on mobile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary-600 rounded" />
                  <span className="text-xs font-medium text-gray-700">Active</span>
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.filterKey.trim() || !form.label.trim()}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Filter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {delId && <DeleteDialog label="Filter" onConfirm={handleDelete} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertyConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Property Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage property categories, types, amenities, and dynamic form fields
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-6 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                activeTab === tab.key
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'categories'      && <CategoriesTab />}
      {activeTab === 'types'           && <PropertyTypesTab />}
      {activeTab === 'amenities'       && <AmenitiesTab />}
      {activeTab === 'fields'          && <FormFieldsTab />}
      {activeTab === 'listing-filters' && <ListingFiltersTab />}
    </div>
  );
}
