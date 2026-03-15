'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Gem, Plus, Trash2, CheckCircle, XCircle, MapPin,
  ChevronDown, RefreshCw, BadgeCheck, ChevronRight,
  Building2, Globe, AlertCircle,
} from 'lucide-react';
import { agencyApi, locationsApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CoverageRow {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  tick: string;
  coverageType: 'state' | 'city' | 'locality';
  stateName?: string;
  cityName?: string;
  localityName?: string;
  citySlug?: string;
  localitySlug?: string;
  isActive: boolean;
  approvedAt?: string;
  createdAt: string;
}

interface AgentOption {
  id: string;
  user: { id: string; name: string };
  tick: string;
}

interface StateOption  { id: string; name: string; slug?: string }
interface CityOption   { id: string; name: string; slug?: string; stateId?: string; state?: { name: string } }
interface LocalityOption { id: string; locality?: string; name?: string; slug?: string; city?: string; pincode?: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function TickBadge({ tick }: { tick: string }) {
  if (tick === 'diamond')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
        <Gem className="w-2.5 h-2.5" />Diamond
      </span>
    );
  if (tick === 'gold')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        ★ Gold
      </span>
    );
  if (tick === 'blue')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        <BadgeCheck className="w-2.5 h-2.5" />Verified
      </span>
    );
  return <span className="text-[10px] text-gray-400">—</span>;
}

function CoverageTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    locality: { cls: 'bg-purple-50 text-purple-700 border border-purple-100', label: 'Locality', icon: <MapPin className="w-2.5 h-2.5" /> },
    city:     { cls: 'bg-blue-50 text-blue-700 border border-blue-100',       label: 'City',     icon: <Building2 className="w-2.5 h-2.5" /> },
    state:    { cls: 'bg-green-50 text-green-700 border border-green-100',    label: 'State',    icon: <Globe className="w-2.5 h-2.5" /> },
  };
  const c = cfg[type] ?? cfg.locality;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ── Select component ───────────────────────────────────────────────────────────

function SelectField({
  label, value, onChange, disabled, placeholder, children, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white appearance-none pr-9 transition-colors focus:ring-2 focus:ring-violet-300 focus:outline-none ${
            disabled
              ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-gray-200 text-gray-900 hover:border-violet-300'
          }`}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
      </div>
    </div>
  );
}

// ── Add Coverage Modal ─────────────────────────────────────────────────────────

function AddCoverageModal({
  agents, onClose, onSaved,
}: {
  agents: AgentOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [agentProfileId, setAgentProfileId] = useState('');
  const [coverageType, setCoverageType]     = useState<'state' | 'city' | 'locality'>('locality');

  // Location selections
  const [selectedState,    setSelectedState]    = useState<StateOption | null>(null);
  const [selectedCity,     setSelectedCity]     = useState<CityOption | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<LocalityOption | null>(null);

  // Options
  const [states,     setStates]     = useState<StateOption[]>([]);
  const [cities,     setCities]     = useState<CityOption[]>([]);
  const [localities, setLocalities] = useState<LocalityOption[]>([]);

  // Loading
  const [loadingStates,     setLoadingStates]     = useState(false);
  const [loadingCities,     setLoadingCities]     = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Load states on mount — uses public /locations/states (returns plain array)
  useEffect(() => {
    setLoadingStates(true);
    locationsApi.getStates()
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setStates(data);
      })
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, []);

  // Load cities when state changes — uses public /locations/states/{id}/cities (returns plain array)
  useEffect(() => {
    if (!selectedState) { setCities([]); setSelectedCity(null); setLocalities([]); setSelectedLocality(null); return; }
    setLoadingCities(true);
    setCities([]); setSelectedCity(null); setLocalities([]); setSelectedLocality(null);
    locationsApi.getCitiesByState(selectedState.id)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setCities(data);
      })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [selectedState]);

  // Load localities when city changes — uses public /locations/localities?city=&state= (returns plain array)
  useEffect(() => {
    if (!selectedCity || coverageType !== 'locality') { setLocalities([]); setSelectedLocality(null); return; }
    setLoadingLocalities(true);
    setLocalities([]); setSelectedLocality(null);
    locationsApi.getLocalities(selectedCity.name, selectedState?.name)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setLocalities(data);
      })
      .catch(() => setLocalities([]))
      .finally(() => setLoadingLocalities(false));
  }, [selectedCity, coverageType]);

  // Reset locality when coverageType changes
  useEffect(() => {
    setSelectedLocality(null);
    if (coverageType !== 'locality') { setLocalities([]); }
  }, [coverageType]);

  const handleSave = async () => {
    if (!agentProfileId)               { setError('Select an agent'); return; }
    if (!selectedState)                { setError('Select a state'); return; }
    if (coverageType !== 'state' && !selectedCity)     { setError('Select a city'); return; }
    if (coverageType === 'locality' && !selectedLocality) { setError('Select a locality'); return; }

    setSaving(true); setError('');
    try {
      await agencyApi.adminAddCoverage({
        agentProfileId,
        coverageType,
        stateId:    selectedState?.id,
        stateName:  selectedState?.name,
        cityId:     selectedCity?.id,
        cityName:   selectedCity?.name,
        localityId: selectedLocality?.id,
        localityName: selectedLocality ? (selectedLocality.locality ?? selectedLocality.name ?? '') : undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add coverage');
    } finally {
      setSaving(false);
    }
  };

  const localityDisplayName = (l: LocalityOption) => l.locality ?? l.name ?? '';

  const isValid = agentProfileId && selectedState
    && (coverageType === 'state' || selectedCity)
    && (coverageType !== 'locality' || selectedLocality);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Gem className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Add Coverage Area</h2>
              <p className="text-[11px] text-gray-400">Select location from our system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Agent picker */}
          <SelectField
            label="Diamond Agent"
            value={agentProfileId}
            onChange={setAgentProfileId}
            placeholder="— Select an agent —"
            required
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.user.name}
                {a.tick === 'diamond' ? '  💎 Diamond' : a.tick === 'gold' ? '  ★ Gold' : a.tick === 'blue' ? '  ✓ Verified' : ''}
              </option>
            ))}
          </SelectField>

          {/* Coverage type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Coverage Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'locality', label: 'Locality', icon: <MapPin className="w-3.5 h-3.5" />, desc: 'Specific area' },
                { val: 'city',     label: 'City',     icon: <Building2 className="w-3.5 h-3.5" />, desc: 'Entire city' },
                { val: 'state',    label: 'State',    icon: <Globe className="w-3.5 h-3.5" />, desc: 'Whole state' },
              ] as const).map(t => (
                <button
                  key={t.val}
                  onClick={() => setCoverageType(t.val)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                    coverageType === t.val
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-500 hover:border-violet-200 hover:bg-violet-50/30'
                  }`}
                >
                  <span className={coverageType === t.val ? 'text-violet-600' : 'text-gray-400'}>{t.icon}</span>
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className="text-[10px] text-gray-400">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Breadcrumb hint */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
            <span className={selectedState ? 'text-violet-600 font-semibold' : ''}>State</span>
            {coverageType !== 'state' && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className={selectedCity ? 'text-violet-600 font-semibold' : ''}>City</span>
              </>
            )}
            {coverageType === 'locality' && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className={selectedLocality ? 'text-violet-600 font-semibold' : ''}>Locality</span>
              </>
            )}
          </div>

          {/* State select */}
          <SelectField
            label="State"
            value={selectedState?.id ?? ''}
            onChange={id => {
              const s = states.find(s => s.id === id) ?? null;
              setSelectedState(s);
            }}
            placeholder={loadingStates ? 'Loading states…' : '— Select state —'}
            disabled={loadingStates}
            required
          >
            {states.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SelectField>

          {/* City select (shown for city + locality) */}
          {coverageType !== 'state' && (
            <SelectField
              label="City"
              value={selectedCity?.id ?? ''}
              onChange={id => {
                const c = cities.find(c => c.id === id) ?? null;
                setSelectedCity(c);
              }}
              placeholder={
                !selectedState ? 'Select state first'
                : loadingCities ? 'Loading cities…'
                : cities.length === 0 ? 'No cities found'
                : '— Select city —'
              }
              disabled={!selectedState || loadingCities}
              required
            >
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
          )}

          {/* Locality select (shown only for locality) */}
          {coverageType === 'locality' && (
            <SelectField
              label="Locality"
              value={selectedLocality?.id ?? ''}
              onChange={id => {
                const l = localities.find(l => l.id === id) ?? null;
                setSelectedLocality(l);
              }}
              placeholder={
                !selectedCity ? 'Select city first'
                : loadingLocalities ? 'Loading localities…'
                : localities.length === 0 ? 'No localities found'
                : '— Select locality —'
              }
              disabled={!selectedCity || loadingLocalities}
              required
            >
              {localities.map(l => (
                <option key={l.id} value={l.id}>
                  {localityDisplayName(l)}{l.pincode ? ` — ${l.pincode}` : ''}
                </option>
              ))}
            </SelectField>
          )}

          {/* Preview */}
          {isValid && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-violet-800 mb-0.5">Coverage Preview</p>
                <p className="text-violet-600">
                  {coverageType === 'locality' && selectedLocality
                    ? `${localityDisplayName(selectedLocality)}, ${selectedCity?.name}, ${selectedState?.name}`
                    : coverageType === 'city' && selectedCity
                    ? `${selectedCity.name}, ${selectedState?.name}`
                    : selectedState?.name}
                  {' '}
                  <CoverageTypeBadge type={coverageType} />
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValid}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add Coverage
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentCoveragePage() {
  const [rows, setRows]           = useState<CoverageRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents]       = useState<AgentOption[]>([]);

  // Filter state
  const [allStates,  setAllStates]  = useState<StateOption[]>([]);
  const [allCities,  setAllCities]  = useState<CityOption[]>([]);
  const [filterState, setFilterState] = useState('');
  const [filterCity,  setFilterCity]  = useState('');
  const [filterTick,  setFilterTick]  = useState('');
  const [loadingFilterCities, setLoadingFilterCities] = useState(false);

  const limit = 20;

  // Load filter states once
  useEffect(() => {
    locationsApi.getStates()
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setAllStates(data);
      })
      .catch(() => {});
  }, []);

  // Load filter cities when filter state changes
  useEffect(() => {
    setFilterCity('');
    if (!filterState) { setAllCities([]); return; }
    setLoadingFilterCities(true);
    locationsApi.getCitiesByState(filterState)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items ?? []);
        setAllCities(data);
      })
      .catch(() => setAllCities([]))
      .finally(() => setLoadingFilterCities(false));
  }, [filterState]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const selectedCity = allCities.find(c => c.id === filterCity);
      const r = await agencyApi.adminListCoverage({
        city:  selectedCity?.name || undefined,
        tick:  filterTick        || undefined,
        page,
        limit,
      });
      setRows(Array.isArray(r.data?.items) ? r.data.items : []);
      setTotal(r.data?.total ?? 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterTick, page, allCities]);

  const loadAgents = useCallback(async () => {
    if (agents.length > 0) return;
    try {
      const r = await agencyApi.adminGetAgentProfiles({ limit: 200 });
      const data = r.data?.items ?? r.data ?? [];
      setAgents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [agents.length]);

  useEffect(() => { load(); }, [load]);

  const handleApprove    = async (id: string) => { await agencyApi.adminApproveCoverage(id);    load(); };
  const handleDeactivate = async (id: string) => { await agencyApi.adminDeactivateCoverage(id); load(); };
  const handleRemove     = async (id: string) => {
    if (!confirm('Remove this coverage area?')) return;
    await agencyApi.adminRemoveCoverage(id);
    load();
  };

  const openModal = async () => {
    await loadAgents();
    setShowModal(true);
  };

  const coverageLabel = (row: CoverageRow) => {
    if (row.coverageType === 'locality') return `${row.localityName}, ${row.cityName}`;
    if (row.coverageType === 'city')     return row.cityName ?? '—';
    return row.stateName ?? '—';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Diamond Coverage Areas</h1>
            <p className="text-sm text-gray-400">Manage locality coverage for premium badge agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            title="Refresh"
            className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-violet-200"
          >
            <Plus className="w-4 h-4" />
            Add Coverage
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-violet-700 flex items-center gap-1.5 mb-1">
          <Gem className="w-3.5 h-3.5" /> How Diamond Coverage Works
        </p>
        <p className="text-[12px] text-violet-600 leading-relaxed">
          Diamond agents with mapped localities appear at the <b>top of search results</b> when users search
          within those areas. Coverage can be at <b>locality</b>, <b>city</b>, or <b>state</b> level — broader
          coverage includes all nested sub-areas.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Filter Coverage</p>
        <div className="flex flex-wrap gap-3">

          {/* State filter */}
          <div className="relative">
            <select
              value={filterState}
              onChange={e => { setFilterState(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:ring-2 focus:ring-violet-200 focus:outline-none min-w-[140px]"
            >
              <option value="">All States</option>
              {allStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* City filter */}
          <div className="relative">
            <select
              value={filterCity}
              onChange={e => { setFilterCity(e.target.value); setPage(1); }}
              disabled={!filterState || loadingFilterCities}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:ring-2 focus:ring-violet-200 focus:outline-none min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!filterState ? 'All Cities' : loadingFilterCities ? 'Loading…' : 'All Cities'}
              </option>
              {allCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Tier filter */}
          <div className="relative">
            <select
              value={filterTick}
              onChange={e => { setFilterTick(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:ring-2 focus:ring-violet-200 focus:outline-none min-w-[120px]"
            >
              <option value="">All Tiers</option>
              <option value="diamond">💎 Diamond</option>
              <option value="gold">★ Gold</option>
              <option value="blue">✓ Verified</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {(filterState || filterCity || filterTick) && (
            <button
              onClick={() => { setFilterState(''); setFilterCity(''); setFilterTick(''); setPage(1); }}
              className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Coverage',   val: total,                              cls: 'bg-violet-50 text-violet-700' },
          { label: 'Showing',          val: Math.min(rows.length, total),       cls: 'bg-blue-50 text-blue-700' },
          { label: 'Active',           val: rows.filter(r => r.isActive).length, cls: 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`${s.cls} rounded-xl px-4 py-3 text-center`}>
            <p className="text-xl font-bold">{s.val}</p>
            <p className="text-[11px] font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-7 h-7 text-gray-200 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading coverage areas…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-gray-200" />
            </div>
            <p className="text-gray-500 font-semibold">No coverage areas found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting filters or add a new coverage area</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Agent</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Badge</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Level</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Coverage Area</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Added</th>
                  <th className="px-4 py-3.5 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-violet-50/20 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                        {row.agentName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><TickBadge tick={row.tick} /></td>
                    <td className="px-4 py-3.5"><CoverageTypeBadge type={row.coverageType} /></td>
                    <td className="px-4 py-3.5">
                      <span className="text-gray-700 font-medium">{coverageLabel(row)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {row.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3 h-3" />Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {!row.isActive ? (
                          <button
                            onClick={() => handleApprove(row.id)}
                            title="Activate"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(row.id)}
                            title="Deactivate"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(row.id)}
                          title="Remove"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="text-xs text-gray-400">
            Showing <b className="text-gray-600">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</b> of <b className="text-gray-600">{total}</b>
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = Math.max(1, page - 2) + i;
              if (pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    pg === page
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <AddCoverageModal
          agents={agents}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
