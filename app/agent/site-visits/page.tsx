'use client';

import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchMyVisits,
  fetchMyLeads,
  completeVisitThunk,
  cancelVisitThunk,
  createVisitThunk,
  clearError,
} from '@/store/siteVisitsSlice';

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  no_show: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
  rescheduled: 'bg-orange-100 text-orange-700',
};

const OUTCOME_OPTIONS = [
  { value: 'very_interested', label: 'Very Interested' },
  { value: 'interested', label: 'Interested' },
  { value: 'needs_time', label: 'Needs Time' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'price_issue', label: 'Price Issue' },
  { value: 'location_issue', label: 'Location Issue' },
];

export default function SiteVisitsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const { visits, todayVisits, myLeads, total, loading, saving, error } = useAppSelector(
    (s) => s.siteVisits,
  );

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  // Complete modal state
  const [completeVisit, setCompleteVisit] = useState<any>(null);
  const [outcome, setOutcome] = useState('interested');
  const [agentNotes, setAgentNotes] = useState('');

  // Schedule modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ leadId: '', scheduledAt: '' });

  // Load visits
  useEffect(() => {
    dispatch(fetchMyVisits({ page, limit: 15, status: filterStatus || undefined }));
  }, [dispatch, page, filterStatus]);

  // Clear any error on unmount
  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  const openCreate = () => {
    setShowCreate(true);
    setCreateForm({ leadId: '', scheduledAt: '' });
    dispatch(fetchMyLeads());
  };

  const doComplete = async () => {
    if (!completeVisit) return;
    const result = await dispatch(completeVisitThunk({
      id: completeVisit.id,
      data: { outcome, agentNotes: agentNotes || undefined },
    }));
    if (completeVisitThunk.fulfilled.match(result)) {
      setCompleteVisit(null);
      dispatch(fetchMyVisits({ page, limit: 15, status: filterStatus || undefined }));
    }
  };

  const doCancel = async (id: string) => {
    const reason = prompt('Reason for cancellation?');
    if (!reason) return;
    const result = await dispatch(cancelVisitThunk({ id, reason }));
    if (cancelVisitThunk.fulfilled.match(result)) {
      dispatch(fetchMyVisits({ page, limit: 15, status: filterStatus || undefined }));
    }
  };

  const doCreate = async () => {
    if (!createForm.leadId || !createForm.scheduledAt) return;
    const agentId = user?.id;
    if (!agentId) return;

    const result = await dispatch(createVisitThunk({
      leadId: createForm.leadId,
      agentId,
      scheduledAt: createForm.scheduledAt,
    }));
    if (createVisitThunk.fulfilled.match(result)) {
      setShowCreate(false);
      dispatch(fetchMyVisits({ page, limit: 15, status: filterStatus || undefined }));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Visits</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} visits total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Schedule Visit
        </button>
      </div>

      <div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => dispatch(clearError())} className="ml-2 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Today's Visits */}
      {todayVisits.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Today ({todayVisits.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayVisits.map((v) => (
              <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {new Date(v.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-500 mt-1">Lead: {v.leadId?.slice(0, 8)}...</div>
                <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[v.status]}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {[
            { label: 'All', value: '' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Completed', value: 'completed' },
            { label: 'No Show', value: 'no_show' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
        ) : visits.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No site visits</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Lead', 'Scheduled', 'Status', 'Outcome', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600">{v.leadId?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-gray-800 whitespace-nowrap">
                        {new Date(v.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-gray-500">
                        {new Date(v.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${STATUS_BADGE[v.status]}`}>
                        {v.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                      {v.outcome?.replace(/_/g, ' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {['scheduled', 'confirmed', 'in_progress'].includes(v.status) && (
                          <button
                            onClick={() => { setCompleteVisit(v); setOutcome('interested'); setAgentNotes(''); }}
                            className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </button>
                        )}
                        {['scheduled', 'confirmed'].includes(v.status) && (
                          <button
                            onClick={() => doCancel(v.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100 whitespace-nowrap"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </div>

      {/* Complete Visit Modal */}
      {completeVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4">Mark Visit Complete</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Outcome *</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {OUTCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  rows={3}
                  placeholder="Client feedback, next steps..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={doComplete}
                disabled={saving}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Mark Complete'}
              </button>
              <button onClick={() => setCompleteVisit(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4">Schedule Site Visit</h3>
            {error && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={createForm.scheduledAt}
                  onChange={(e) => setCreateForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={doCreate}
                disabled={saving || !createForm.leadId || !createForm.scheduledAt}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Scheduling...' : 'Schedule Visit'}
              </button>
              <button onClick={() => { setShowCreate(false); dispatch(clearError()); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
