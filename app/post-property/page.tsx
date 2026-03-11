'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, ArrowLeft, ArrowRight, Upload, X, ImagePlus,
  MapPin, Loader2, Building2, Home, Factory, Users, TrendingUp,
  Zap, Info, Camera, Eye,
} from 'lucide-react';
import { propertiesApi, locationsApi } from '@/lib/api';
import { detectLocation, reverseGeocode } from '@/lib/geolocation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { updateForm, nextStep, prevStep, setStep, resetForm, setSubmitting, setSubmitError } from '@/lib/store/slices/postPropertySlice';
import {
  PROPERTY_CATEGORIES, PROPERTY_TYPES_ALL, LISTING_TYPES, BHK_OPTIONS,
  FURNISHING_OPTIONS, POSSESSION_OPTIONS, BROKERAGE_RENT_OPTIONS, BROKERAGE_SALE_OPTIONS,
  DESCRIPTION_HINTS, generatePropertyTitle, USER_TYPE_OPTIONS,
  AGENT_DAILY_CREDITS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MediaFile { file: File; preview: string; type: 'image' | 'video'; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Tile({ label, icon, selected, onClick, sub, badge }: {
  label: string; icon?: React.ReactNode; selected: boolean;
  onClick: () => void; sub?: string; badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all text-sm font-semibold cursor-pointer select-none text-center',
        selected
          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md ring-2 ring-primary-200'
          : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm',
      )}
    >
      {badge && (
        <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{badge}</span>
      )}
      {icon && <span className="text-2xl leading-none">{icon}</span>}
      <span>{label}</span>
      {sub && <span className="text-xs text-gray-400 font-normal mt-0.5 leading-tight">{sub}</span>}
    </button>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  const STEP_LABELS = ['You', 'Category', 'Type', 'Prop Type', 'Location', 'Title', 'Details', 'Desc', 'Price', 'Photos'];
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-500"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      {/* Step labels - show only key ones on mobile */}
      <div className="flex justify-between text-[10px] text-gray-400 font-medium px-0.5">
        {STEP_LABELS.map((label, i) => (
          <span key={i} className={cn(
            'transition-colors hidden sm:block',
            i === current ? 'text-primary-600 font-bold' : i < current ? 'text-gray-600' : ''
          )}>{label}</span>
        ))}
        <span className="sm:hidden text-primary-600 font-bold text-xs">
          Step {current + 1} of {total}: {STEP_LABELS[current]}
        </span>
      </div>
    </div>
  );
}

// ─── Individual Step Components ───────────────────────────────────────────────

function Step0UserType({ form, dispatch }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Who are you listing as?</h2>
      <p className="text-gray-500 text-sm mb-6">This helps buyers know who to contact</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Owner tile */}
        <Tile
          label="Owner"
          icon={<Home className="w-6 h-6" />}
          sub="I own this property"
          selected={form.userType === 'owner'}
          onClick={() => dispatch(updateForm({ userType: 'owner', agencyName: '' }))}
        />
        {/* Agent tile */}
        <Tile
          label="Agent / Broker"
          icon={<Building2 className="w-6 h-6" />}
          sub="I'm listing on behalf of a client"
          selected={form.userType === 'agent'}
          onClick={() => dispatch(updateForm({ userType: 'agent' }))}
        />
      </div>

      {/* Owner confirmation */}
      {form.userType === 'owner' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-green-600 text-xl mt-0.5">🏠</span>
          <div>
            <div className="font-semibold text-green-800 text-sm">Listing as Property Owner</div>
            <p className="text-green-700 text-xs mt-0.5">
              Your listing will show <strong>Direct from Owner</strong>. No brokerage paid by buyers.
            </p>
          </div>
        </div>
      )}

      {/* Agent: agency name required */}
      {form.userType === 'agent' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Agency / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.agencyName || ''}
              onChange={(e) => dispatch(updateForm({ agencyName: e.target.value }))}
              placeholder="e.g., Rahul Properties, Century Real Estate"
              className={cn(
                'w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors',
                form.agencyName?.trim()
                  ? 'border-primary-400 focus:border-primary-500 bg-primary-50/30'
                  : 'border-gray-200 focus:border-primary-400'
              )}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Displayed on your listing as the listing agency
            </p>
          </div>

          {form.agencyName?.trim() && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-blue-600 text-xl mt-0.5">🏢</span>
              <div>
                <div className="font-semibold text-blue-800 text-sm">Listing via {form.agencyName.trim()}</div>
                <p className="text-blue-700 text-xs mt-0.5">
                  Buyers will see your agency name and can contact you directly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step1MainCategory({ form, dispatch }: any) {
  const MAIN_CATEGORIES = [
    { value: 'residential', label: 'Residential', icon: <Home className="w-6 h-6" />, desc: 'Flats, Villas, Houses' },
    { value: 'commercial', label: 'Commercial', icon: <Building2 className="w-6 h-6" />, desc: 'Office, Shop, Retail' },
    { value: 'industrial', label: 'Industrial', icon: <Factory className="w-6 h-6" />, desc: 'Factory, Warehouse' },
    { value: 'pg', label: 'PG / Co-Living', icon: '🛏️', desc: 'Paying Guest, Hostel' },
    { value: 'builder_project', label: 'New Project', icon: '🏗️', desc: 'Builder Floors, Society' },
    { value: 'investment', label: 'Investment', icon: <TrendingUp className="w-6 h-6" />, desc: 'Plots, Land, REITs' },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Select Property Category</h2>
      <p className="text-gray-500 text-sm mb-6">What type of property are you listing?</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MAIN_CATEGORIES.map((cat) => (
          <Tile key={cat.value} label={cat.label} icon={cat.icon} sub={cat.desc}
            selected={form.mainCategory === cat.value}
            onClick={() => dispatch(updateForm({ mainCategory: cat.value, propertyType: '', listingType: '' }))}
          />
        ))}
      </div>
    </div>
  );
}

function Step2ListingType({ form, dispatch }: any) {
  const isPG = form.mainCategory === 'pg';
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">{isPG ? 'PG Type' : 'Listing Purpose'}</h2>
      <p className="text-gray-500 text-sm mb-6">
        {isPG ? 'PG is always for rent' : 'Are you selling or renting this property?'}
      </p>
      {isPG ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-800">
          <p className="font-semibold">PG / Co-Living is automatically listed for Rent</p>
          <p className="text-sm text-blue-600 mt-1">Proceed to next step to fill details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LISTING_TYPES.map((lt) => (
            <Tile key={lt.value} label={lt.label} icon={lt.icon} sub={lt.desc}
              selected={form.listingType === lt.value}
              onClick={() => dispatch(updateForm({ listingType: lt.value as any }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Step3PropertyType({ form, dispatch }: any) {
  const catMap: Record<string, string[]> = {
    residential: ['apartment', 'villa', 'house', 'builder_floor', 'penthouse', 'studio', 'farm_house'],
    commercial: ['commercial_office', 'commercial_shop', 'showroom'],
    industrial: ['commercial_warehouse', 'factory', 'industrial_shed'],
    pg: ['pg', 'co_living'],
    builder_project: ['apartment', 'villa', 'builder_floor'],
    investment: ['plot', 'land', 'commercial_warehouse'],
  };
  const allowed = catMap[form.mainCategory] || [];
  const types = PROPERTY_TYPES_ALL.filter(t => allowed.includes(t.value));

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Property Type</h2>
      <p className="text-gray-500 text-sm mb-6">Select the specific type of property</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {types.map((t) => (
          <Tile key={t.value} label={t.label} icon={t.icon}
            selected={form.propertyType === t.value}
            onClick={() => dispatch(updateForm({ propertyType: t.value, bedrooms: '' }))}
          />
        ))}
      </div>
    </div>
  );
}

function Step4Location({ form, dispatch }: any) {
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [localitySuggestions, setLocalitySuggestions] = useState<any[]>([]);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'found' | 'denied' | 'error'>('idle');
  const debounce = useRef<NodeJS.Timeout>();
  const isAgent = form.userType === 'agent';

  // Load states from DB
  useEffect(() => {
    locationsApi.getStates().then(r => {
      const data = r.data;
      const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setStates(arr);
    }).catch(() => {});
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (!form.stateId && (!form.state || states.length === 0)) { setCities([]); return; }
    const stateObj = form.stateId
      ? states.find(s => s.id === form.stateId)
      : states.find(s => s.name === form.state);
    if (!stateObj) { setCities([]); return; }
    locationsApi.getCitiesByState(stateObj.id).then(r => {
      const data = r.data;
      const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setCities(arr);
    }).catch(() => setCities([]));
  }, [form.stateId, form.state, states]);

  const fetchLocalities = async (city: string, q: string) => {
    if (!q || q.length < 2) { setLocalitySuggestions([]); return; }
    try {
      const { data } = await locationsApi.search(`${q} ${city}`);
      setLocalitySuggestions(data.slice(0, 6));
    } catch { setLocalitySuggestions([]); }
  };

  const handleStateChange = (stateId: string) => {
    const stateObj = states.find(s => s.id === stateId);
    dispatch(updateForm({ stateId, state: stateObj?.name || '', city: '', cityId: '' }));
  };

  const handleCityChange = (cityId: string) => {
    const cityObj = cities.find(c => c.id === cityId);
    dispatch(updateForm({ cityId, city: cityObj?.name || '' }));
  };

  const handleDetectLocation = async () => {
    setGeoStatus('detecting');
    try {
      const loc = await detectLocation();
      dispatch(updateForm({ latitude: loc.lat, longitude: loc.lng }));
      setGeoStatus('found');

      // Auto-fill state/city if matched in DB
      if (loc.state && states.length > 0) {
        const stateMatch = states.find(s => s.name.toLowerCase() === loc.state.toLowerCase());
        if (stateMatch) {
          dispatch(updateForm({ stateId: stateMatch.id, state: stateMatch.name, city: '', cityId: '' }));
          // Load cities for matched state and try to auto-select city
          try {
            const cityRes = await locationsApi.getCitiesByState(stateMatch.id);
            const cityArr: { id: string; name: string }[] = Array.isArray(cityRes.data) ? cityRes.data : [];
            if (cityArr.length > 0 && loc.city) {
              const cityMatch = cityArr.find(c => c.name.toLowerCase() === loc.city.toLowerCase());
              if (cityMatch) {
                dispatch(updateForm({ cityId: cityMatch.id, city: cityMatch.name }));
              } else {
                dispatch(updateForm({ city: loc.city, cityId: '' }));
              }
            }
          } catch {}
        }
      }
      if (loc.locality && !form.locality) {
        dispatch(updateForm({ locality: loc.locality }));
      }
    } catch (err: any) {
      setGeoStatus(err?.code === 1 ? 'denied' : 'error');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Property Location</h2>
      <p className="text-gray-500 text-sm mb-4">
        {isAgent ? 'City is required. Exact address is optional.' : 'All location fields are required.'}
      </p>

      <div className="space-y-3">
        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <select
            value={form.stateId}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">Select State</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* City - dropdown from DB if state selected, else text input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          {form.stateId && cities.length > 0 ? (
            <select
              value={form.cityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">Select City</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={form.city}
              onChange={(e) => dispatch(updateForm({ city: e.target.value, cityId: '' }))}
              placeholder={form.stateId ? 'Type city name' : 'Select state first'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          )}
        </div>

        {/* Locality */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area / Locality {!isAgent && '*'}
          </label>
          <input
            type="text"
            value={form.locality}
            onChange={(e) => {
              dispatch(updateForm({ locality: e.target.value }));
              clearTimeout(debounce.current);
              debounce.current = setTimeout(() => fetchLocalities(form.city, e.target.value), 300);
            }}
            placeholder="e.g., Koramangala, Bandra West"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          {localitySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden mt-1">
              {localitySuggestions.map((s, i) => (
                <button key={i} type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { dispatch(updateForm({ locality: s.locality || s.city, city: s.city })); setLocalitySuggestions([]); }}
                >
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {s.locality ? `${s.locality}, ${s.city}` : s.city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pincode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => dispatch(updateForm({ pincode: e.target.value.replace(/\D/g, '') }))}
              placeholder="110001"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAgent ? 'Society / Complex (optional)' : 'Society / Building'}
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => dispatch(updateForm({ address: e.target.value }))}
              placeholder="Prestige Shantiniketan"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Geolocation + Lat/Lng */}
        <div className="mt-1 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> GPS Coordinates (optional)
          </label>

          {/* Detect button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={geoStatus === 'detecting'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all mb-3',
              geoStatus === 'detecting'
                ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95',
            )}
          >
            {geoStatus === 'detecting' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location…</>
            ) : (
              <><MapPin className="w-4 h-4" /> Auto-detect my location</>
            )}
          </button>

          {/* Status messages */}
          {geoStatus === 'found' && (
            <p className="text-xs text-green-600 font-medium mb-2">
              ✓ Location detected — state/city auto-filled below
            </p>
          )}
          {geoStatus === 'denied' && (
            <p className="text-xs text-orange-600 mb-2">
              Location permission denied. Enter coordinates manually or select state/city above.
            </p>
          )}
          {geoStatus === 'error' && (
            <p className="text-xs text-red-500 mb-2">
              Could not detect location. Please select state/city manually.
            </p>
          )}

          {/* Lat/Lng inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) => dispatch(updateForm({ latitude: e.target.value ? Number(e.target.value) : null }))}
                placeholder="e.g. 19.0760"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) => dispatch(updateForm({ longitude: e.target.value ? Number(e.target.value) : null }))}
                placeholder="e.g. 72.8777"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Coordinates help buyers find your property on maps and improve search ranking.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step5AutoTitle({ form, dispatch }: any) {
  const autoTitle = generatePropertyTitle({
    category: form.mainCategory,
    listingType: form.listingType || (form.mainCategory === 'pg' ? 'rent' : 'buy'),
    propertyType: form.propertyType,
    bedrooms: form.bedrooms,
    city: form.city,
    locality: form.locality,
  });

  useEffect(() => {
    dispatch(updateForm({ autoTitle }));
  }, [autoTitle, dispatch]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Auto-Generated Title</h2>
      <p className="text-gray-500 text-sm mb-4">Your listing title is auto-generated for best SEO. You can customize it below.</p>

      <div className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Auto Title</div>
            <p className="text-lg font-bold text-primary-900">{autoTitle}</p>
            <p className="text-xs text-primary-600 mt-1">SEO URL: /{autoTitle.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-')}-{Date.now().toString(36)}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customize Title (optional)</label>
        <input
          type="text"
          value={form.autoTitle || autoTitle}
          onChange={(e) => dispatch(updateForm({ autoTitle: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          placeholder={autoTitle}
          maxLength={200}
        />
        <p className="text-xs text-gray-400 mt-1">Leave blank to use auto-generated title</p>
      </div>
    </div>
  );
}

function Step6Details({ form, dispatch }: any) {
  const isResidential = ['residential', 'pg', 'builder_project'].includes(form.mainCategory);
  const isIndustrial = form.mainCategory === 'industrial';
  const showBedrooms = isResidential && !['plot', 'land', 'pg', 'co_living'].includes(form.propertyType);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Property Details</h2>
      <p className="text-gray-500 text-sm mb-4">Fill in the specific details about your property</p>

      <div className="space-y-4">
        {/* BHK - Residential only */}
        {showBedrooms && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">BHK Configuration *</label>
            <div className="flex flex-wrap gap-2">
              {BHK_OPTIONS.map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => dispatch(updateForm({ bedrooms: opt.value }))}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                    form.bedrooms === opt.value
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-primary-300'
                  )}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Area */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isIndustrial ? 'Built-up Area (sqft) *' : 'Area *'}
            </label>
            <input
              type="number"
              value={form.area}
              onChange={(e) => dispatch(updateForm({ area: e.target.value }))}
              placeholder={isIndustrial ? '5000' : '1200'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={form.areaUnit}
              onChange={(e) => dispatch(updateForm({ areaUnit: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="sqft">Sq.ft</option>
              <option value="sqmt">Sq.mt</option>
              <option value="acre">Acre</option>
              <option value="gaj">Gaj</option>
              {isIndustrial && <option value="sqyd">Sq.yd</option>}
            </select>
          </div>
        </div>

        {/* Industrial-specific fields */}
        {isIndustrial && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <Factory className="w-4 h-4" /> Industrial Specifications
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ceiling Height (ft)</label>
                <input
                  type="number"
                  value={form.industrialHeight}
                  onChange={(e) => dispatch(updateForm({ industrialHeight: e.target.value }))}
                  placeholder="25"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Power Load (KW/KVA)</label>
                <input
                  type="text"
                  value={form.industrialPowerLoad}
                  onChange={(e) => dispatch(updateForm({ industrialPowerLoad: e.target.value }))}
                  placeholder="100KW"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasDock}
                  onChange={(e) => dispatch(updateForm({ hasDock: e.target.checked }))}
                  className="rounded"
                />
                Loading Dock
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasRamp}
                  onChange={(e) => dispatch(updateForm({ hasRamp: e.target.checked }))}
                  className="rounded"
                />
                Truck Ramp
              </label>
            </div>
          </div>
        )}

        {/* Residential extras */}
        {isResidential && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <select
                  value={form.bathrooms}
                  onChange={(e) => dispatch(updateForm({ bathrooms: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">Select</option>
                  {['1','2','3','4','5'].map(n => <option key={n} value={n}>{n} Bath</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={(e) => dispatch(updateForm({ floor: e.target.value }))}
                  placeholder="3"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>

            {!['plot', 'land'].includes(form.propertyType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {FURNISHING_OPTIONS.map(opt => (
                    <button
                      key={opt.value} type="button"
                      onClick={() => dispatch(updateForm({ furnishingStatus: opt.value }))}
                      className={cn(
                        'py-2 px-3 rounded-xl border text-xs font-medium transition-all',
                        form.furnishingStatus === opt.value
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-primary-300'
                      )}
                    >{opt.icon} {opt.label}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Possession Status</label>
              <div className="grid grid-cols-2 gap-2">
                {POSSESSION_OPTIONS.map(opt => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => dispatch(updateForm({ possessionStatus: opt.value }))}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-medium transition-all',
                      form.possessionStatus === opt.value
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-primary-300'
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Step7Description({ form, dispatch }: any) {
  const catHints = form.mainCategory === 'industrial'
    ? DESCRIPTION_HINTS.industrial
    : form.mainCategory === 'commercial'
    ? DESCRIPTION_HINTS.commercial
    : form.mainCategory === 'pg'
    ? DESCRIPTION_HINTS.pg
    : DESCRIPTION_HINTS.residential;

  const autoSuggest = () => {
    const title = form.autoTitle || generatePropertyTitle({
      category: form.mainCategory, listingType: form.listingType || 'rent',
      propertyType: form.propertyType, bedrooms: form.bedrooms,
      city: form.city, locality: form.locality,
    });
    const hint = `${title}. `;
    const details: string[] = [];
    if (form.bedrooms) details.push(`${form.bedrooms} BHK`);
    if (form.area) details.push(`${form.area} ${form.areaUnit}`);
    if (form.locality) details.push(`located in ${form.locality}`);
    if (form.city) details.push(form.city);
    const desc = hint + details.join(', ') + '. ' +
      'Contact us for more details and site visit.';
    dispatch(updateForm({ description: desc }));
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Property Description</h2>
      <p className="text-gray-500 text-sm mb-4">Describe your property to attract the right buyers/tenants</p>

      {/* Hint cards */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
          <Info className="w-4 h-4" /> Writing Tips
        </div>
        <ul className="space-y-1">
          {(catHints || []).map((hint: string, i: number) => (
            <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">→</span> {hint}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={autoSuggest}
        className="mb-3 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1.5 font-medium"
      >
        <Zap className="w-3.5 h-3.5" /> Auto-generate description
      </button>

      <textarea
        value={form.description}
        onChange={(e) => dispatch(updateForm({ description: e.target.value }))}
        rows={6}
        placeholder="Describe your property... include location advantages, nearby amenities, connectivity, unique features..."
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
        maxLength={2000}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Min 50 chars recommended</span>
        <span>{(form.description || '').length}/2000</span>
      </div>
    </div>
  );
}

function Step8Price({ form, dispatch }: any) {
  const isRent = form.listingType === 'rent' || form.mainCategory === 'pg';
  const isAgent = form.userType === 'agent';
  const brokerageOpts = isRent ? BROKERAGE_RENT_OPTIONS : BROKERAGE_SALE_OPTIONS;

  const formatPrice = (val: string) => {
    const n = Number(val);
    if (!n) return '';
    if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Crore`;
    if (n >= 100000) return `₹${(n/100000).toFixed(1)} Lakh`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {isRent ? 'Rent Amount' : 'Selling Price'}
      </h2>
      <p className="text-gray-500 text-sm mb-4">
        {isRent ? 'Set your monthly rent amount' : 'Set your property selling price'}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isRent ? 'Monthly Rent (₹) *' : 'Selling Price (₹) *'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => dispatch(updateForm({ price: e.target.value }))}
              placeholder={isRent ? '25000' : '5000000'}
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-lg font-bold"
            />
          </div>
          {form.price && (
            <p className="mt-1.5 text-primary-600 font-semibold text-sm">{formatPrice(form.price)}{isRent ? '/month' : ''}</p>
          )}
        </div>

        {/* Price unit for commercial/industrial */}
        {['commercial', 'industrial'].includes(form.mainCategory) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per</label>
            <div className="flex gap-2">
              {['total', 'per sqft', 'per month'].map(u => (
                <button key={u} type="button"
                  onClick={() => dispatch(updateForm({ priceUnit: u }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                    form.priceUnit === u ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600'
                  )}
                >{u}</button>
              ))}
            </div>
          </div>
        )}

        {/* Brokerage - shown for agents, optional for owners */}
        {(isAgent || form.userType === 'owner') && (
          <div className={cn('rounded-2xl p-4 border', isAgent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200')}>
            <label className="block text-sm font-bold mb-2 text-gray-700">
              {isAgent ? '💼 Brokerage Terms (Required for agents)' : '🏠 Brokerage (Optional for owners)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {brokerageOpts.map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => dispatch(updateForm({ brokerage: opt.value }))}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-medium transition-all',
                    form.brokerage === opt.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                  )}
                >{opt.label}</button>
              ))}
            </div>
            {form.brokerage === 'custom' && (
              <input
                type="text"
                value={form.brokerageCustom}
                onChange={(e) => dispatch(updateForm({ brokerageCustom: e.target.value }))}
                placeholder="e.g., 45 days rent"
                className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Step9Photos({ form, dispatch, mediaFiles, setMediaFiles, onSubmit, loading, error }: any) {
  const imageRef = useRef<HTMLInputElement>(null);
  const imageCount = mediaFiles.filter((m: MediaFile) => m.type === 'image').length;
  const canSubmit = imageCount >= 3;

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 11 - imageCount;
    setMediaFiles((prev: MediaFile[]) => [
      ...prev,
      ...files.slice(0, remaining).map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
        type: 'image' as const,
      })),
    ]);
    e.target.value = '';
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev: MediaFile[]) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_: any, i: number) => i !== idx);
    });
  };

  const title = form.autoTitle || generatePropertyTitle({
    category: form.mainCategory, listingType: form.listingType || 'rent',
    propertyType: form.propertyType, bedrooms: form.bedrooms, city: form.city, locality: form.locality,
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Photos &amp; Preview</h2>
      <p className="text-gray-500 text-sm mb-4">Add minimum 3 photos. More photos = more inquiries!</p>

      {/* Photo upload */}
      <input type="file" ref={imageRef} multiple accept="image/*" className="hidden" onChange={handleImages} />

      <div className="grid grid-cols-3 gap-2 mb-3">
        {mediaFiles.map((m: MediaFile, i: number) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={m.preview} alt="" className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded font-medium">Cover</span>}
            <button
              onClick={() => removeMedia(i)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
            >×</button>
          </div>
        ))}
        {imageCount < 11 && (
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-all"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-xs font-medium">Add Photo</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className={cn('flex items-center gap-1 text-xs font-medium', imageCount >= 3 ? 'text-green-600' : 'text-gray-400')}>
          {imageCount >= 3 ? <CheckCircle2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          {imageCount}/3 photos required
        </div>
        {imageCount < 3 && <span className="text-xs text-orange-500">(need {3 - imageCount} more)</span>}
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 text-gray-600 text-sm font-semibold mb-3">
          <Eye className="w-4 h-4" /> Listing Preview
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {[form.locality, form.city, form.state].filter(Boolean).join(', ')}
          </p>
          <div className="flex gap-3 mt-2 flex-wrap text-xs text-gray-500">
            {form.bedrooms && <span>{form.bedrooms} BHK</span>}
            {form.area && <span>{form.area} {form.areaUnit}</span>}
            {form.furnishingStatus && <span className="capitalize">{form.furnishingStatus.replace('_',' ')}</span>}
          </div>
          {form.price && (
            <p className="text-lg font-bold text-primary-700 mt-2">
              ₹{Number(form.price).toLocaleString('en-IN')}{form.listingType === 'rent' ? '/mo' : ''}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-xl p-3">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !canSubmit}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-lg shadow-primary-600/30"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : '🎉 Post Property'}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  const { currentStep, form } = useAppSelector(s => s.postProperty);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TOTAL_STEPS = 10;
  // Agents skip Step 0 — they're always listing as agent
  const isLoggedInAgent = user?.role === 'agent' || user?.role === 'seller';

  // Auto-configure for logged-in agents: skip step 0, set userType once
  useEffect(() => {
    if (!user) return;
    if (isLoggedInAgent) {
      dispatch(updateForm({ userType: 'agent', agencyName: user.company || '' }));
      // Jump past step 0 if we're still on it
      if (currentStep === 0) dispatch(setStep(1));
    } else {
      // Pre-select userType from session (guest flow)
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem('postPropertyUserType') : '';
      if (saved && !form.userType) {
        dispatch(updateForm({ userType: saved as any }));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/post-property/guest');
    }
  }, [user, authLoading, router]);

  // Validation per step
  const canProceed = () => {
    switch(currentStep) {
      case 0: return form.userType === 'owner' || (form.userType === 'agent' && !!form.agencyName?.trim());
      case 1: return !!form.mainCategory;
      case 2: return !!form.listingType || form.mainCategory === 'pg';
      case 3: return !!form.propertyType;
      case 4: return !!form.city && (form.userType === 'agent' || !!form.locality);
      case 5: return true;
      case 6: return !!form.area;
      case 7: return true;
      case 8: return !!form.price;
      case 9: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) { setError('Please complete the required fields before proceeding.'); return; }
    setError('');
    // Auto-set listingType for PG
    if (currentStep === 2 && form.mainCategory === 'pg') {
      dispatch(updateForm({ listingType: 'rent' }));
    }
    dispatch(nextStep());
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const effectiveTitle = form.autoTitle || generatePropertyTitle({
        category: form.mainCategory, listingType: form.listingType || 'rent',
        propertyType: form.propertyType, bedrooms: form.bedrooms,
        city: form.city, locality: form.locality,
      });

      // Map mainCategory + listingType to backend category
      const categoryMap: Record<string, string> = {
        residential: form.listingType === 'rent' ? 'rent' : 'buy',
        commercial: 'commercial',
        industrial: 'industrial',
        pg: 'pg',
        builder_project: 'builder_project',
        investment: form.listingType === 'rent' ? 'rent' : 'buy',
      };

      const payload: any = {
        title: effectiveTitle,
        description: form.description || effectiveTitle + '. Contact for details.',
        category: categoryMap[form.mainCategory] || form.mainCategory,
        type: form.propertyType,
        city: form.city,
        cityId: form.cityId || undefined,
        state: form.state,
        stateId: form.stateId || undefined,
        locality: form.locality || form.city,
        address: form.address || undefined,
        pincode: form.pincode || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        price: Number(form.price),
        priceUnit: form.priceUnit,
        area: form.area ? Number(form.area) : undefined,
        areaUnit: form.areaUnit,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        floorNumber: form.floor ? Number(form.floor) : undefined,
        furnishingStatus: form.furnishingStatus || undefined,
        possessionStatus: form.possessionStatus,
        listedBy: form.userType === 'agent' ? 'agent' : 'owner',
        builderName: form.userType === 'agent'
          ? (form.agencyName?.trim() || user?.company || undefined)
          : undefined,
        brokerage: form.brokerage === 'custom' ? form.brokerageCustom : form.brokerage || undefined,
        extraDetails: form.mainCategory === 'industrial' ? {
          height: form.industrialHeight,
          powerLoad: form.industrialPowerLoad,
          hasDock: form.hasDock,
          hasRamp: form.hasRamp,
        } : undefined,
      };

      const { data: property } = await propertiesApi.create(payload);

      const images = mediaFiles.filter(m => m.type === 'image');
      if (images.length > 0) {
        const fd = new FormData();
        images.forEach(m => fd.append('images', m.file));
        await propertiesApi.uploadImages(property.id, fd);
      }

      dispatch(resetForm());
      router.push(`/properties/${property.slug}?posted=1`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const stepProps = { form, dispatch };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step0UserType {...stepProps} />;
      case 1: return <Step1MainCategory {...stepProps} />;
      case 2: return <Step2ListingType {...stepProps} />;
      case 3: return <Step3PropertyType {...stepProps} />;
      case 4: return <Step4Location {...stepProps} />;
      case 5: return <Step5AutoTitle {...stepProps} />;
      case 6: return <Step6Details {...stepProps} />;
      case 7: return <Step7Description {...stepProps} />;
      case 8: return <Step8Price {...stepProps} />;
      case 9: return <Step9Photos {...stepProps} mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} onSubmit={handleSubmit} loading={loading} error={error} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Post Your Property</h1>
          {isLoggedInAgent ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">🏢 Agent Listing</span>
              {user?.company && <span className="text-xs text-gray-500">{user.company}</span>}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-0.5">Free listing for owners · Agents list via agency</p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <StepIndicator
            current={isLoggedInAgent ? currentStep - 1 : currentStep}
            total={isLoggedInAgent ? TOTAL_STEPS - 1 : TOTAL_STEPS}
          />
        </div>

        {/* Step card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          {error && currentStep < 9 && (
            <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-2.5 text-sm">{error}</div>
          )}
          {renderStep()}
        </div>

        {/* Navigation - not shown on last step (has its own submit button) */}
        {currentStep < 9 && (
          <div className="flex items-center gap-3">
            {/* Back: agents skip step 0 so hide back on step 1 */}
            {currentStep > 0 && !(isLoggedInAgent && currentStep === 1) && (
              <button
                type="button"
                onClick={() => dispatch(prevStep())}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-primary-600/25"
            >
              {currentStep === 8 ? 'Next: Add Photos' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back button on last step */}
        {currentStep === 9 && (
          <button
            type="button"
            onClick={() => dispatch(prevStep())}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Go back to edit
          </button>
        )}
      </div>
    </div>
  );
}
