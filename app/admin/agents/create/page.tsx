'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, adminLocationsApi } from '@/lib/api';

interface State { id: string; name: string; code: string; }
interface City  { id: string; name: string; stateId: string; }

export default function CreateAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    phone:           '',
    company:         '',
    stateId:         '',
    state:           '',
    cityId:          '',
    city:            '',
    agentLicense:    '',
    agentBio:        '',
    agentExperience: '',
    agentFreeQuota:  '100',
    agentTick:       'none' as 'none' | 'verified' | 'bronze' | 'silver' | 'gold',
  });

  // Load states on mount
  useEffect(() => {
    adminLocationsApi.getStates()
      .then(r => setStates(r.data || []))
      .catch(() => setStates([]));
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (!form.stateId) { setCities([]); return; }
    setLoadingCities(true);
    import('@/lib/api')
      .then(({ locationsApi }) => locationsApi.getCitiesByState(form.stateId))
      .then(r => setCities(r.data || []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [form.stateId]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const onStateChange = (stateId: string) => {
    const found = states.find(s => s.id === stateId);
    setForm(prev => ({ ...prev, stateId, state: found?.name ?? '', cityId: '', city: '' }));
  };

  const onCityChange = (cityId: string) => {
    const found = cities.find(c => c.id === cityId);
    setForm(prev => ({ ...prev, cityId, city: found?.name ?? '' }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createAgent({
        ...form,
        agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined,
        agentFreeQuota:  parseInt(form.agentFreeQuota) || 100,
      });
      router.push('/admin/agents');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  }

  const Field = ({
    label, name, type = 'text', placeholder, required,
  }: {
    label: string; name: keyof typeof form; type?: string; placeholder?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name] as string}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/agents" className="text-gray-400 hover:text-gray-600 text-sm">← Agents</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Create Agent</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Account Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Account Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"  name="name"     placeholder="Amit Verma"            required />
            <Field label="Email"      name="email"     type="email" placeholder="agent@example.com" required />
            <Field label="Password"   name="password"  type="password" placeholder="Min 8 characters" required />
            <Field label="Phone"      name="phone"     placeholder="9876543210" />
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Professional Info</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Company"            name="company"         placeholder="PropElite Realty" />
            <Field label="RERA License"       name="agentLicense"    placeholder="MH-RERA-A12345" />
            <Field label="Experience (years)" name="agentExperience" type="number" placeholder="5" />

            {/* Agent Badge / Tick */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Badge</label>
              <select
                value={form.agentTick}
                onChange={e => set('agentTick', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="verified">✓ Verified</option>
                <option value="bronze">◉ Bronze</option>
                <option value="silver">◈ Silver</option>
                <option value="gold">★ Gold</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.agentBio}
              onChange={e => set('agentBio', e.target.value)}
              placeholder="Short professional bio..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Location — State → City cascade */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">Location Assignment</h2>
          <p className="text-xs text-gray-500 mb-4 mt-2">
            Assign this agent to a specific state and city. They will primarily operate in this location.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={form.stateId}
                onChange={e => onStateChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select State —</option>
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {states.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No states found. Add states in Locations → States first.</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={form.cityId}
                onChange={e => onCityChange(e.target.value)}
                disabled={!form.stateId || loadingCities}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {loadingCities ? 'Loading cities...' : form.stateId ? '— Select City —' : '— Select state first —'}
                </option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.stateId && !loadingCities && cities.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No cities in this state. Add cities in Locations first.</p>
              )}
            </div>
          </div>

          {/* Preview selected location */}
          {(form.city || form.state) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span>📍</span>
              <span>
                Agent will be assigned to: <strong>{[form.city, form.state].filter(Boolean).join(', ')}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Listing Quota */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-1">Listing Quota</h2>
          <p className="text-sm text-gray-500 mb-4">
            Free property listings this agent can post. After the quota, paid plans are required.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              value={form.agentFreeQuota}
              onChange={e => set('agentFreeQuota', e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">free listings (default: 100)</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Agent'}
          </button>
          <Link
            href="/admin/agents"
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
