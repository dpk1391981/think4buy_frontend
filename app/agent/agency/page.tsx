'use client';

import { useEffect, useRef, useState } from 'react';
import { agencyApi, locationsApi } from '@/lib/api';
import { MapPin, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface CoverageEntry {
  id: string;
  coverageType: 'state' | 'city' | 'locality';
  stateName?: string;
  cityName?: string;
  localityName?: string;
  isActive?: boolean;
}

interface CityOption { id: string; name: string; }
interface LocalityOption { id: string; name: string; }

export default function MyCoveragePage() {
  const [locations, setLocations] = useState<CoverageEntry[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Add-coverage form state
  const [coverageType, setCoverageType] = useState<'city' | 'locality'>('city');

  // City search
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // City coverage: multiple cities selected
  const [selectedCities, setSelectedCities] = useState<CityOption[]>([]);

  // Locality coverage: single city, then localities
  const [locCity, setLocCity] = useState<CityOption | null>(null);
  const [localities, setLocalities] = useState<LocalityOption[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [selectedLocalities, setSelectedLocalities] = useState<LocalityOption[]>([]);
  const [localitySearch, setLocalitySearch] = useState('');

  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Load existing coverage on mount
  useEffect(() => {
    agencyApi.getMyLocations()
      .then((r) => setLocations(r.data || []))
      .catch(() => showToast('error', 'Failed to load coverage areas.'))
      .finally(() => setPageLoading(false));
  }, []);

  // Load localities when locCity changes
  useEffect(() => {
    if (!locCity || coverageType !== 'locality') { setLocalities([]); setSelectedLocalities([]); return; }
    setLocLoading(true);
    locationsApi.getLocalities(locCity.name)
      .then((r) => {
        const raw: any[] = r.data || [];
        // API returns { id, locality, city } — normalize to { id, name }
        setLocalities(raw.map((l) => ({ id: l.id, name: l.locality || l.name || '' })));
      })
      .catch(() => {})
      .finally(() => setLocLoading(false));
    setSelectedLocalities([]);
    setLocalitySearch('');
  }, [locCity, coverageType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form when coverage type changes
  useEffect(() => {
    setCitySearch('');
    setCitySuggestions([]);
    setShowSuggestions(false);
    setSelectedCities([]);
    setLocCity(null);
    setLocalities([]);
    setSelectedLocalities([]);
    setLocalitySearch('');
  }, [coverageType]);

  function handleCityInput(value: string) {
    setCitySearch(value);
    setShowSuggestions(true);
    if (cityTimer.current) clearTimeout(cityTimer.current);
    if (!value.trim()) { setCitySuggestions([]); setShowSuggestions(false); return; }
    cityTimer.current = setTimeout(async () => {
      try {
        const r = await locationsApi.getCities(value, 20);
        const d = r.data?.data || r.data || [];
        setCitySuggestions(Array.isArray(d) ? d : []);
      } catch {}
    }, 300);
  }

  function handleCitySelect(city: CityOption) {
    if (coverageType === 'city') {
      if (!selectedCities.some(c => c.id === city.id)) {
        setSelectedCities(prev => [...prev, city]);
      }
      setCitySearch('');
      setCitySuggestions([]);
      setShowSuggestions(false);
    } else {
      setLocCity(city);
      setCitySearch(city.name);
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  }

  function removeSelectedCity(id: string) {
    setSelectedCities(prev => prev.filter(c => c.id !== id));
  }

  function toggleLocality(loc: LocalityOption) {
    setSelectedLocalities(prev =>
      prev.some(l => l.id === loc.id)
        ? prev.filter(l => l.id !== loc.id)
        : [...prev, loc]
    );
  }

  async function handleAdd() {
    if (coverageType === 'city' && selectedCities.length === 0) {
      showToast('error', 'Select at least one city.');
      return;
    }
    if (coverageType === 'locality' && !locCity) {
      showToast('error', 'Select a city first.');
      return;
    }
    if (coverageType === 'locality' && selectedLocalities.length === 0) {
      showToast('error', 'Select at least one locality.');
      return;
    }

    setAdding(true);
    try {
      if (coverageType === 'city') {
        for (const city of selectedCities) {
          await agencyApi.addMyLocation({ coverageType: 'city', cityId: city.id, cityName: city.name });
        }
      } else {
        for (const loc of selectedLocalities) {
          await agencyApi.addMyLocation({
            coverageType: 'locality',
            cityId: locCity!.id, cityName: locCity!.name,
            localityId: loc.id, localityName: loc.name,
          });
        }
      }
      const r = await agencyApi.getMyLocations();
      setLocations(r.data || []);
      // Reset form
      setCitySearch('');
      setCitySuggestions([]);
      setSelectedCities([]);
      setLocCity(null);
      setLocalities([]);
      setSelectedLocalities([]);
      setLocalitySearch('');
      showToast('success', 'Coverage area added successfully.');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to add coverage.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await agencyApi.removeMyLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
      showToast('success', 'Coverage area removed.');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to remove.');
    } finally {
      setRemovingId(null);
    }
  }

  function coverageLabel(loc: CoverageEntry) {
    if (loc.coverageType === 'locality') return `${loc.localityName}, ${loc.cityName}`;
    if (loc.coverageType === 'city') return loc.cityName || '—';
    return loc.stateName || '—';
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const filteredLocalities = localities.filter(l =>
    !localitySearch || l.name.toLowerCase().includes(localitySearch.toLowerCase())
  );

  if (pageLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-500" />
          My Coverage
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage the cities and localities you serve. This controls where you appear as a featured agent.
        </p>
      </div>

      {/* Add Coverage Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" />
          Add Coverage Area
        </h2>

        {/* Type tabs */}
        <div className="flex gap-2 mb-4">
          {(['city', 'locality'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCoverageType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                coverageType === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {t === 'city' ? '🏙 City Level' : '📍 Locality Level'}
            </button>
          ))}
        </div>

        {/* City search */}
        <div className="relative mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {coverageType === 'city' ? 'Search & Add Cities' : 'Select City'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => handleCityInput(e.target.value)}
              onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type to search city..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {coverageType === 'locality' && locCity && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
          {showSuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
              {citySuggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => handleCitySelect(c)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected cities chips (city mode) */}
        {coverageType === 'city' && selectedCities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedCities.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {c.name}
                <button type="button" onClick={() => removeSelectedCity(c.id)} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Localities panel (locality mode) */}
        {coverageType === 'locality' && locCity && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Localities in {locCity.name}
              <span className="text-gray-400 ml-1 font-normal">(select one or more)</span>
            </label>
            {locLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading localities…
              </div>
            ) : localities.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No localities found for this city.</p>
            ) : (
              <>
                {/* Locality search filter */}
                <input
                  type="text"
                  value={localitySearch}
                  onChange={(e) => setLocalitySearch(e.target.value)}
                  placeholder="Filter localities..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto bg-white">
                  {filteredLocalities.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-gray-400">No matches</p>
                  ) : filteredLocalities.map((l) => {
                    const checked = selectedLocalities.some(s => s.id === l.id);
                    return (
                      <label key={l.id} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLocality(l)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{l.name}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedLocalities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedLocalities.map(l => (
                      <span key={l.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {l.name}
                        <button type="button" onClick={() => toggleLocality(l)} className="hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><Plus className="w-4 h-4" /> Add Coverage</>}
        </button>
      </div>

      {/* Existing coverage list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            Active Coverage Areas
          </h2>
          {locations.length > 0 && (
            <span className="text-xs text-gray-400">{locations.length} area{locations.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {locations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No coverage areas yet</p>
            <p className="text-xs text-gray-400 mt-1">Add cities or localities above to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    loc.coverageType === 'locality' ? 'bg-green-100 text-green-700' :
                    loc.coverageType === 'city'     ? 'bg-blue-100 text-blue-700'  :
                                                      'bg-purple-100 text-purple-700'
                  }`}>
                    {loc.coverageType}
                  </span>
                  <span className="text-sm text-gray-800 truncate">{coverageLabel(loc)}</span>
                  {loc.isActive === false && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-700 font-medium">Pending</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(loc.id)}
                  disabled={removingId === loc.id}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  {removingId === loc.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
