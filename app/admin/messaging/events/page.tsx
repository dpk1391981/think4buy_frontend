'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronLeft, Zap } from 'lucide-react';
import Link from 'next/link';

interface EventMapping {
  id: string;
  event: string;
  recipientType: string;
  templateId: string;
  description?: string;
  isActive: boolean;
  template?: { id: string; name: string; channel: string };
}

interface Template { id: string; name: string; channel: string; }

const RECIPIENT_COLOR: Record<string, string> = {
  buyer: 'bg-cyan-100 text-cyan-700',
  agent: 'bg-amber-100 text-amber-700',
  admin: 'bg-rose-100 text-rose-700',
  owner: 'bg-purple-100 text-purple-700',
};

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  sms:      'bg-blue-100 text-blue-700',
  email:    'bg-purple-100 text-purple-700',
};

function emptyForm() {
  return { event: '', recipientType: 'buyer', templateId: '', description: '', isActive: true };
}

/** Group mappings by event for a matrix view */
function groupByEvent(mappings: EventMapping[]): Record<string, EventMapping[]> {
  const g: Record<string, EventMapping[]> = {};
  mappings.forEach(m => { (g[m.event] ??= []).push(m); });
  return g;
}

export default function EventMappingsPage() {
  const [mappings,  setMappings]  = useState<EventMapping[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [events,    setEvents]    = useState<string[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState<EventMapping | null>(null);
  const [form,      setForm]      = useState(emptyForm());
  const [saving,    setSaving]    = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/messaging/event-mappings'),
      api.get('/admin/messaging/templates'),
      api.get('/admin/messaging/events'),
    ]).then(([m, t, e]) => {
      setMappings(m.data);
      setTemplates(t.data);
      setEvents(e.data.events ?? []);
      setRecipients(e.data.recipientTypes ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  function openCreate() { setEditing(null); setForm(emptyForm()); setModal(true); }
  function openEdit(m: EventMapping) {
    setEditing(m);
    setForm({ event: m.event, recipientType: m.recipientType, templateId: m.templateId, description: m.description ?? '', isActive: m.isActive });
    setModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this mapping?')) return;
    await api.delete(`/admin/messaging/event-mappings/${id}`).catch(() => {});
    load();
  }

  async function handleToggle(m: EventMapping) {
    await api.patch(`/admin/messaging/event-mappings/${m.id}`, { isActive: !m.isActive }).catch(() => {});
    load();
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, description: form.description || undefined };
    try {
      if (editing) {
        await api.patch(`/admin/messaging/event-mappings/${editing.id}`, payload);
      } else {
        await api.post('/admin/messaging/event-mappings', payload);
      }
      setModal(false);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const grouped = groupByEvent(mappings);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/messaging" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">Event → Template Mappings</h1>
          <p className="text-sm text-gray-500">Map system events to Buyer / Agent / Admin message templates</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Add Mapping
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No event mappings yet.</p>
          <p className="text-xs text-gray-400 mt-1">Map a system event (e.g. lead_created) to a template for each recipient type.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 hover:underline">Add first mapping →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([event, rows]) => (
            <div key={event} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-gray-900 font-mono text-sm">{event}</span>
                <span className="text-xs text-gray-400">({rows.length} recipients)</span>
              </div>
              <div className="divide-y divide-gray-50">
                {rows.map(m => (
                  <div key={m.id} className="px-5 py-3 flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${RECIPIENT_COLOR[m.recipientType] ?? 'bg-gray-100 text-gray-600'}`}>
                      {m.recipientType}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {m.template ? (
                          <>
                            <span className="text-sm font-medium text-gray-800">{m.template.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLOR[m.template.channel] ?? 'bg-gray-100'}`}>
                              {m.template.channel}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">{m.templateId}</span>
                        )}
                      </div>
                      {m.description && <p className="text-xs text-gray-400">{m.description}</p>}
                    </div>
                    <button onClick={() => handleToggle(m)} className="flex-shrink-0">
                      {m.isActive
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <XCircle className="w-5 h-5 text-gray-300" />}
                    </button>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">{editing ? 'Edit' : 'Add'} Event Mapping</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Event</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                  value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))}>
                  <option value="">— Select event —</option>
                  {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                  value={form.recipientType} onChange={e => setForm(p => ({ ...p, recipientType: e.target.value }))}>
                  {recipients.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                  value={form.templateId} onChange={e => setForm(p => ({ ...p, templateId: e.target.value }))}>
                  <option value="">— Select template —</option>
                  {templates.filter(t => t.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Notify buyer after inquiry submitted" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded"
                  checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.event || !form.templateId}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
