'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Zap, Plus, Trash2, MapPin, Phone, User,
  CheckCircle, XCircle, RefreshCw, Calendar,
} from 'lucide-react';
import { agencyApi, adminApi } from '@/lib/api';

const TOP_CITIES = [
  'Delhi','Mumbai','Bangalore','Hyderabad','Chennai',
  'Pune','Noida','Gurgaon','Kolkata','Ahmedabad',
  'Jaipur','Lucknow','Kochi','Chandigarh','Surat',
];

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function AdminPremiumSlotsPage() {
  const [slots, setSlots]   = useState<any[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage]     = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [form, setForm] = useState({
    city: 'delhi',
    slotNumber: 1,
    agentId: '',
    agentName: '',
    agentPhone: '',
    price: 5000,
    durationDays: 30,
    adminNotes: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await agencyApi.adminListPremiumSlots({ city: cityFilter || undefined, page, limit: 20 });
      setSlots(r.data.items || []);
      setTotal(r.data.total || 0);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  }, [cityFilter, page]);

  useEffect(() => { load(); }, [load]);

  const loadAgents = useCallback(async () => {
    try {
      const r = await adminApi.getAgents({ limit: 200, role: 'agent' });
      const data = r.data?.items ?? r.data?.data ?? r.data;
      setAgents(Array.isArray(data) ? data : []);
    } catch { setAgents([]); }
  }, []);

  useEffect(() => {
    if (showCreate && agents.length === 0) loadAgents();
  }, [showCreate, agents.length, loadAgents]);

  const handleCreate = async () => {
    if (!form.agentId || !form.city) { setCreateError('Agent and city are required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const agent = agents.find(a => a.id === form.agentId);
      await agencyApi.adminCreatePremiumSlot({
        ...form,
        agentName: agent?.name || form.agentName,
        agentPhone: agent?.phone || form.agentPhone,
        agentAvatar: agent?.avatar,
      });
      setShowCreate(false);
      load();
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || 'Failed to create slot');
    } finally { setCreating(false); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this premium slot?')) return;
    try { await agencyApi.adminDeactivatePremiumSlot(id); load(); }
    catch { alert('Failed to deactivate'); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />Premium Slots
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            City-scoped premium agent placements shown as "Featured" banners in search results.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />New Slot
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Cities</option>
          {TOP_CITIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
        </select>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
        <span className="text-xs text-gray-400">{total} total slots</span>
      </div>

      {/* Slots table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : slots.length === 0 ? (
          <div className="p-16 text-center">
            <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No premium slots configured</p>
            <p className="text-gray-400 text-sm mt-1">Create a slot to start featuring agents in search results.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['City', 'Slot #', 'Agent', 'Phone', 'Price', 'Duration', 'Expires', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {slots.map(slot => {
                  const expired = isExpired(slot.expiresAt);
                  return (
                    <tr key={slot.id} className={`hover:bg-gray-50 transition-colors ${!slot.isActive || expired ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-gray-900">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {slot.city.charAt(0).toUpperCase() + slot.city.slice(1)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-100 text-amber-700 font-bold text-xs rounded-full">
                          {slot.slotNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-800">{slot.agentName || slot.agentId?.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {slot.agentPhone ? (
                          <a href={`tel:${slot.agentPhone}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary-600">
                            <Phone className="w-3 h-3" />{slot.agentPhone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">₹{Number(slot.price || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-gray-600">{slot.durationDays}d</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className={expired ? 'text-red-500 font-semibold' : 'text-gray-600'}>
                            {formatDate(slot.expiresAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {!slot.isActive || expired ? (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" />{expired ? 'Expired' : 'Inactive'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {slot.isActive && !expired && (
                          <button
                            onClick={() => handleDeactivate(slot.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*20 >= total} className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create slot modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Create Premium Slot</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                  <select
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {TOP_CITIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slot Number *</label>
                  <input
                    type="number" min="1" max="6"
                    value={form.slotNumber}
                    onChange={e => setForm(p => ({ ...p, slotNumber: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Agent *</label>
                <select
                  value={form.agentId}
                  onChange={e => setForm(p => ({ ...p, agentId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select agent</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.phone ? ` · ${a.phone}` : ''}{a.city ? ` — ${a.city}` : ''}{a.agentTick && a.agentTick !== 'none' ? ` (${a.agentTick})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number" min="1" max="365"
                    value={form.durationDays}
                    onChange={e => setForm(p => ({ ...p, durationDays: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  value={form.adminNotes}
                  onChange={e => setForm(p => ({ ...p, adminNotes: e.target.value }))}
                  rows={2}
                  placeholder="Reason for slot assignment..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {createError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating || !form.agentId}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Slot'}
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
