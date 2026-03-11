'use client';

import { useEffect, useState, useCallback } from 'react';
import { alertsApi } from '@/lib/api';

interface Alert {
  id: string;
  alertName: string;
  category?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  isActive: boolean;
  frequency: string;
  createdAt: string;
}

const CATEGORIES = ['buy', 'rent', 'pg', 'commercial'];
const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'house', 'penthouse', 'studio', 'pg', 'commercial_office'];
const FREQUENCIES = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Summary' },
];
const BEDROOMS = [1, 2, 3, 4, 5];

const PRICE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '₹10L', value: '1000000' },
  { label: '₹25L', value: '2500000' },
  { label: '₹50L', value: '5000000' },
  { label: '₹75L', value: '7500000' },
  { label: '₹1Cr', value: '10000000' },
  { label: '₹1.5Cr', value: '15000000' },
  { label: '₹2Cr', value: '20000000' },
  { label: '₹5Cr', value: '50000000' },
];

function formatPrice(amount?: number) {
  if (!amount) return 'Any';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
  return `₹${amount.toLocaleString()}`;
}

const DEFAULT_FORM = {
  alertName: '',
  category: '',
  city: '',
  locality: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  frequency: 'daily',
};

export default function PropertyAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await alertsApi.getAll();
      const data = r.data;
      setAlerts(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setField(key: keyof typeof DEFAULT_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.alertName.trim()) { setError('Alert name is required'); return; }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await alertsApi.create({
        alertName: form.alertName.trim(),
        category: form.category || undefined,
        city: form.city.trim() || undefined,
        locality: form.locality.trim() || undefined,
        propertyType: form.propertyType || undefined,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        frequency: form.frequency,
      });
      setSuccess('Alert created! You will be notified when matching properties are listed.');
      setForm(DEFAULT_FORM);
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      await alertsApi.toggle(id);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isActive: !a.isActive } : a));
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await alertsApi.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">Get notified when properties matching your criteria are listed</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? '× Cancel' : '+ New Alert'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-5 text-sm">
          ✓ {success}
        </div>
      )}

      {/* Create Alert Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Create New Alert</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alert Name *</label>
              <input
                type="text"
                placeholder="e.g., 3BHK in Gurgaon under 1Cr"
                value={form.alertName}
                onChange={(e) => setField('alertName', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Any category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => setField('propertyType', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
              <input
                type="text"
                placeholder="e.g., Gurgaon"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Locality</label>
              <input
                type="text"
                placeholder="e.g., Sector 56"
                value={form.locality}
                onChange={(e) => setField('locality', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Price</label>
              <select
                value={form.minPrice}
                onChange={(e) => setField('minPrice', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PRICE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Price</label>
              <select
                value={form.maxPrice}
                onChange={(e) => setField('maxPrice', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PRICE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bedrooms</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setField('bedrooms', '')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.bedrooms === '' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Any
                </button>
                {BEDROOMS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setField('bedrooms', String(b))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      form.bedrooms === String(b) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {b}+
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notification Frequency</label>
              <div className="flex gap-2 flex-wrap">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setField('frequency', f.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      form.frequency === f.value ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : '🔔 Create Alert'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setError(''); }}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No alerts yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Create property alerts and we'll notify you when new matching properties are listed.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 transition-opacity ${
                alert.isActive ? 'border-blue-400 opacity-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{alert.alertName}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      alert.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {alert.isActive ? '● Active' : '○ Paused'}
                    </span>
                  </div>

                  {/* Alert criteria chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {alert.category && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs capitalize">{alert.category}</span>
                    )}
                    {alert.city && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">📍 {alert.city}</span>
                    )}
                    {alert.locality && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">{alert.locality}</span>
                    )}
                    {alert.propertyType && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs capitalize">{alert.propertyType.replace(/_/g, ' ')}</span>
                    )}
                    {alert.bedrooms && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">🛏 {alert.bedrooms}+ BHK</span>
                    )}
                    {(alert.minPrice || alert.maxPrice) && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                        💰 {formatPrice(alert.minPrice)} – {formatPrice(alert.maxPrice)}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs capitalize">
                      🔔 {alert.frequency}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(alert.id)}
                    disabled={togglingId === alert.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      alert.isActive
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {togglingId === alert.id ? '...' : alert.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    disabled={deletingId === alert.id}
                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {deletingId === alert.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex gap-3">
          <span className="text-blue-500 text-lg flex-shrink-0">💡</span>
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">How alerts work</div>
            <ul className="space-y-0.5 text-blue-700 text-xs">
              <li>• We scan new listings every hour matching your criteria</li>
              <li>• You'll get notifications based on your chosen frequency</li>
              <li>• Create multiple alerts for different cities or property types</li>
              <li>• Pause an alert temporarily without losing your criteria</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
