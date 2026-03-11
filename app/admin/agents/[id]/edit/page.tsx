'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, adminLocationsApi, locationsApi } from '@/lib/api';

interface State { id: string; name: string; code: string; }
interface City  { id: string; name: string; stateId: string; }

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState('');
  const [states, setStates]     = useState<State[]>([]);
  const [cities, setCities]     = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [form, setForm] = useState({
    name:            '',
    email:           '',
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
    agentTick:       'none' as 'none' | 'blue' | 'gold' | 'diamond',
  });

  // Load agent data + states on mount
  useEffect(() => {
    Promise.all([
      adminApi.getAgent(id),
      adminLocationsApi.getStates(),
    ]).then(([agentRes, statesRes]) => {
      const a = agentRes.data;
      setForm({
        name:            a.name            ?? '',
        email:           a.email           ?? '',
        phone:           a.phone           ?? '',
        company:         a.company         ?? '',
        stateId:         a.stateId         ?? '',
        state:           a.state           ?? '',
        cityId:          a.cityId          ?? '',
        city:            a.city            ?? '',
        agentLicense:    a.agentLicense    ?? '',
        agentBio:        a.agentBio        ?? '',
        agentExperience: a.agentExperience != null ? String(a.agentExperience) : '',
        agentFreeQuota:  a.agentFreeQuota  != null ? String(a.agentFreeQuota)  : '100',
        agentTick:       a.agentTick       ?? 'none',
      });
      setStates(statesRes.data || []);
    }).catch(() => setError('Failed to load agent data'))
      .finally(() => setFetching(false));
  }, [id]);

  // Load cities when stateId changes (after initial load)
  useEffect(() => {
    if (!form.stateId) { setCities([]); return; }
    setLoadingCities(true);
    locationsApi.getCitiesByState(form.stateId)
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
      await adminApi.updateAgent(id, {
        ...form,
        agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined,
        agentFreeQuota:  parseInt(form.agentFreeQuota) || 100,
      });
      router.push('/admin/agents');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update agent');
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

  if (fetching) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm space-y-3">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/agents" className="text-gray-400 hover:text-gray-600 text-sm">← Agents</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
        {form.name && <span className="text-gray-400 text-sm">— {form.name}</span>}
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Account Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Account Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" name="name"  placeholder="Amit Verma"           required />
            <Field label="Email"     name="email"  type="email" placeholder="agent@example.com" required />
            <Field label="Phone"     name="phone"  placeholder="9876543210" />
            <Field label="Company"   name="company" placeholder="PropElite Realty" />
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Professional Info</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="RERA License"       name="agentLicense"    placeholder="MH-RERA-A12345" />
            <Field label="Experience (years)" name="agentExperience" type="number" placeholder="5" />

            {/* Agent Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Badge</label>
              <select
                value={form.agentTick}
                onChange={e => set('agentTick', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="blue">✓ Verified (Blue)</option>
                <option value="gold">★ Gold</option>
                <option value="diamond">◆ Diamond</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.agentBio}
              onChange={e => set('agentBio', e.target.value)}
              placeholder="Short professional bio..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Location — State → City cascade */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">Location Assignment</h2>
          <p className="text-xs text-gray-500 mb-4 mt-2">
            The agent operates primarily in this location. Changing this does not restrict existing listings.
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
                  {loadingCities ? 'Loading...' : form.stateId ? '— Select City —' : '— Select state first —'}
                </option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {(form.city || form.state) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span>📍</span>
              <span>Currently assigned to: <strong>{[form.city, form.state].filter(Boolean).join(', ')}</strong></span>
            </div>
          )}
        </div>

        {/* Listing Quota */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-1">Listing Quota</h2>
          <p className="text-sm text-gray-500 mb-4">
            Free listings this agent can post. Change this to grant or restrict capacity.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              value={form.agentFreeQuota}
              onChange={e => set('agentFreeQuota', e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">free listings</span>
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
            {loading ? 'Saving...' : 'Save Changes'}
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
