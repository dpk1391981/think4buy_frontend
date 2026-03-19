'use client';

import { useEffect, useState } from 'react';
import { authApi, agencyApi, locationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AvatarUpload from '@/components/common/AvatarUpload';

interface ProfileForm {
  name: string;
  phone: string;
  city: string;
  company: string;
  agentLicense: string;
  agentBio: string;
  agentExperience: string;
}

interface LocationEntry {
  id: string;
  coverageType: 'state' | 'city' | 'locality';
  stateName?: string;
  cityName?: string;
  localityName?: string;
  stateSlug?: string;
  citySlug?: string;
  localitySlug?: string;
  isActive?: boolean;
}

interface StateOption { id: string; name: string; slug?: string; }
interface CityOption  { id: string; name: string; slug?: string; stateId?: string; }
interface LocalityOption { id: string; name: string; slug?: string; }

export default function AgentProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    city: '',
    company: '',
    agentLicense: '',
    agentBio: '',
    agentExperience: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Coverage areas
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [localities, setLocalities] = useState<LocalityOption[]>([]);
  const [newLoc, setNewLoc] = useState<{
    coverageType: 'state' | 'city' | 'locality';
    stateId: string; stateName: string;
    // For type='city': multiple cities can be selected
    selectedCities: { id: string; name: string }[];
    // For type='locality': single city to load localities, then multiple localities
    cityId: string; cityName: string;
    selectedLocalities: { id: string; name: string }[];
  }>({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
  const [addingLoc, setAddingLoc] = useState(false);

  useEffect(() => {
    authApi.getProfile()
      .then((r) => {
        const d = r.data;
        setForm({
          name: d.name || '',
          phone: d.phone || '',
          city: d.city || '',
          company: d.company || '',
          agentLicense: d.agentLicense || '',
          agentBio: d.agentBio || '',
          agentExperience: d.agentExperience ? String(d.agentExperience) : '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load coverage areas and states on mount
  useEffect(() => {
    agencyApi.getMyLocations().then((r) => setLocations(r.data || [])).catch(console.error);
    locationsApi.getStates().then((r) => setStates(r.data || [])).catch(console.error);
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (!newLoc.stateId) { setCities([]); setLocalities([]); return; }
    locationsApi.getCitiesByState(newLoc.stateId)
      .then((r) => setCities(r.data || []))
      .catch(console.error);
    setLocalities([]);
    setNewLoc((p) => ({ ...p, selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] }));
  }, [newLoc.stateId]);

  // Load localities when city changes (for locality coverage type)
  useEffect(() => {
    if (!newLoc.cityName) { setLocalities([]); return; }
    locationsApi.getLocalities(newLoc.cityName)
      .then((r) => setLocalities(r.data || []))
      .catch(console.error);
    setNewLoc((p) => ({ ...p, selectedLocalities: [] }));
  }, [newLoc.cityName]);

  async function handleAddLocation() {
    const { coverageType, stateId, stateName, selectedCities, cityId, cityName, selectedLocalities } = newLoc;
    if (coverageType === 'state' && !stateId) { showToast('error', 'Select a state.'); return; }
    if (coverageType === 'city' && selectedCities.length === 0) { showToast('error', 'Select at least one city.'); return; }
    if (coverageType === 'locality' && !cityId) { showToast('error', 'Select a city.'); return; }
    if (coverageType === 'locality' && selectedLocalities.length === 0) { showToast('error', 'Select at least one locality.'); return; }
    setAddingLoc(true);
    try {
      if (coverageType === 'city') {
        for (const city of selectedCities) {
          await agencyApi.addMyLocation({
            coverageType: 'city',
            stateId, stateName,
            cityId: city.id, cityName: city.name,
          });
        }
      } else if (coverageType === 'locality') {
        for (const loc of selectedLocalities) {
          await agencyApi.addMyLocation({
            coverageType: 'locality',
            stateId, stateName,
            cityId, cityName,
            localityId: loc.id, localityName: loc.name,
          });
        }
      } else {
        await agencyApi.addMyLocation({ coverageType: 'state', stateId, stateName });
      }
      const refreshed = await agencyApi.getMyLocations();
      setLocations(refreshed.data || []);
      setNewLoc({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
      showToast('success', 'Coverage area added.');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to add coverage area.');
    } finally {
      setAddingLoc(false);
    }
  }

  async function handleRemoveLocation(id: string) {
    setLocLoading(true);
    try {
      await agencyApi.removeMyLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      showToast('success', 'Coverage area removed.');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to remove coverage area.');
    } finally {
      setLocLoading(false);
    }
  }

  function coverageLabel(loc: LocationEntry) {
    if (loc.coverageType === 'locality') return `${loc.localityName}, ${loc.cityName}, ${loc.stateName}`;
    if (loc.coverageType === 'city') return `${loc.cityName}, ${loc.stateName}`;
    return loc.stateName || 'Unknown';
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { showToast('error', 'Name is required.'); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: form.name.trim(),
        city: form.city.trim() || undefined,
        company: form.company.trim() || undefined,
        ...({ phone: form.phone.trim() || undefined } as any),
        ...({ agentLicense: form.agentLicense.trim() || undefined } as any),
        ...({ agentBio: form.agentBio.trim() || undefined } as any),
        ...({ agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined } as any),
      });
      await refresh();
      showToast('success', 'Profile updated successfully!');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your personal and professional information</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-5">
          <AvatarUpload size={88} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-base">{user?.name}</span>
              {user?.agentTick && user.agentTick !== 'none' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  user.agentTick === 'blue'    ? 'bg-blue-100 text-blue-700' :
                  user.agentTick === 'gold'    ? 'bg-yellow-100 text-yellow-700' :
                  user.agentTick === 'diamond' ? 'bg-purple-100 text-purple-700' : ''
                }`}>
                  {user.agentTick === 'blue' ? '✓' : user.agentTick === 'gold' ? '★' : '◆'}
                  {' '}{user.agentTick.charAt(0).toUpperCase() + user.agentTick.slice(1)} Badge
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.email}</div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Professional Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company / Agency</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="e.g. XYZ Realty Pvt Ltd"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text"
                value={form.agentLicense}
                onChange={(e) => setForm((f) => ({ ...f, agentLicense: e.target.value }))}
                placeholder="e.g. RERA/MH/2024/001234"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Experience (years)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={form.agentExperience}
                onChange={(e) => setForm((f) => ({ ...f, agentExperience: e.target.value }))}
                placeholder="Years of experience"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.agentBio}
                onChange={(e) => setForm((f) => ({ ...f, agentBio: e.target.value }))}
                placeholder="A brief description about yourself and your expertise..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Coverage Areas — outside the profile form */}
      <div className="max-w-2xl mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Coverage Areas</h2>
          <p className="text-xs text-gray-500 mb-4">
            Add the states, cities, or localities you cover. This determines where you appear as a featured agent.
          </p>

          {/* Add new coverage */}
          <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 mb-5 space-y-3">
            {/* Coverage type selector */}
            <div className="flex gap-2">
              {(['state', 'city', 'locality'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewLoc((p) => ({ ...p, coverageType: t, selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                    newLoc.coverageType === t
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
                  value={newLoc.stateId}
                  onChange={(e) => {
                    const opt = states.find((s) => s.id === e.target.value);
                    setNewLoc((p) => ({ ...p, stateId: e.target.value, stateName: opt?.name || '' }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* City — multi-select for 'city' type, single for 'locality' type */}
              {newLoc.coverageType === 'city' && newLoc.stateId && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cities <span className="text-gray-400">(select one or more)</span>
                  </label>
                  {cities.length === 0 ? (
                    <p className="text-xs text-gray-400">No cities available</p>
                  ) : (
                    <>
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white">
                        {cities.map((c) => {
                          const checked = newLoc.selectedCities.some(s => s.id === c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setNewLoc((p) => ({
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
                      {newLoc.selectedCities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {newLoc.selectedCities.map(c => (
                            <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {c.name}
                              <button type="button" onClick={() => setNewLoc((p) => ({ ...p, selectedCities: p.selectedCities.filter(s => s.id !== c.id) }))} className="hover:text-blue-900">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* For locality type: single city dropdown then multi-locality */}
              {newLoc.coverageType === 'locality' && newLoc.stateId && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                    <select
                      value={newLoc.cityId}
                      onChange={(e) => {
                        const opt = cities.find((c) => c.id === e.target.value);
                        setNewLoc((p) => ({ ...p, cityId: e.target.value, cityName: opt?.name || '' }));
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select city</option>
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {newLoc.cityId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Localities <span className="text-gray-400">(select one or more)</span>
                      </label>
                      {localities.length === 0 ? (
                        <p className="text-xs text-gray-400">No localities available</p>
                      ) : (
                        <>
                          <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white">
                            {localities.map((l) => {
                              const checked = newLoc.selectedLocalities.some(s => s.id === l.id);
                              return (
                                <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setNewLoc((p) => ({
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
                          {newLoc.selectedLocalities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {newLoc.selectedLocalities.map(loc => (
                                <span key={loc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {loc.name}
                                  <button type="button" onClick={() => setNewLoc((p) => ({ ...p, selectedLocalities: p.selectedLocalities.filter(s => s.id !== loc.id) }))} className="hover:text-blue-900">×</button>
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

            <button
              type="button"
              onClick={handleAddLocation}
              disabled={addingLoc}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {addingLoc ? 'Adding...' : '+ Add Coverage'}
            </button>
          </div>

          {/* Existing coverage list */}
          {locations.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No coverage areas added yet.</p>
          ) : (
            <ul className="space-y-2">
              {locations.map((loc) => (
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
                    onClick={() => handleRemoveLocation(loc.id)}
                    disabled={locLoading}
                    className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 transition-colors"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
