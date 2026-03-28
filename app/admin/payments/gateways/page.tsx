'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminPaymentApi } from '@/lib/api';

interface Gateway {
  id: string;
  name: string;
  displayName: string;
  status: 'active' | 'inactive';
  priority: number;
  isTestMode: boolean;
  updatedAt: string;
  configMasked: Record<string, string>;
}

const GATEWAY_LABELS: Record<string, { label: string; fields: string[] }> = {
  razorpay: {
    label: 'Razorpay',
    fields: ['keyId', 'keySecret', 'webhookSecret'],
  },
  stripe: {
    label: 'Stripe',
    fields: ['publishableKey', 'secretKey', 'webhookSecret'],
  },
  paypal: {
    label: 'PayPal',
    fields: ['clientId', 'clientSecret', 'webhookId'],
  },
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Add / Edit Gateway Form ───────────────────────────────────────────────────
function GatewayForm({
  onClose,
  onSaved,
  editing,
}: {
  onClose: () => void;
  onSaved: () => void;
  editing?: Gateway;
}) {
  const [name, setName] = useState(editing?.name ?? 'razorpay');
  const [displayName, setDisplayName] = useState(editing?.displayName ?? '');
  const [isTestMode, setIsTestMode] = useState(editing?.isTestMode ?? false);
  const [priority, setPriority] = useState(String(editing?.priority ?? 10));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gatewayFields = GATEWAY_LABELS[name]?.fields ?? [];

  const submit = async () => {
    if (!displayName.trim()) { setError('Display name is required'); return; }
    if (!editing && gatewayFields.some(f => !fields[f]?.trim())) {
      setError('All credential fields are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (editing) {
        const payload: any = { displayName, isTestMode, priority: Number(priority) };
        const filledFields = Object.entries(fields).filter(([, v]) => v.trim());
        if (filledFields.length > 0) {
          payload.config = Object.fromEntries(filledFields);
        }
        await adminPaymentApi.updateGateway(editing.id, payload);
      } else {
        await adminPaymentApi.createGateway({
          name,
          displayName,
          config: fields,
          priority: Number(priority),
          isTestMode,
        });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to save gateway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {editing ? 'Edit Gateway' : 'Add Payment Gateway'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
              <select
                value={name}
                onChange={e => { setName(e.target.value); setFields({}); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(GATEWAY_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={`e.g. ${GATEWAY_LABELS[name]?.label} (Production)`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <input
              type="number"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              min={1}
              max={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Lower number = higher priority when multiple gateways exist</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="testMode"
              checked={isTestMode}
              onChange={e => setIsTestMode(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="testMode" className="text-sm text-gray-700">
              Test Mode (sandbox)
            </label>
          </div>

          {/* Credential Fields */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Credentials {editing ? '(leave blank to keep existing)' : '(will be encrypted at rest)'}
            </p>
            {editing && Object.entries(editing.configMasked).map(([k, v]) => (
              <div key={k} className="mb-2">
                <label className="block text-xs text-gray-500 mb-0.5">{k} (current: {v})</label>
                <input
                  value={fields[k] ?? ''}
                  onChange={e => setFields(prev => ({ ...prev, [k]: e.target.value }))}
                  placeholder="Enter new value to update"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
            ))}
            {!editing && gatewayFields.map(field => (
              <div key={field} className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-0.5">{field} *</label>
                <input
                  type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                  value={fields[field] ?? ''}
                  onChange={e => setFields(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={`Enter ${field}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-100 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : editing ? 'Update Gateway' : 'Add Gateway'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Gateway | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPaymentApi.listGateways();
      setGateways(r.data ?? []);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activate = async (id: string) => {
    setActionLoading(id + '_activate');
    try {
      await adminPaymentApi.activateGateway(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const deactivate = async (id: string) => {
    setActionLoading(id + '_deactivate');
    try {
      await adminPaymentApi.deactivateGateway(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteGw = async (id: string, name: string) => {
    if (!confirm(`Delete gateway "${name}"? This cannot be undone.`)) return;
    setActionLoading(id + '_delete');
    try {
      await adminPaymentApi.deleteGateway(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/payments" className="hover:text-blue-600">Payments</Link>
            <span>/</span>
            <span>Payment Gateways</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure and manage payment provider credentials. Credentials are AES-256 encrypted.
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Gateway
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <strong>How it works:</strong> Only one gateway can be <strong>Active</strong> at a time.
        Activating a new gateway automatically deactivates the current one.
        Set <code className="bg-blue-100 px-1 rounded">PAYMENT_ENABLED=true</code> in your{' '}
        <code className="bg-blue-100 px-1 rounded">.env</code> to switch from tokens to real money.
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading…</div>
      ) : gateways.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">💳</div>
          <p className="text-gray-600 font-medium">No gateways configured</p>
          <p className="text-gray-400 text-sm mt-1">Add your first payment gateway to enable real-money payments.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Gateway
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {gateways.map(gw => (
            <div
              key={gw.id}
              className={`bg-white rounded-xl shadow-sm border ${gw.status === 'active' ? 'border-green-200' : 'border-gray-100'} p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                    gw.name === 'razorpay' ? 'bg-blue-100 text-blue-600' :
                    gw.name === 'stripe'   ? 'bg-purple-100 text-purple-600' :
                                             'bg-yellow-100 text-yellow-600'
                  }`}>
                    {gw.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{gw.displayName}</h3>
                      <StatusBadge status={gw.status} />
                      {gw.isTestMode && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 font-medium">
                          Test Mode
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 capitalize mt-0.5">
                      {GATEWAY_LABELS[gw.name]?.label ?? gw.name} · Priority: {gw.priority}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gw.status === 'inactive' ? (
                    <button
                      onClick={() => activate(gw.id)}
                      disabled={actionLoading === gw.id + '_activate'}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === gw.id + '_activate' ? 'Activating…' : 'Activate'}
                    </button>
                  ) : (
                    <button
                      onClick={() => deactivate(gw.id)}
                      disabled={actionLoading === gw.id + '_deactivate'}
                      className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    onClick={() => { setEditTarget(gw); setShowForm(true); }}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  {gw.status === 'inactive' && (
                    <button
                      onClick={() => deleteGw(gw.id, gw.displayName)}
                      disabled={actionLoading === gw.id + '_delete'}
                      className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Masked Config */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(gw.configMasked).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{k}</p>
                    <p className="text-xs font-mono text-gray-700 mt-0.5 truncate">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Last updated: {new Date(gw.updatedAt).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GatewayForm
          editing={editTarget ?? undefined}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}
