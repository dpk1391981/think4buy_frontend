'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Phone, Mail, MapPin, TrendingUp } from 'lucide-react';
import { leadsApi } from '@/lib/api';

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Visit Scheduled', value: 'site_visit_scheduled' },
  { label: 'Visit Done', value: 'site_visit_completed' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Deal Won', value: 'deal_won' },
  { label: 'Deal Lost', value: 'deal_lost' },
];

const TEMP_BADGE: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-orange-100 text-orange-700',
  cold: 'bg-blue-100 text-blue-700',
};

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-indigo-100 text-indigo-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  site_visit_scheduled: 'bg-purple-100 text-purple-700',
  site_visit_completed: 'bg-teal-100 text-teal-700',
  negotiation: 'bg-orange-100 text-orange-700',
  deal_in_progress: 'bg-cyan-100 text-cyan-700',
  deal_won: 'bg-green-100 text-green-700',
  deal_lost: 'bg-red-100 text-red-600',
  duplicate: 'bg-gray-100 text-gray-500',
  junk: 'bg-gray-100 text-gray-400',
};

function formatBudget(min?: number, max?: number) {
  const fmt = (v: number) =>
    v >= 10000000
      ? `₹${(v / 10000000).toFixed(1)}Cr`
      : v >= 100000
      ? `₹${(v / 100000).toFixed(0)}L`
      : `₹${v.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return '—';
}

export default function AgentLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [temperature, setTemperature] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);

  const [selected, setSelected] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    city: '',
    requirement: '',
    source: 'manual',
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        leadsApi.getMy({
          page,
          limit: 15,
          status: status || undefined,
          temperature: temperature || undefined,
          search: search || undefined,
        }),
        leadsApi.getStats(),
      ]);
      setLeads(leadsRes.data.items || []);
      setTotal(leadsRes.data.total || 0);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, temperature, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openLead = async (lead: any) => {
    setSelected(lead);
    setNewStatus(lead.status);
    setNoteText('');
    try {
      const r = await leadsApi.getActivities(lead.id);
      setActivities(r.data || []);
    } catch {
      setActivities([]);
    }
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await leadsApi.updateStatus(selected.id, { status: newStatus, notes: noteText || undefined });
      setSelected((s: any) => ({ ...s, status: newStatus }));
      setNoteText('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSaving(true);
    try {
      await leadsApi.addNote(selected.id, noteText);
      setNoteText('');
      const r = await leadsApi.getActivities(selected.id);
      setActivities(r.data || []);
    } finally {
      setSaving(false);
    }
  };

  const createLead = async () => {
    setCreating(true);
    try {
      await leadsApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ contactName: '', contactPhone: '', contactEmail: '', city: '', requirement: '', source: 'manual' });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create lead');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} leads assigned to you</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      <div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Hot', value: stats.byTemperature?.hot || 0, color: 'bg-red-50 text-red-700' },
            { label: 'Deal Won', value: stats.byStatus?.deal_won || 0, color: 'bg-green-50 text-green-700' },
            { label: 'Follow-up', value: stats.byStatus?.follow_up || 0, color: 'bg-yellow-50 text-yellow-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {STATUS_OPTIONS.slice(0, 5).map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                status === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={temperature}
          onChange={(e) => { setTemperature(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none"
        >
          <option value="">All Temperatures</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            placeholder="Search name, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No leads found</p>
            <p className="text-gray-400 text-sm mt-1">Leads assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Contact', 'City / Type', 'Budget', 'Temp', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lead.contactName}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {lead.contactPhone && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />{lead.contactPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <MapPin className="w-3 h-3" />{lead.city || '—'}
                      </div>
                      <div className="text-xs text-gray-400 capitalize mt-0.5">{lead.propertyType || 'any'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                      {formatBudget(lead.budgetMin, lead.budgetMax)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TEMP_BADGE[lead.temperature] || 'bg-gray-100 text-gray-500'}`}>
                        {lead.temperature}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.status] || 'bg-gray-100 text-gray-500'}`}>
                        {lead.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openLead(lead)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Lead Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">{selected.contactName}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selected.contactPhone} · {selected.city}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Temperature', value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TEMP_BADGE[selected.temperature]}`}>{selected.temperature}</span> },
                  { label: 'Status', value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[selected.status]}`}>{selected.status?.replace(/_/g, ' ')}</span> },
                  { label: 'Score', value: <span className="text-sm font-semibold text-gray-800">{selected.leadScore}/100</span> },
                  { label: 'Budget', value: <span className="text-sm text-gray-700">{formatBudget(selected.budgetMin, selected.budgetMax)}</span> },
                  { label: 'Property Type', value: <span className="text-sm text-gray-700 capitalize">{selected.propertyType || '—'}</span> },
                  { label: 'Source', value: <span className="text-sm text-gray-700 capitalize">{selected.source?.replace(/_/g, ' ')}</span> },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    {item.value}
                  </div>
                ))}
              </div>

              {selected.requirement && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Requirement</div>
                  <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">{selected.requirement}</div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Update Status</div>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {STATUS_OPTIONS.slice(1).map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveStatus}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? '...' : 'Update'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Add Note</div>
                <div className="flex gap-2">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log a call, visit outcome, or note..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={saveNote}
                    disabled={saving || !noteText.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              {activities.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Activity Log</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.map((a) => (
                      <div key={a.id} className="flex gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700 capitalize">{a.activityType?.replace(/_/g, ' ')}</span>
                          {a.notes && <span className="text-gray-500"> — {a.notes}</span>}
                          <div className="text-gray-400 mt-0.5">
                            {new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { key: 'contactName', label: 'Name *', placeholder: 'Client name' },
                { key: 'contactPhone', label: 'Phone *', placeholder: '+91 9876543210' },
                { key: 'contactEmail', label: 'Email', placeholder: 'email@example.com' },
                { key: 'city', label: 'City', placeholder: 'Mumbai' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    value={(createForm as any)[f.key]}
                    onChange={(e) => setCreateForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Requirement</label>
                <textarea
                  value={createForm.requirement}
                  onChange={(e) => setCreateForm((p) => ({ ...p, requirement: e.target.value }))}
                  rows={2}
                  placeholder="3BHK in Andheri under 1.5 Cr..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={createLead}
                disabled={creating || !createForm.contactName || !createForm.contactPhone}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Lead'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
