'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminPlansApi } from '@/lib/api';

type Tab = 'subscription' | 'boost';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  durationDays: number;
  tokensIncluded: number;
  maxListings: number;
  isActive: boolean;
}

interface BoostPlan {
  id: string;
  name: string;
  durationDays: number;
  tokenCost: number;
  isActive: boolean;
}

const EMPTY_SUB: Partial<SubscriptionPlan> = { name: '', type: 'basic', price: 0, durationDays: 30, tokensIncluded: 0, maxListings: 5, isActive: true };
const EMPTY_BOOST: Partial<BoostPlan> = { name: '', durationDays: 7, tokenCost: 10, isActive: true };

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<Tab>('subscription');

  // Subscription plans
  const [subPlans, setSubPlans] = useState<SubscriptionPlan[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [subModal, setSubModal] = useState<{ open: boolean; editing: SubscriptionPlan | null }>({ open: false, editing: null });
  const [subForm, setSubForm] = useState<Partial<SubscriptionPlan>>(EMPTY_SUB);

  // Boost plans
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [boostLoading, setBoostLoading] = useState(true);
  const [boostModal, setBoostModal] = useState<{ open: boolean; editing: BoostPlan | null }>({ open: false, editing: null });
  const [boostForm, setBoostForm] = useState<Partial<BoostPlan>>(EMPTY_BOOST);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'sub' | 'boost'; id: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSubPlans = useCallback(async () => {
    setSubLoading(true);
    try {
      const r = await adminPlansApi.getSubscriptionPlans();
      setSubPlans(r.data?.items || r.data || []);
    } catch (e) { console.error(e); }
    finally { setSubLoading(false); }
  }, []);

  const loadBoostPlans = useCallback(async () => {
    setBoostLoading(true);
    try {
      const r = await adminPlansApi.getBoostPlans();
      const data = r.data?.items || r.data || [];
      // If no data, show defaults
      if (data.length === 0) {
        setBoostPlans([
          { id: 'default-1', name: '7 Days Boost', durationDays: 7, tokenCost: 10, isActive: true },
          { id: 'default-2', name: '15 Days Boost', durationDays: 15, tokenCost: 20, isActive: true },
          { id: 'default-3', name: '30 Days Boost', durationDays: 30, tokenCost: 40, isActive: true },
        ]);
      } else {
        setBoostPlans(data);
      }
    } catch (e) {
      // Show defaults on error
      setBoostPlans([
        { id: 'default-1', name: '7 Days Boost', durationDays: 7, tokenCost: 10, isActive: true },
        { id: 'default-2', name: '15 Days Boost', durationDays: 15, tokenCost: 20, isActive: true },
        { id: 'default-3', name: '30 Days Boost', durationDays: 30, tokenCost: 40, isActive: true },
      ]);
    } finally { setBoostLoading(false); }
  }, []);

  useEffect(() => { loadSubPlans(); loadBoostPlans(); }, [loadSubPlans, loadBoostPlans]);

  // --- Subscription Plan actions ---
  async function saveSub() {
    if (!subForm.name?.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (subModal.editing) {
        await adminPlansApi.updateSubscriptionPlan(subModal.editing.id, subForm);
      } else {
        await adminPlansApi.createSubscriptionPlan(subForm);
      }
      setSubModal({ open: false, editing: null });
      loadSubPlans();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save plan.');
    } finally { setSaving(false); }
  }

  async function deleteSub(id: string) {
    if (id.startsWith('default-')) { setDeleteConfirm(null); return; }
    setActionLoading(id);
    setError('');
    try {
      await adminPlansApi.deleteSubscriptionPlan(id);
      setDeleteConfirm(null);
      loadSubPlans();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete.');
    } finally { setActionLoading(null); }
  }

  // --- Boost Plan actions ---
  async function saveBoost() {
    if (!boostForm.name?.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (boostModal.editing && !boostModal.editing.id.startsWith('default-')) {
        await adminPlansApi.updateBoostPlan(boostModal.editing.id, boostForm);
      } else {
        await adminPlansApi.createBoostPlan(boostForm);
      }
      setBoostModal({ open: false, editing: null });
      loadBoostPlans();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save plan.');
    } finally { setSaving(false); }
  }

  async function deleteBoost(id: string) {
    if (id.startsWith('default-')) { setDeleteConfirm(null); return; }
    setActionLoading(id);
    try {
      await adminPlansApi.deleteBoostPlan(id);
      setDeleteConfirm(null);
      loadBoostPlans();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete.');
    } finally { setActionLoading(null); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions & Boost Plans</h1>
          <p className="text-gray-500 text-sm mt-1">Manage pricing plans and boost options</p>
        </div>
        {tab === 'subscription' ? (
          <button
            onClick={() => { setSubForm({ ...EMPTY_SUB }); setError(''); setSubModal({ open: true, editing: null }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Plan
          </button>
        ) : (
          <button
            onClick={() => { setBoostForm({ ...EMPTY_BOOST }); setError(''); setBoostModal({ open: true, editing: null }); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Boost Plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
        <button
          onClick={() => setTab('subscription')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'subscription' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Subscription Plans
        </button>
        <button
          onClick={() => setTab('boost')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'boost' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Boost Plans
        </button>
      </div>

      {/* --- SUBSCRIPTION PLANS --- */}
      {tab === 'subscription' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {subLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : subPlans.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No subscription plans yet. Create your first plan.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Type', 'Price', 'Duration', 'Tokens', 'Max Listings', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">{p.type}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">₹{p.price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{p.durationDays} days</td>
                    <td className="px-4 py-3 text-gray-600">{p.tokensIncluded} 🪙</td>
                    <td className="px-4 py-3 text-gray-600">{p.maxListings}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSubForm({ ...p }); setError(''); setSubModal({ open: true, editing: p }); }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'sub', id: p.id })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- BOOST PLANS --- */}
      {tab === 'boost' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {boostLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Duration', 'Token Cost', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {boostPlans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.durationDays} days</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span>🪙</span>
                        <span className="font-semibold text-gray-800">{p.tokenCost}</span>
                        <span className="text-gray-400 text-xs">tokens</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setBoostForm({ ...p }); setError(''); setBoostModal({ open: true, editing: p }); }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'boost', id: p.id })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Subscription Plan Modal */}
      {subModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-semibold text-gray-900 mb-4">{subModal.editing ? 'Edit Subscription Plan' : 'Add Subscription Plan'}</h3>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name *</label>
                <input type="text" value={subForm.name || ''} onChange={(e) => setSubForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Basic Plan" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan Type</label>
                <select value={subForm.type || 'basic'} onChange={(e) => setSubForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                <input type="number" min={0} value={subForm.price || 0} onChange={(e) => setSubForm((f) => ({ ...f, price: parseFloat(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (days)</label>
                <input type="number" min={1} value={subForm.durationDays || 30} onChange={(e) => setSubForm((f) => ({ ...f, durationDays: parseInt(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tokens Included</label>
                <input type="number" min={0} value={subForm.tokensIncluded || 0} onChange={(e) => setSubForm((f) => ({ ...f, tokensIncluded: parseInt(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Listings</label>
                <input type="number" min={0} value={subForm.maxListings || 0} onChange={(e) => setSubForm((f) => ({ ...f, maxListings: parseInt(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <input type="checkbox" id="subActive" checked={subForm.isActive ?? true} onChange={(e) => setSubForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="subActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveSub} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : subModal.editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setSubModal({ open: false, editing: null })} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Boost Plan Modal */}
      {boostModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">{boostModal.editing && !boostModal.editing.id.startsWith('default-') ? 'Edit Boost Plan' : 'Add Boost Plan'}</h3>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name *</label>
                <input type="text" value={boostForm.name || ''} onChange={(e) => setBoostForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 7 Days Boost" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (days)</label>
                <input type="number" min={1} value={boostForm.durationDays || 7} onChange={(e) => setBoostForm((f) => ({ ...f, durationDays: parseInt(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Token Cost 🪙</label>
                <input type="number" min={1} value={boostForm.tokenCost || 10} onChange={(e) => setBoostForm((f) => ({ ...f, tokenCost: parseInt(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="boostActive" checked={boostForm.isActive ?? true} onChange={(e) => setBoostForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="boostActive" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveBoost} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setBoostModal({ open: false, editing: null })} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-3">Are you sure you want to delete this plan? This action cannot be undone.</p>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => deleteConfirm.type === 'sub' ? deleteSub(deleteConfirm.id) : deleteBoost(deleteConfirm.id)}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => { setDeleteConfirm(null); setError(''); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
