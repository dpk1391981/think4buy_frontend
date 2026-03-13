'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, IndianRupee, Handshake, Plus } from 'lucide-react';
import { dealsApi, leadsApi } from '@/lib/api';

const STAGE_BADGE: Record<string, string> = {
  shortlisted: 'bg-gray-100 text-gray-600',
  negotiation: 'bg-yellow-100 text-yellow-700',
  offer_accepted: 'bg-blue-100 text-blue-700',
  booking_paid: 'bg-indigo-100 text-indigo-700',
  agreement_created: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const STAGE_OPTIONS = [
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'booking_paid', label: 'Booking Paid' },
  { value: 'agreement_created', label: 'Agreement Created' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const FILTER_TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'negotiation' },
  { label: 'Offer Accepted', value: 'offer_accepted' },
  { label: 'Closed', value: 'closed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [stats, setStats] = useState<any>(null);

  const [stageModal, setStageModal] = useState<any>(null);
  const [newStage, setNewStage] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    leadId: '', propertyId: '', agreedPrice: '', commissionRate: '2',
    sellerType: 'owner', notes: '',
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsRes, statsRes] = await Promise.all([
        dealsApi.getMy({ page, limit: 15, stage: filterStage || undefined }),
        dealsApi.getStats(),
      ]);
      setDeals(dealsRes.data.items || []);
      setTotal(dealsRes.data.total || 0);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStage]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setShowCreate(true);
    try {
      const r = await leadsApi.getMy({ limit: 50 });
      setMyLeads(r.data.items || []);
    } catch {}
  };

  const openStageModal = (deal: any) => {
    setStageModal(deal);
    setNewStage(deal.stage);
    setStageNotes('');
  };

  const doUpdateStage = async () => {
    if (!stageModal) return;
    setSaving(true);
    try {
      await dealsApi.updateStage(stageModal.id, { stage: newStage, notes: stageNotes });
      setStageModal(null);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  const doCreate = async () => {
    setCreating(true);
    try {
      await dealsApi.create({
        ...createForm,
        agreedPrice: Number(createForm.agreedPrice),
        commissionRate: Number(createForm.commissionRate),
      });
      setShowCreate(false);
      setCreateForm({ leadId: '', propertyId: '', agreedPrice: '', commissionRate: '2', sellerType: 'owner', notes: '' });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create deal');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} deals total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      <div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Deals', value: stats.total || 0, icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Closed', value: stats.closed || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'In Negotiation', value: stats.negotiation || 0, icon: Handshake, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total GMV', value: fmt(stats.totalRevenue || 0), icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setFilterStage(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStage === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="p-16 text-center">
            <Handshake className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No deals yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Lead', 'Agreed Price', 'Commission', 'Stage', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-600">{d.leadId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{fmt(d.agreedPrice)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.commissionRate}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STAGE_BADGE[d.stage]}`}>
                      {d.stage?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {!['closed', 'cancelled'].includes(d.stage) && (
                      <button
                        onClick={() => openStageModal(d)}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100"
                      >
                        Update Stage
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Update Stage Modal */}
      {stageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-1">Update Deal Stage</h3>
            <p className="text-xs text-gray-500 mb-4">Deal value: {fmt(stageModal.agreedPrice)}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Stage *</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  rows={3}
                  placeholder="What happened at this stage..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={doUpdateStage}
                disabled={saving || newStage === stageModal.stage}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Stage'}
              </button>
              <button onClick={() => setStageModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Create Deal Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4">Create New Deal</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lead *</label>
                <select
                  value={createForm.leadId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, leadId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select lead...</option>
                  {myLeads.map((l) => (
                    <option key={l.id} value={l.id}>{l.contactName} — {l.contactPhone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Agreed Price (₹) *</label>
                <input
                  type="number"
                  value={createForm.agreedPrice}
                  onChange={(e) => setCreateForm((p) => ({ ...p, agreedPrice: e.target.value }))}
                  placeholder="e.g. 5000000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Commission Rate (%) *</label>
                <input
                  type="number"
                  value={createForm.commissionRate}
                  onChange={(e) => setCreateForm((p) => ({ ...p, commissionRate: e.target.value }))}
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Seller Type</label>
                <select
                  value={createForm.sellerType}
                  onChange={(e) => setCreateForm((p) => ({ ...p, sellerType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="owner">Owner</option>
                  <option value="builder">Builder</option>
                  <option value="agent">Agent</option>
                  <option value="co_agent">Co-Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Deal notes..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={doCreate}
                disabled={creating || !createForm.leadId || !createForm.agreedPrice}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Deal'}
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
