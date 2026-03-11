'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Globe, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { adminApi } from '@/lib/api';

interface Country {
  id: string;
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY: Omit<Country, 'id'> = { name: '', code: '', dialCode: '', flag: '🌐', isActive: true, sortOrder: 0 };

const FLAG_OPTIONS = ['🇮🇳','🇺🇸','🇬🇧','🇦🇪','🇦🇺','🇨🇦','🇸🇬','🇩🇪','🇫🇷','🇯🇵','🇨🇳','🇧🇷','🇿🇦','🌐'];

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState<Omit<Country, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFlagPicker, setShowFlagPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.getCountries();
      setCountries(r.data || []);
    } catch { setCountries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sortOrder: countries.length });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Country) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, dialCode: c.dialCode || '', flag: c.flag || '🌐', isActive: c.isActive, sortOrder: c.sortOrder });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); setShowFlagPicker(false); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) { setError('Name and code are required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await adminApi.updateCountry(editing.id, form);
      } else {
        await adminApi.createCountry(form);
      }
      await load();
      closeModal();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCountry(id);
      await load();
    } catch { }
    setDeleteConfirm(null);
  };

  const handleToggle = async (c: Country) => {
    try {
      await adminApi.updateCountry(c.id, { isActive: !c.isActive });
      setCountries(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
    } catch { }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Country Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {countries.filter(c => c.isActive).length} active / {countries.length} total countries
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Country
        </button>
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
        <strong>Location Hierarchy:</strong> Country → State → City → Locality.
        Countries seed on first run. States and cities can be managed in <strong>Locations</strong>.
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Country', 'Code', 'Dial Code', 'Status', 'Sort', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{c.flag || '🌐'}</span>
                      <span className="font-semibold text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono">{c.code}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{c.dialCode || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        c.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {c.isActive ? <><ToggleRight className="w-3.5 h-3.5" />Active</> : <><ToggleLeft className="w-3.5 h-3.5" />Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No countries found
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Country' : 'Add Country'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}

              {/* Flag picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Flag Emoji</label>
                <div className="relative">
                  <button
                    onClick={() => setShowFlagPicker(p => !p)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 border border-gray-200 rounded-xl hover:border-primary-400 transition-colors"
                  >
                    <span className="text-2xl">{form.flag}</span>
                    <span className="text-sm text-gray-500">Click to change</span>
                  </button>
                  {showFlagPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-10 flex flex-wrap gap-2">
                      {FLAG_OPTIONS.map(f => (
                        <button key={f} onClick={() => { setForm(x => ({ ...x, flag: f })); setShowFlagPicker(false); }}
                          className={`text-2xl p-1.5 rounded-lg hover:bg-gray-100 ${form.flag === f ? 'bg-primary-50 ring-2 ring-primary-400' : ''}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Country Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="India" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">ISO Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 3) }))}
                    placeholder="IN" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dial Code</label>
                  <input type="text" value={form.dialCode} onChange={e => setForm(f => ({ ...f, dialCode: e.target.value }))}
                    placeholder="+91" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sort Order</label>
                <input type="number" value={form.sortOrder} min={0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded accent-primary-600" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Country'}
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
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete Country?</h3>
            <p className="text-sm text-gray-500 mb-6">States linked to this country will not be deleted but will lose the country association.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
