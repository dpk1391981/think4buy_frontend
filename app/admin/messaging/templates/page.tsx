'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronLeft, Tag } from 'lucide-react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  description?: string;
  channel: string;
  providerTemplateName?: string;
  subject?: string;
  body: string;
  variables: string[];
  serviceId?: string;
  isActive: boolean;
  service?: { id: string; name: string };
  createdAt: string;
}

interface MsgService { id: string; name: string; channel: string; }

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  sms:      'bg-blue-100 text-blue-700',
  email:    'bg-purple-100 text-purple-700',
};

function emptyForm() {
  return {
    name: '', description: '', channel: 'whatsapp', providerTemplateName: '',
    subject: '', body: '', variables: '', serviceId: '', isActive: true,
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [services,  setServices]  = useState<MsgService[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState<Template | null>(null);
  const [form,      setForm]      = useState(emptyForm());
  const [saving,    setSaving]    = useState(false);
  const [preview,   setPreview]   = useState('');
  const [error,     setError]     = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/admin/messaging/templates'),
      api.get('/admin/messaging/services'),
    ]).then(([t, s]) => { setTemplates(t.data); setServices(s.data); })
      .catch((e) => {
        const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load templates';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setPreview('');
    setModal(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({
      name: t.name, description: t.description ?? '', channel: t.channel,
      providerTemplateName: t.providerTemplateName ?? '', subject: t.subject ?? '',
      body: t.body, variables: (t.variables ?? []).join(', '),
      serviceId: t.serviceId ?? '', isActive: t.isActive,
    });
    setPreview('');
    setModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;
    await api.delete(`/admin/messaging/templates/${id}`).catch(() => {});
    load();
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      variables: form.variables ? form.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
      serviceId: form.serviceId || undefined,
      providerTemplateName: form.providerTemplateName || undefined,
      subject:   form.subject || undefined,
      description: form.description || undefined,
    };
    try {
      if (editing) {
        await api.patch(`/admin/messaging/templates/${editing.id}`, payload);
      } else {
        await api.post('/admin/messaging/templates', payload);
      }
      setModal(false);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function generatePreview() {
    const sampleCtx: Record<string, string> = {};
    (form.variables ?? '').split(',').forEach(v => {
      const key = v.trim();
      if (key) sampleCtx[key] = `[${key}]`;
    });
    const rendered = form.body.replace(/\{\{(\w+)\}\}/g, (_, k) => sampleCtx[k] ?? `{{${k}}}`);
    setPreview(rendered);
  }

  const filteredServices = services.filter(s => s.channel === form.channel);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/messaging" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500">Reusable templates with {'{{variable}}'} placeholders</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-1">Failed to load templates</p>
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-purple-600 hover:underline">Retry →</button>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500">No templates yet.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-purple-600 hover:underline">Create your first template →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-gray-900">{t.name}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${CHANNEL_COLOR[t.channel] ?? 'bg-gray-100 text-gray-600'}`}>{t.channel}</span>
                    {t.service && <span className="px-2 py-0.5 rounded-lg text-xs bg-gray-100 text-gray-600">{t.service.name}</span>}
                    {t.isActive
                      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3"/>Active</span>
                      : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3 h-3"/>Inactive</span>}
                  </div>
                  {t.description && <p className="text-xs text-gray-400 mb-2">{t.description}</p>}
                  <p className="text-sm text-gray-600 line-clamp-2">{t.body}</p>
                  {t.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.variables.map(v => (
                        <span key={v} className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-xs">
                          <Tag className="w-2.5 h-2.5"/>{'{{'}{ v }{'}}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-gray-100">
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">{editing ? 'Edit' : 'Create'} Template</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name (slug)</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="buyer_inquiry_whatsapp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value, serviceId: '' }))}>
                    {['whatsapp', 'sms', 'email'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Sent to buyer after inquiry is submitted" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Messaging Service</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}>
                  <option value="">— Select a service —</option>
                  {filteredServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {form.channel === 'whatsapp' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider Template Name (Meta pre-approved)</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.providerTemplateName} onChange={e => setForm(p => ({ ...p, providerTemplateName: e.target.value }))}
                    placeholder="hello_world" />
                </div>
              )}

              {form.channel === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Your inquiry for {{property_title}} has been received" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <textarea rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 font-mono resize-none"
                  value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder={'Hi {{name}}, your inquiry for {{property_title}} has been received. Our agent will contact you shortly.'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variables (comma-separated)</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  value={form.variables} onChange={e => setForm(p => ({ ...p, variables: e.target.value }))}
                  placeholder="name, property_title, agent_name" />
                <p className="text-xs text-gray-400 mt-1">Use {'{{variable_name}}'} in the body above</p>
              </div>

              {preview && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">Preview</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{preview}</p>
                </div>
              )}

              <button type="button" onClick={generatePreview}
                className="text-sm text-purple-600 hover:underline">
                Preview with sample values →
              </button>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
