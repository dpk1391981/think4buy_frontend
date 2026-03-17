'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface MsgService {
  id: string;
  name: string;
  channel: string;
  provider: string;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: string;
}

const CHANNELS = ['whatsapp', 'sms', 'email'];
const PROVIDERS: Record<string, string[]> = {
  whatsapp: ['meta', 'twilio'],
  sms:      ['msg91', 'twilio', 'generic'],
  email:    ['smtp', 'sendgrid'],
};

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  sms:      'bg-blue-100 text-blue-700',
  email:    'bg-purple-100 text-purple-700',
};

const CONFIG_FIELDS: Record<string, { key: string; label: string; type?: string; placeholder?: string }[]> = {
  'whatsapp/meta':    [
    { key: 'apiKey',        label: 'API Key (Bearer Token)', type: 'password' },
    { key: 'phoneNumberId', label: 'Phone Number ID',        placeholder: '1234567890' },
    { key: 'templateNamespace', label: 'Template Namespace', placeholder: 'optional' },
  ],
  'whatsapp/twilio':  [
    { key: 'accountSid', label: 'Account SID',  placeholder: 'ACxxxxxxxxxxxxxxx' },
    { key: 'authToken',  label: 'Auth Token',   type: 'password' },
    { key: 'from',       label: 'From Number',  placeholder: 'whatsapp:+1415XXXXXXX' },
  ],
  'sms/msg91':        [
    { key: 'authKey',    label: 'Auth Key',   type: 'password' },
    { key: 'senderId',   label: 'Sender ID',  placeholder: 'MYAPP' },
    { key: 'templateId', label: 'Template ID (DLT)', placeholder: 'optional' },
  ],
  'sms/twilio':       [
    { key: 'type',       label: 'Type',       placeholder: 'twilio' },
    { key: 'accountSid', label: 'Account SID' },
    { key: 'authToken',  label: 'Auth Token', type: 'password' },
    { key: 'from',       label: 'From Number' },
  ],
  'sms/generic':      [
    { key: 'url',    label: 'Webhook URL', placeholder: 'https://...' },
    { key: 'method', label: 'Method',      placeholder: 'POST' },
  ],
  'email/smtp':       [
    { key: 'host',   label: 'SMTP Host',    placeholder: 'smtp.gmail.com' },
    { key: 'port',   label: 'Port',         placeholder: '587' },
    { key: 'user',   label: 'Username/Email' },
    { key: 'pass',   label: 'Password',     type: 'password' },
    { key: 'from',   label: 'From Address', placeholder: 'no-reply@example.com' },
    { key: 'secure', label: 'SSL (true/false)', placeholder: 'false' },
  ],
  'email/sendgrid':   [
    { key: 'apiKey', label: 'SendGrid API Key', type: 'password' },
    { key: 'from',   label: 'From Address',     placeholder: 'no-reply@example.com' },
  ],
};

function emptyForm() {
  return { name: '', channel: 'whatsapp', provider: 'meta', isActive: true, config: {} as Record<string,string> };
}

export default function MessagingServicesPage() {
  const [services, setServices] = useState<MsgService[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState<MsgService | null>(null);
  const [form,     setForm]     = useState(emptyForm());
  const [saving,   setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/messaging/services')
      .then(r => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModal(true);
  }

  function openEdit(s: MsgService) {
    setEditing(s);
    setForm({ name: s.name, channel: s.channel, provider: s.provider, isActive: s.isActive, config: s.config ?? {} });
    setModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this service?')) return;
    await api.delete(`/admin/messaging/services/${id}`).catch(() => {});
    load();
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/admin/messaging/services/${editing.id}`, form);
      } else {
        await api.post('/admin/messaging/services', form);
      }
      setModal(false);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const configKey = `${form.channel}/${form.provider}`;
  const fields    = CONFIG_FIELDS[configKey] ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/messaging" className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900">Messaging Services</h1>
          <p className="text-sm text-gray-500">Configure WhatsApp, SMS, and Email providers</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500">No services configured yet.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-blue-600 hover:underline">Add your first service →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{s.name}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${CHANNEL_COLOR[s.channel] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.channel}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs bg-gray-100 text-gray-600">{s.provider}</span>
                  {s.isActive
                    ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3"/>Active</span>
                    : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3 h-3"/>Inactive</span>
                  }
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {Object.keys(s.config ?? {}).map(k => `${k}: ••••`).join(' · ') || 'No config'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-gray-100">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-900">
                {editing ? 'Edit' : 'Add'} Messaging Service
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. WhatsApp Meta Production" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.channel}
                    onChange={e => setForm(p => ({ ...p, channel: e.target.value, provider: PROVIDERS[e.target.value]?.[0] ?? '', config: {} }))}>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={form.provider}
                    onChange={e => setForm(p => ({ ...p, provider: e.target.value, config: {} }))}>
                    {(PROVIDERS[form.channel] ?? []).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {fields.length > 0 && (
                <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider Configuration</p>
                  {fields.map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                      <input
                        type={f.type ?? 'text'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        placeholder={f.placeholder}
                        value={(form.config as any)[f.key] ?? ''}
                        onChange={e => setForm(p => ({ ...p, config: { ...p.config, [f.key]: e.target.value } }))}
                      />
                    </div>
                  ))}
                </div>
              )}

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
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
