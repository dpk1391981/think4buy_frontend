'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical, Search, Tag } from 'lucide-react';

// Built-in categories seeded from constants — admin can add/edit/toggle
const BUILT_IN_SLUGS = ['buy', 'rent', 'pg', 'commercial', 'industrial', 'builder_project'];

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Buy',            slug: 'buy',             icon: '🏠', description: 'Properties for outright purchase',          isActive: true, sortOrder: 1 },
  { id: '2', name: 'Rent',           slug: 'rent',            icon: '🔑', description: 'Properties available for rent',             isActive: true, sortOrder: 2 },
  { id: '3', name: 'PG / Co-Living', slug: 'pg',              icon: '🛏️', description: 'PG accommodations and co-living spaces',      isActive: true, sortOrder: 3 },
  { id: '4', name: 'Commercial',     slug: 'commercial',      icon: '🏢', description: 'Offices, shops, warehouses, showrooms',      isActive: true, sortOrder: 4 },
  { id: '5', name: 'Industrial',     slug: 'industrial',      icon: '🏭', description: 'Factories, sheds, industrial plots',         isActive: true, sortOrder: 5 },
  { id: '6', name: 'New Projects',   slug: 'builder_project', icon: '🏗️', description: 'Under-construction builder projects',        isActive: true, sortOrder: 6 },
  { id: '7', name: 'Investment',     slug: 'investment',      icon: '📈', description: 'High-yield investment properties',           isActive: false, sortOrder: 7 },
];

const ICON_OPTIONS = ['🏠','🔑','🛏️','🏢','🏭','🏗️','📈','🏪','🌿','🏖️','🏔️','🏘️','🌆','🌉'];

const EMPTY: Omit<Category, 'id'> = { name: '', slug: '', icon: '🏠', description: '', isActive: true, sortOrder: 0 };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Omit<Category, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sortOrder: categories.length + 1 });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, isActive: cat.isActive, sortOrder: cat.sortOrder });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY);
    setShowIconPicker(false);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_').trim();

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: editing ? f.slug : generateSlug(name) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // simulate API
    if (editing) {
      setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      const newCat: Category = { ...form, id: Date.now().toString() };
      setCategories(prev => [...prev, newCat].sort((a, b) => a.sortOrder - b.sortOrder));
    }
    setSaving(false);
    closeModal();
  };

  const handleToggle = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && BUILT_IN_SLUGS.includes(cat.slug)) return; // Cannot disable built-in
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && BUILT_IN_SLUGS.includes(cat.slug)) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
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

  const activeCount = categories.filter(c => c.isActive).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active / {categories.length} total categories
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
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">Order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Description</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((cat, idx) => {
              const isBuiltIn = BUILT_IN_SLUGS.includes(cat.slug);
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
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{cat.slug}</code>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-500 text-xs line-clamp-1">{cat.description || '—'}</span>
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(cat.id)}
                      disabled={isBuiltIn}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        cat.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      } ${isBuiltIn ? 'cursor-not-allowed opacity-60' : 'hover:opacity-80'}`}
                      title={isBuiltIn ? 'System categories cannot be disabled' : undefined}
                    >
                      {cat.isActive
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

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No categories found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-4">
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
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary-600"
                />
                <span className="text-sm font-medium text-gray-700">Active (visible on site)</span>
              </label>
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
