'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, adminLocationsApi, locationsApi, agencyApi } from '@/lib/api';

interface State { id: string; name: string; code: string; }
interface City  { id: string; name: string; stateId: string; }
interface Locality { id: string; name: string; }
interface CoverageLocation {
  id: string;
  coverageType: 'state' | 'city' | 'locality';
  stateName?: string; cityName?: string; localityName?: string;
  isActive?: boolean;
}

// Defined outside component to keep a stable reference and prevent focus-loss on each keystroke
function Field({
  label, name, form, onChange, type = 'text', placeholder, required,
}: {
  label: string;
  name: string;
  form: Record<string, string>;
  onChange: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name] ?? ''}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState('');
  const [states, setStates]     = useState<State[]>([]);
  const [cities, setCities]     = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Coverage areas
  const [agentProfileId, setAgentProfileId] = useState<string | null>(null);
  const [coverageLocations, setCoverageLocations] = useState<CoverageLocation[]>([]);
  const [covStates, setCovStates] = useState<State[]>([]);
  const [covCities, setCovCities] = useState<City[]>([]);
  const [covLocalities, setCovLocalities] = useState<Locality[]>([]);
  const [newCov, setNewCov] = useState<{
    coverageType: 'state' | 'city' | 'locality';
    stateId: string; stateName: string;
    selectedCities: { id: string; name: string }[];
    cityId: string; cityName: string;
    selectedLocalities: { id: string; name: string }[];
  }>({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
  const [addingCov, setAddingCov] = useState(false);
  const [covError, setCovError] = useState('');

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
    agentTick:       'none' as 'none' | 'verified' | 'bronze' | 'silver' | 'gold',
  });

  // Load agent data + states on mount
  useEffect(() => {
    Promise.all([
      adminApi.getAgent(id),
      adminLocationsApi.getStates(),
      agencyApi.adminGetAgentProfileByUser(id).catch(() => ({ data: null })),
    ]).then(([agentRes, statesRes, profileRes]) => {
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
      const profile = profileRes.data;
      if (profile?.id) {
        setAgentProfileId(profile.id);
        agencyApi.adminListCoverage({ agentProfileId: profile.id })
          .then(r => setCoverageLocations(r.data?.items || r.data || []))
          .catch(() => {});
      }
    }).catch(() => setError('Failed to load agent data'))
      .finally(() => setFetching(false));

    // Load states for coverage section
    adminLocationsApi.getStates()
      .then(r => setCovStates(r.data || []))
      .catch(() => {});
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

  // Load coverage cities when coverage stateId changes
  useEffect(() => {
    if (!newCov.stateId) { setCovCities([]); setCovLocalities([]); return; }
    locationsApi.getCitiesByState(newCov.stateId)
      .then(r => setCovCities(r.data || []))
      .catch(() => {});
    setNewCov(p => ({ ...p, selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] }));
  }, [newCov.stateId]);

  // Load coverage localities when coverage cityName changes
  useEffect(() => {
    if (!newCov.cityName) { setCovLocalities([]); return; }
    locationsApi.getLocalities(newCov.cityName)
      .then(r => setCovLocalities(r.data || []))
      .catch(() => {});
    setNewCov(p => ({ ...p, selectedLocalities: [] }));
  }, [newCov.cityName]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const onStateChange = (stateId: string) => {
    const found = states.find(s => s.id === stateId);
    setForm(prev => ({ ...prev, stateId, state: found?.name ?? '', cityId: '', city: '' }));
  };

  const onCityChange = (cityId: string) => {
    const found = cities.find(c => c.id === cityId);
    setForm(prev => ({ ...prev, cityId, city: found?.name ?? '' }));
  };

  function coverageLabel(loc: CoverageLocation) {
    if (loc.coverageType === 'locality') return `${loc.localityName}, ${loc.cityName}, ${loc.stateName}`;
    if (loc.coverageType === 'city') return `${loc.cityName}, ${loc.stateName}`;
    return loc.stateName || 'Unknown';
  }

  async function handleAddCoverage() {
    if (!agentProfileId) return;
    const { coverageType, stateId, stateName, selectedCities, cityId, cityName, selectedLocalities } = newCov;
    if (coverageType === 'state' && !stateId) { setCovError('Select a state.'); return; }
    if (coverageType === 'city' && selectedCities.length === 0) { setCovError('Select at least one city.'); return; }
    if (coverageType === 'locality' && !cityId) { setCovError('Select a city.'); return; }
    if (coverageType === 'locality' && selectedLocalities.length === 0) { setCovError('Select at least one locality.'); return; }
    setCovError('');
    setAddingCov(true);
    try {
      if (coverageType === 'city') {
        for (const city of selectedCities) {
          await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'city', stateId, stateName, cityId: city.id, cityName: city.name });
        }
      } else if (coverageType === 'locality') {
        for (const loc of selectedLocalities) {
          await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'locality', stateId, stateName, cityId, cityName, localityId: loc.id, localityName: loc.name });
        }
      } else {
        await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'state', stateId, stateName });
      }
      const refreshed = await agencyApi.adminListCoverage({ agentProfileId });
      setCoverageLocations(refreshed.data?.items || refreshed.data || []);
      setNewCov({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
    } catch (e: any) {
      setCovError(e?.response?.data?.message || 'Failed to add coverage area.');
    } finally {
      setAddingCov(false);
    }
  }

  async function handleRemoveCoverage(locationId: string) {
    try {
      await agencyApi.adminRemoveCoverage(locationId);
      setCoverageLocations(prev => prev.filter(l => l.id !== locationId));
    } catch {
      setCovError('Failed to remove coverage area.');
    }
  }

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
            <Field label="Full Name" name="name"  form={form} onChange={set} placeholder="Amit Verma"           required />
            <Field label="Email"     name="email"  form={form} onChange={set} type="email" placeholder="agent@example.com" required />
            <Field label="Phone"     name="phone"  form={form} onChange={set} placeholder="9876543210" />
            <Field label="Company"   name="company" form={form} onChange={set} placeholder="PropElite Realty" />
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Professional Info</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="RERA License"       name="agentLicense"    form={form} onChange={set} placeholder="MH-RERA-A12345" />
            <Field label="Experience (years)" name="agentExperience" form={form} onChange={set} type="number" placeholder="5" />

            {/* Agent Badge */}
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

        {/* Coverage Areas */}
        {agentProfileId && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">Coverage Areas</h2>
            <p className="text-xs text-gray-500 mb-4 mt-2">Manage the states, cities, or localities this agent covers.</p>

            {/* Add coverage form */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 mb-4 space-y-3">
              {/* Coverage type */}
              <div className="flex gap-2">
                {(['state', 'city', 'locality'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewCov(p => ({ ...p, coverageType: t, selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                      newCov.coverageType === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {/* State */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <select
                    value={newCov.stateId}
                    onChange={e => {
                      const opt = covStates.find(s => s.id === e.target.value);
                      setNewCov(p => ({ ...p, stateId: e.target.value, stateName: opt?.name || '' }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select State —</option>
                    {covStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Multi-city for 'city' type */}
                {newCov.coverageType === 'city' && newCov.stateId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cities <span className="text-gray-400">(select one or more)</span></label>
                    {covCities.length === 0 ? (
                      <p className="text-xs text-gray-400">No cities available</p>
                    ) : (
                      <>
                        <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white">
                          {covCities.map(c => {
                            const checked = newCov.selectedCities.some(s => s.id === c.id);
                            return (
                              <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => setNewCov(p => ({
                                    ...p,
                                    selectedCities: checked
                                      ? p.selectedCities.filter(s => s.id !== c.id)
                                      : [...p.selectedCities, { id: c.id, name: c.name }],
                                  }))}
                                  className="accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">{c.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        {newCov.selectedCities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {newCov.selectedCities.map(c => (
                              <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {c.name}
                                <button type="button" onClick={() => setNewCov(p => ({ ...p, selectedCities: p.selectedCities.filter(s => s.id !== c.id) }))} className="hover:text-blue-900">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Locality type: single city then multi-locality */}
                {newCov.coverageType === 'locality' && newCov.stateId && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <select
                        value={newCov.cityId}
                        onChange={e => {
                          const opt = covCities.find(c => c.id === e.target.value);
                          setNewCov(p => ({ ...p, cityId: e.target.value, cityName: opt?.name || '' }));
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select City —</option>
                        {covCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {newCov.cityId && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Localities <span className="text-gray-400">(select one or more)</span></label>
                        {covLocalities.length === 0 ? (
                          <p className="text-xs text-gray-400">No localities available</p>
                        ) : (
                          <>
                            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white">
                              {covLocalities.map(l => {
                                const checked = newCov.selectedLocalities.some(s => s.id === l.id);
                                return (
                                  <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => setNewCov(p => ({
                                        ...p,
                                        selectedLocalities: checked
                                          ? p.selectedLocalities.filter(s => s.id !== l.id)
                                          : [...p.selectedLocalities, { id: l.id, name: l.name }],
                                      }))}
                                      className="accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">{l.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {newCov.selectedLocalities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {newCov.selectedLocalities.map(loc => (
                                  <span key={loc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    {loc.name}
                                    <button type="button" onClick={() => setNewCov(p => ({ ...p, selectedLocalities: p.selectedLocalities.filter(s => s.id !== loc.id) }))} className="hover:text-blue-900">×</button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {covError && <p className="text-xs text-red-600">{covError}</p>}
              <button
                type="button"
                onClick={handleAddCoverage}
                disabled={addingCov}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addingCov ? 'Adding...' : '+ Add Coverage'}
              </button>
            </div>

            {/* Existing coverage list */}
            {coverageLocations.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No coverage areas added yet.</p>
            ) : (
              <ul className="space-y-2">
                {coverageLocations.map((loc) => (
                  <li key={loc.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        loc.coverageType === 'state'    ? 'bg-purple-100 text-purple-700' :
                        loc.coverageType === 'city'     ? 'bg-blue-100 text-blue-700' :
                                                          'bg-green-100 text-green-700'
                      }`}>{loc.coverageType}</span>
                      <span className="text-sm text-gray-800">{coverageLabel(loc)}</span>
                      {loc.isActive === false && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">Pending</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoverage(loc.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
