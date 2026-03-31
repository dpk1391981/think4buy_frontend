'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, locationsApi, agencyApi } from '@/lib/api';

interface Locality { id: string; name: string; }
interface CoverageLocation {
  id: string;
  coverageType: 'state' | 'city' | 'locality';
  stateName?: string; cityName?: string; localityName?: string;
  cityId?: string; stateId?: string;
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

  // Coverage areas
  const [agentProfileId, setAgentProfileId] = useState<string | null>(null);
  const [coverageLocations, setCoverageLocations] = useState<CoverageLocation[]>([]);
  const [covLocalities, setCovLocalities]   = useState<Locality[]>([]);
  const [covCitySearch, setCovCitySearch] = useState('');
  const [covCitySuggestions, setCovCitySuggestions] = useState<{ id: string; name: string; stateName?: string; stateId?: string }[]>([]);
  const [showCovCitySug, setShowCovCitySug] = useState(false);
  const covCityTimer = useRef<ReturnType<typeof setTimeout>>();
  const [newCov, setNewCov] = useState<{
    coverageType: 'city' | 'locality';
    stateId: string; stateName: string;
    selectedCities: { id: string; name: string; stateId?: string; stateName?: string }[];
    cityId: string; cityName: string;
    selectedLocalities: { id: string; name: string }[];
  }>({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
  const [addingCov, setAddingCov] = useState(false);
  const [covError, setCovError] = useState('');

  // Trust signals
  const [trustForm, setTrustForm] = useState({ complaintCount: '0', avgResponseHours: '' });
  const [savingTrust, setSavingTrust] = useState(false);
  const [trustSaved, setTrustSaved] = useState(false);

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

  // Load agent data on mount
  useEffect(() => {
    Promise.all([
      adminApi.getAgent(id),
      agencyApi.adminGetAgentProfileByUser(id).catch(() => ({ data: null })),
    ]).then(([agentRes, profileRes]) => {
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
      const profile = profileRes.data;
      if (profile?.id) {
        setAgentProfileId(profile.id);
        agencyApi.adminListCoverage({ agentProfileId: profile.id })
          .then(r => {
            const coverage: CoverageLocation[] = r.data?.items || r.data || [];
            setCoverageLocations(coverage);
            // If agent never set a primary city (onboarding only added coverage),
            // auto-populate city from the first coverage entry.
            if (!a.city) {
              const firstCity = coverage.find(
                l => (l.coverageType === 'city' || l.coverageType === 'locality') && l.cityName,
              );
              if (firstCity) {
                setForm(prev => ({
                  ...prev,
                  city:    prev.city    || firstCity.cityName    || '',
                  state:   prev.state   || firstCity.stateName   || '',
                }));
              }
            }
          })
          .catch(() => {});
        setTrustForm({
          complaintCount:  String(profile.complaintCount  ?? 0),
          avgResponseHours: profile.avgResponseHours != null ? String(profile.avgResponseHours) : '',
        });
      }
    }).catch(() => setError('Failed to load agent data'))
      .finally(() => setFetching(false));

  }, [id]);

  // Load coverage localities when coverage cityName changes
  useEffect(() => {
    if (!newCov.cityName) { setCovLocalities([]); return; }
    locationsApi.getLocalities(newCov.cityName)
      .then(r => setCovLocalities(r.data || []))
      .catch(() => {});
    setNewCov(p => ({ ...p, selectedLocalities: [] }));
  }, [newCov.cityName]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCovCitySearch = (value: string) => {
    setCovCitySearch(value);
    setShowCovCitySug(true);
    clearTimeout(covCityTimer.current);
    if (!value.trim()) { setCovCitySuggestions([]); setShowCovCitySug(false); return; }
    covCityTimer.current = setTimeout(async () => {
      try {
        const r = await locationsApi.getCities(value, 20);
        const d = r.data?.data || r.data || [];
        setCovCitySuggestions(Array.isArray(d) ? d : []);
      } catch {}
    }, 300);
  };

  const selectCovCity = (city: { id: string; name: string; stateName?: string; stateId?: string }) => {
    if (newCov.coverageType === 'city') {
      if (!newCov.selectedCities.some(c => c.id === city.id)) {
        setNewCov(p => ({
          ...p,
          selectedCities: [...p.selectedCities, { id: city.id, name: city.name, stateId: city.stateId, stateName: city.stateName }],
        }));
      }
      setCovCitySearch('');
      setCovCitySuggestions([]);
      setShowCovCitySug(false);
    } else {
      // locality type — set single city
      setCovCitySearch(city.name);
      setShowCovCitySug(false);
      setCovCitySuggestions([]);
      setNewCov(p => ({
        ...p,
        cityId: city.id,
        cityName: city.name,
        stateId: city.stateId || '',
        stateName: city.stateName || '',
        selectedLocalities: [],
      }));
    }
  };

  function coverageLabel(loc: CoverageLocation) {
    if (loc.coverageType === 'locality') return `${loc.localityName}, ${loc.cityName}, ${loc.stateName}`;
    if (loc.coverageType === 'city') return `${loc.cityName}, ${loc.stateName}`;
    return loc.stateName || 'Unknown';
  }

  async function handleAddCoverage() {
    if (!agentProfileId) return;
    const { coverageType, stateId, stateName, selectedCities, cityId, cityName, selectedLocalities } = newCov;
    if (coverageType === 'city' && selectedCities.length === 0) { setCovError('Select at least one city.'); return; }
    if (coverageType === 'locality' && !cityId) { setCovError('Select a city.'); return; }
    if (coverageType === 'locality' && selectedLocalities.length === 0) { setCovError('Select at least one locality.'); return; }
    setCovError('');
    setAddingCov(true);
    try {
      if (coverageType === 'city') {
        for (const city of selectedCities) {
          await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'city', stateId: city.stateId, stateName: city.stateName, cityId: city.id, cityName: city.name });
        }
      } else {
        for (const loc of selectedLocalities) {
          await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'locality', stateId, stateName, cityId, cityName, localityId: loc.id, localityName: loc.name });
        }
      }
      const refreshed = await agencyApi.adminListCoverage({ agentProfileId });
      setCoverageLocations(refreshed.data?.items || refreshed.data || []);
      setNewCov({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
      setCovCitySearch('');
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

  async function saveTrustSignals() {
    if (!agentProfileId) return;
    setSavingTrust(true);
    try {
      await agencyApi.adminUpdateTrustSignals(agentProfileId, {
        complaintCount:  parseInt(trustForm.complaintCount) || 0,
        avgResponseHours: trustForm.avgResponseHours ? parseInt(trustForm.avgResponseHours) : null,
      });
      setTrustSaved(true);
      setTimeout(() => setTrustSaved(false), 3000);
    } catch { /* ignore */ } finally { setSavingTrust(false); }
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
        {form.name && (
          <Link
            href={`/agents/${form.name.toLowerCase().replace(/\s+/g, '-')}/${(form.city || 'india').toLowerCase().replace(/\s+/g, '-')}`}
            target="_blank"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            View Profile
          </Link>
        )}
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

        {/* Coverage Areas */}
        {agentProfileId && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">Coverage Areas</h2>
            <p className="text-xs text-gray-500 mb-4 mt-2">Manage the cities and localities this agent covers. Select a primary city to show on the agent card.</p>

            {/* Add coverage form */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 mb-4 space-y-3">
              {/* Coverage type */}
              <div className="flex gap-2">
                {(['city', 'locality'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setNewCov(p => ({ ...p, coverageType: t, selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] }));
                      setCovCitySearch('');
                      setCovCitySuggestions([]);
                    }}
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
                {/* City search autocomplete */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {newCov.coverageType === 'city' ? 'Search & add cities' : 'Search city'}
                  </label>
                  <input
                    type="text"
                    value={covCitySearch}
                    onChange={e => handleCovCitySearch(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCovCitySug(false), 150)}
                    onFocus={() => covCitySearch && setShowCovCitySug(true)}
                    placeholder="Type city name…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {showCovCitySug && covCitySuggestions.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {covCitySuggestions.map(c => (
                        <li
                          key={c.id}
                          onMouseDown={() => selectCovCity(c)}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        >
                          {c.name}{c.stateName ? ` — ${c.stateName}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Selected cities chips (city type) */}
                {newCov.coverageType === 'city' && newCov.selectedCities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newCov.selectedCities.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {c.name}{c.stateName ? `, ${c.stateName}` : ''}
                        <button type="button" onClick={() => setNewCov(p => ({ ...p, selectedCities: p.selectedCities.filter(s => s.id !== c.id) }))} className="hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Localities for locality type */}
                {newCov.coverageType === 'locality' && newCov.cityId && (
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
                              <span key={loc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                {loc.name}
                                <button type="button" onClick={() => setNewCov(p => ({ ...p, selectedLocalities: p.selectedLocalities.filter(s => s.id !== loc.id) }))} className="hover:text-green-900">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </>
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
              <>
                {/* Primary city selector — only shown when there are city/locality entries */}
                {(() => {
                  const cityEntries = coverageLocations.filter(l => l.coverageType === 'city' || l.coverageType === 'locality');
                  const uniqueCities = Array.from(new Map(cityEntries.filter(l => l.cityName).map(l => [l.cityName, l])).values());
                  if (uniqueCities.length > 1) {
                    return (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-xs font-medium text-amber-800 mb-2">Primary city (shown on agent card)</p>
                        <div className="flex flex-wrap gap-3">
                          {uniqueCities.map(loc => (
                            <label key={loc.cityName} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="primaryCity"
                                checked={form.city === loc.cityName}
                                onChange={() => {
                                  setForm(prev => ({ ...prev, city: loc.cityName || '', cityId: loc.cityId || prev.cityId }));
                                }}
                                className="accent-amber-600"
                              />
                              <span className="text-sm text-gray-700">{loc.cityName}</span>
                              {form.city === loc.cityName && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-200 text-amber-800">Primary</span>
                              )}
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-amber-600 mt-1.5">Click "Save Changes" to persist the primary city selection.</p>
                      </div>
                    );
                  }
                  return null;
                })()}
                <ul className="space-y-2">
                  {coverageLocations.map((loc) => (
                    <li key={loc.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          loc.coverageType === 'city' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>{loc.coverageType}</span>
                        <span className="text-sm text-gray-800">{coverageLabel(loc)}</span>
                        {loc.cityName && form.city === loc.cityName && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Primary</span>
                        )}
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
              </>
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

        {/* Trust Signals */}
        {agentProfileId && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-1">Broker Transparency Signals</h2>
            <p className="text-sm text-gray-500 mb-4">
              These signals appear on the agent's public trust profile. Complaints are always shown — do not suppress.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complaint Count</label>
                <input
                  type="number"
                  min={0}
                  value={trustForm.complaintCount}
                  onChange={e => setTrustForm(f => ({ ...f, complaintCount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Verified complaints. Shown publicly. Cannot hide if &gt; 0.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Avg Response Time (hours)</label>
                <input
                  type="number"
                  min={0}
                  value={trustForm.avgResponseHours}
                  onChange={e => setTrustForm(f => ({ ...f, avgResponseHours: e.target.value }))}
                  placeholder="e.g. 2"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank if unknown.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={saveTrustSignals}
                disabled={savingTrust}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {savingTrust ? 'Saving…' : 'Save Trust Signals'}
              </button>
              {trustSaved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
            </div>
          </div>
        )}

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
