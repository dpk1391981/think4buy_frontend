'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Send, CheckCircle, Phone, Mail, User, MapPin, MapPinned,
  IndianRupee, ChevronDown, HelpCircle, ChevronUp,
  Home, Sparkles, Star, Shield, Users, Building2,
  BadgeCheck, TrendingUp, Clock, Gem,
  MessageCircle, Search, Award, X, Loader2,
} from 'lucide-react';
import { leadsApi, locationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_FOR = ['Buy', 'Rent', 'PG'] as const;

const PROPERTY_TYPES = [
  { label: 'Residential',  value: 'residential', icon: '🏠', desc: 'Apartments, villas, houses' },
  { label: 'Commercial',   value: 'commercial',  icon: '🏢', desc: 'Offices, shops, showrooms'  },
  { label: 'Plot / Land',  value: 'plot',        icon: '🗺️', desc: 'Open plots and land parcels' },
  { label: 'Rental / PG',  value: 'rental',      icon: '🔑', desc: 'Rentals, PG, co-living'     },
] as const;

const AREA_UNITS = ['Sq. Ft.', 'Sq. Yd.', 'Sq. Mt.', 'Acres', 'Bigha'] as const;

const BUDGET_OPTS = [
  { label: '₹5 L',    value: 500_000    },
  { label: '₹10 L',   value: 1_000_000  },
  { label: '₹20 L',   value: 2_000_000  },
  { label: '₹30 L',   value: 3_000_000  },
  { label: '₹50 L',   value: 5_000_000  },
  { label: '₹75 L',   value: 7_500_000  },
  { label: '₹1 Cr',   value: 10_000_000 },
  { label: '₹1.5 Cr', value: 15_000_000 },
  { label: '₹2 Cr',   value: 20_000_000 },
  { label: '₹3 Cr',   value: 30_000_000 },
  { label: '₹5 Cr',   value: 50_000_000 },
  { label: '₹5 Cr+',  value: 99_999_999 },
];

const HOW_STEPS = [
  {
    icon:  <Send className="w-5 h-5 text-white" />,
    color: 'from-blue-500 to-blue-600',
    title: 'Share Your Requirement',
    desc:  'Fill in your property preference — type, budget, location, and contact details.',
  },
  {
    icon:  <Users className="w-5 h-5 text-white" />,
    color: 'from-violet-500 to-violet-600',
    title: 'We Match Expert Agents',
    desc:  'Our system routes your requirement to verified local agents who specialize in your area.',
  },
  {
    icon:  <MessageCircle className="w-5 h-5 text-white" />,
    color: 'from-emerald-500 to-emerald-600',
    title: 'Connect & Close Deals',
    desc:  'Agents reach out directly. Compare options, visit sites, and close the best deal.',
  },
];

const TRUST_STATS = [
  { icon: <Home className="w-4 h-4" />,       label: '50,000+', sub: 'Active Listings'   },
  { icon: <Users className="w-4 h-4" />,      label: '10,000+', sub: 'Verified Agents'   },
  { icon: <MapPin className="w-4 h-4" />,     label: '50+',     sub: 'Cities Covered'    },
  { icon: <BadgeCheck className="w-4 h-4" />, label: '98%',     sub: 'Satisfaction Rate' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Noida',     rating: 5, text: 'Found my dream 3BHK within 2 weeks. The agents were super responsive!',             role: 'Home Buyer' },
  { name: 'Rajesh Kumar', city: 'Bengaluru', rating: 5, text: 'Best platform for property search. Got multiple options within my budget in 3 days.', role: 'Investor'   },
  { name: 'Anita Verma',  city: 'Mumbai',    rating: 4, text: 'The agent knew the locality perfectly. Highly recommended!',                          role: 'Tenant'     },
];

// ─── Helper components ────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= count ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SectionHeader({ num, color, label, children }: { num: number; color: string; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className={`w-7 h-7 rounded-full ${color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>{num}</span>
      <h3 className="text-sm font-bold text-gray-800">{label}</h3>
      <div className="flex-1 h-px bg-gray-100" />
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FindPropertyClient() {
  const { user } = useAuth();

  // ── Core form ──
  const [propertyFor,  setPropertyFor]  = useState<'Buy'|'Rent'|'PG'>('Buy');
  const [propertyType, setPropertyType] = useState('');
  const [budgetMin,    setBudgetMin]    = useState('');
  const [budgetMax,    setBudgetMax]    = useState('');
  const [areaUnit,     setAreaUnit]     = useState('');
  const [areaMin,      setAreaMin]      = useState('');
  const [areaMax,      setAreaMax]      = useState('');
  const [iAm,          setIAm]          = useState<'buyer'|'owner'|'agent'>('buyer');
  const [name,         setName]         = useState('');
  const [mobile,       setMobile]       = useState('');
  const [email,        setEmail]        = useState('');
  const [howOpen,      setHowOpen]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState('');

  // ── Location state ──
  const [citySearch,          setCitySearch]          = useState('');
  const [cityResults,         setCityResults]         = useState<any[]>([]);
  const [showCityDrop,        setShowCityDrop]        = useState(false);
  const [cityName,            setCityName]            = useState('');
  const [stateName,           setStateName]           = useState('');
  const [systemLocalities,    setSystemLocalities]    = useState<any[]>([]);
  const [selectedLocalityIds, setSelectedLocalityIds] = useState<string[]>([]);
  const [loadingLoc,          setLoadingLoc]          = useState(false);
  const [showMoreLoc,         setShowMoreLoc]         = useState(false);

  const cityDropRef = useRef<HTMLDivElement>(null);

  // ── Pre-fill from auth ──
  useEffect(() => {
    if (user) {
      if (user.name)  setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setMobile((user.phone || '').replace(/[^0-9]/g, '').slice(0, 10));
    }
  }, [user]);

  // ── Click-outside closes city dropdown ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (cityDropRef.current && !cityDropRef.current.contains(e.target as Node))
        setShowCityDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Debounced city search ──
  useEffect(() => {
    if (citySearch.length < 2) { setCityResults([]); setShowCityDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await locationsApi.search(citySearch);
        const data: any[] = r.data || [];
        setCityResults(data);
        if (data.length > 0) setShowCityDrop(true);
      } catch {
        setCityResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [citySearch]);

  // ── Select a city/locality from dropdown ──
  const handleSelectLocation = useCallback(async (loc: any) => {
    const newCity  = loc.city;
    const newState = loc.state;
    setCityName(newCity);
    setStateName(newState);
    setCitySearch(loc.locality ? `${loc.locality}, ${loc.city}` : loc.city);
    setShowCityDrop(false);
    setShowMoreLoc(false);
    setSelectedLocalityIds(loc.locality ? [loc.id] : []);

    setLoadingLoc(true);
    try {
      const r = await locationsApi.getLocalitiesByCity(newCity, newState);
      setSystemLocalities((r.data || []).filter((l: any) => l.locality));
    } catch {
      setSystemLocalities([]);
    } finally {
      setLoadingLoc(false);
    }
  }, []);

  const toggleLocality = useCallback((id: string) => {
    setSelectedLocalityIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const clearCity = () => {
    setCitySearch(''); setCityName(''); setStateName('');
    setSystemLocalities([]); setSelectedLocalityIds([]);
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const locationValue = cityName || citySearch.trim();
    if (!propertyType)                 { setError('Please select a property type.');                         return; }
    if (!locationValue)                { setError('Please enter your city or preferred location.');          return; }
    if (!name.trim())                  { setError('Please enter your name.');                                return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError('Enter a valid 10-digit Indian mobile number (6–9 start).'); return; }
    if (email && !email.includes('@')) { setError('Enter a valid email address.');                           return; }

    const selectedLocs  = systemLocalities.filter(l => selectedLocalityIds.includes(l.id));
    const primaryLoc    = selectedLocs[0];

    setSubmitting(true);
    try {
      await leadsApi.capturePublic({
        source:              'find_property',
        contactName:         name.trim(),
        contactPhone:        mobile.trim(),
        contactEmail:        email.trim() || undefined,
        propertyFor:         propertyFor.toLowerCase(),
        propertyType,
        budgetMin:           budgetMin ? Number(budgetMin) : undefined,
        budgetMax:           budgetMax ? Number(budgetMax) : undefined,
        areaMin:             areaMin   ? Number(areaMin)   : undefined,
        areaMax:             areaMax   ? Number(areaMax)   : undefined,
        areaUnit:            areaUnit  || undefined,
        city:                cityName  || citySearch.trim(),
        state:               stateName || undefined,
        locality:            primaryLoc?.locality || undefined,
        localityId:          primaryLoc?.id        || undefined,
        preferredLocalities: selectedLocs.length > 0
          ? JSON.stringify(selectedLocs.map((l: any) => l.locality))
          : undefined,
        userType:            iAm,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── City dropdown data ──
  const cityMap = new Map<string, any>();
  const locItems: any[] = [];
  cityResults.forEach(r => {
    if (!cityMap.has(r.city)) cityMap.set(r.city, r);
    if (r.locality) locItems.push(r);
  });
  const cityDropCities    = Array.from(cityMap.values()).slice(0, 5);
  const cityDropLocalities = locItems.slice(0, 5);

  const visibleLocalities = showMoreLoc ? systemLocalities : systemLocalities.slice(0, 12);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-700 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/30">
            <Sparkles className="w-3.5 h-3.5" />Free Property Matching Service
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
            Find Your <span className="text-amber-300">Dream Property</span> in India
          </h1>
          <p className="text-primary-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Share your requirement once — our verified agents across 50+ cities will connect you with the best matched properties.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6">
            {TRUST_STATS.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-white/90">
                <span className="text-primary-200">{s.icon}</span>
                <span className="text-sm font-bold">{s.label}</span>
                <span className="text-xs text-primary-200">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two-column layout ── */}
      <section className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

          {/* ══ LEFT: Form ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

              {/* Form header */}
              <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Tell Us Your Property Requirement</h2>
                    <p className="text-primary-200 text-xs mt-0.5">Get matched with verified agents — 100% free service</p>
                  </div>
                </div>
              </div>

              {submitted ? (
                /* ── Success ── */
                <div className="p-10 text-center flex flex-col items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Requirement Submitted!</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      Our team and verified agents will reach out to you shortly with the best matching properties. Keep your phone handy!
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center mt-2">
                    <Link href="/properties" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                      <Home className="w-4 h-4" />Browse Properties
                    </Link>
                    <Link href="/agents" className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                      <Users className="w-4 h-4" />Browse Agents
                    </Link>
                  </div>
                </div>
              ) : (

                <form onSubmit={handleSubmit} className="p-6 space-y-7">

                  {/* ════ SECTION 1: Property Requirement ════ */}
                  <div>
                    <SectionHeader num={1} color="bg-primary-600" label="Property Requirement" />

                    {/* Looking To */}
                    <div className="mb-5">
                      <FieldLabel text="Looking To" required />
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        {PROPERTY_FOR.map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setPropertyFor(opt)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                              propertyFor === opt
                                ? 'bg-white text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Property Type */}
                    <div className="mb-5">
                      <FieldLabel text="Property Type" required />
                      <div className="grid grid-cols-2 gap-2">
                        {PROPERTY_TYPES.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setPropertyType(t.value)}
                            className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                              propertyType === t.value
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-lg mb-0.5">{t.icon}</div>
                            <div className="text-xs font-bold">{t.label}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="mb-5">
                      <FieldLabel text="Budget Range" />
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Min Budget', val: budgetMin, set: setBudgetMin },
                          { label: 'Max Budget', val: budgetMax, set: setBudgetMax },
                        ].map(({ label, val, set }) => (
                          <div key={label} className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                              value={val}
                              onChange={e => set(e.target.value)}
                              className="w-full border border-gray-200 rounded-xl pl-8 pr-9 py-2.5 text-sm appearance-none bg-white focus:ring-2 focus:ring-primary-300 focus:outline-none text-gray-700"
                            >
                              <option value="">{label}</option>
                              {BUDGET_OPTS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Built-up Area */}
                    <div className="mb-5">
                      <FieldLabel text="Built Up Area" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                          <select
                            value={areaUnit}
                            onChange={e => setAreaUnit(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none bg-white focus:ring-2 focus:ring-primary-300 focus:outline-none pr-7 text-gray-700"
                          >
                            <option value="">Unit</option>
                            {AREA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                        <input
                          type="number" placeholder="Min" value={areaMin} min={0}
                          onChange={e => setAreaMin(e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary-300 focus:outline-none"
                        />
                        <input
                          type="number" placeholder="Max" value={areaMax} min={0}
                          onChange={e => setAreaMax(e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* City + Locality */}
                    <div>
                      <FieldLabel text="Preferred City & Locality" required />

                      {/* City search input with autocomplete */}
                      <div className="relative" ref={cityDropRef}>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 z-10 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Type city name (e.g. Noida, Bengaluru…)"
                            value={citySearch}
                            onChange={e => {
                              setCitySearch(e.target.value);
                              if (cityName) { setCityName(''); setStateName(''); setSystemLocalities([]); setSelectedLocalityIds([]); }
                            }}
                            onFocus={() => { if (cityResults.length > 0) setShowCityDrop(true); }}
                            className={`w-full border rounded-xl pl-10 pr-10 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-300 focus:outline-none transition-colors ${
                              cityName ? 'border-primary-400 bg-primary-50/40 text-gray-800' : 'border-gray-200 text-gray-700'
                            }`}
                          />
                          {citySearch && (
                            <button type="button" onClick={clearCity} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown */}
                        {showCityDrop && (cityDropCities.length > 0 || cityDropLocalities.length > 0) && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                            {cityDropCities.length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                                  Cities
                                </div>
                                {cityDropCities.map((loc, i) => (
                                  <button
                                    key={`city-${i}`}
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); handleSelectLocation({ ...loc, locality: null }); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 transition-colors text-left"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                      <MapPin className="w-3.5 h-3.5 text-primary-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">{loc.city}</div>
                                      <div className="text-[11px] text-gray-400">{loc.state}</div>
                                    </div>
                                  </button>
                                ))}
                              </>
                            )}

                            {cityDropLocalities.length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-y border-gray-100">
                                  Localities
                                </div>
                                {cityDropLocalities.map((loc, i) => (
                                  <button
                                    key={`loc-${i}`}
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); handleSelectLocation(loc); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                      <MapPinned className="w-3.5 h-3.5 text-indigo-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">{loc.locality}</div>
                                      <div className="text-[11px] text-gray-400">{loc.city}, {loc.state}</div>
                                    </div>
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Loading localities */}
                      {loadingLoc && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                          Loading localities for <span className="font-semibold text-gray-700">{cityName}</span>…
                        </div>
                      )}

                      {/* Locality chips from system */}
                      {!loadingLoc && systemLocalities.length > 0 && (
                        <div className="mt-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                              Select Preferred Localities
                            </span>
                            {selectedLocalityIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedLocalityIds([])}
                                className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                              >
                                <X className="w-2.5 h-2.5" />Clear
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {visibleLocalities.map((loc: any) => (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => toggleLocality(loc.id)}
                                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                                  selectedLocalityIds.includes(loc.id)
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700'
                                }`}
                              >
                                {loc.locality}
                              </button>
                            ))}
                            {systemLocalities.length > 12 && (
                              <button
                                type="button"
                                onClick={() => setShowMoreLoc(v => !v)}
                                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-600 font-semibold"
                              >
                                {showMoreLoc ? '↑ Show less' : `+${systemLocalities.length - 12} more`}
                              </button>
                            )}
                          </div>
                          {selectedLocalityIds.length > 0 && (
                            <p className="text-[11px] text-primary-700 font-semibold mt-2.5">
                              ✓ {selectedLocalityIds.length} localit{selectedLocalityIds.length === 1 ? 'y' : 'ies'} selected
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fallback when no system localities */}
                      {!loadingLoc && cityName && systemLocalities.length === 0 && (
                        <p className="mt-2 text-xs text-gray-400 italic pl-1">
                          No localities in system for {cityName} — agents will cover the full city.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ════ SECTION 2: Contact Details ════ */}
                  <div>
                    <SectionHeader num={2} color="bg-indigo-600" label="Your Contact Details">
                      {user && (
                        <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />Pre-filled
                        </span>
                      )}
                    </SectionHeader>

                    {/* I Am */}
                    <div className="mb-4">
                      <FieldLabel text="I Am" required />
                      <div className="flex gap-2">
                        {(['buyer','owner','agent'] as const).map(role => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setIAm(role)}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                              iAm === role
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-700'
                            }`}
                          >
                            {role === 'buyer' ? '🏠 Buyer' : role === 'owner' ? '🏢 Owner' : '🤝 Agent'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="mb-3">
                      <FieldLabel text="Full Name" required />
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-primary-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="mb-3">
                      <FieldLabel text="Mobile Number" required />
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 flex-shrink-0">
                          <span className="text-base">🇮🇳</span>
                          <span className="text-xs font-bold text-gray-700">+91</span>
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={mobile}
                            onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            inputMode="numeric"
                            className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-primary-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <FieldLabel text="Email Address" />
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="your@email.com (optional)"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-primary-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <span className="flex-shrink-0 mt-0.5">⚠️</span>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-base transition-all disabled:opacity-60 shadow-lg shadow-primary-200"
                  >
                    {submitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Submitting Your Requirement…</>
                    ) : (
                      <><Send className="w-5 h-5" />Find My Dream Property</>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-gray-400 leading-relaxed">
                    By submitting, you agree to our{' '}
                    <Link href="/terms" className="underline">Terms</Link> &{' '}
                    <Link href="/privacy" className="underline">Privacy Policy</Link>.
                    Your data is encrypted and never shared without consent.
                  </p>

                  {/* How it works collapsible */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setHowOpen(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary-500" />How does it work?
                      </span>
                      {howOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {howOpen && (
                      <div className="px-4 py-5 space-y-4 bg-white">
                        {HOW_STEPS.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                              {step.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{step.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </form>
              )}
            </div>
          </div>

          {/* ══ RIGHT: SEO + Trust ══════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Why Think4BuySale */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-600" />
                </span>
                Why Think4BuySale?
              </h2>
              <ul className="space-y-3">
                {[
                  { icon: <BadgeCheck className="w-4 h-4 text-emerald-500" />, text: 'RERA Verified Agents across 50+ cities' },
                  { icon: <Gem        className="w-4 h-4 text-violet-500"  />, text: 'Diamond & Gold certified property dealers' },
                  { icon: <Clock      className="w-4 h-4 text-blue-500"   />, text: 'Connect with agents within 2 hours' },
                  { icon: <Shield     className="w-4 h-4 text-primary-500"/>, text: '100% free — no broker fees, no hidden charges' },
                  { icon: <TrendingUp className="w-4 h-4 text-amber-500"  />, text: 'Best price guarantee through our verified network' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* How it works (desktop always visible) */}
            <div className="hidden lg:block bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl border border-primary-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary-100 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-primary-600" />
                </span>
                How It Works
              </h2>
              <div className="space-y-4">
                {HOW_STEPS.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </span>
                Happy Customers
              </h2>
              <div className="space-y-4">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                    <Stars count={t.rating} />
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed italic">"{t.text}"</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{t.name}</p>
                        <p className="text-[10px] text-gray-400">{t.role} · {t.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Links</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Buy Properties',  href: '/buy',          icon: <Home      className="w-3.5 h-3.5" /> },
                  { label: 'Rent Properties', href: '/rent',         icon: <Building2 className="w-3.5 h-3.5" /> },
                  { label: 'Find Top Agents', href: '/agents',       icon: <Users     className="w-3.5 h-3.5" /> },
                  { label: 'Post Property',   href: '/post-property',icon: <Award     className="w-3.5 h-3.5" /> },
                ].map((l, i) => (
                  <Link
                    key={i}
                    href={l.href}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-primary-700 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 px-3 py-2.5 rounded-xl transition-all"
                  >
                    <span className="text-primary-500">{l.icon}</span>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SEO footer ── */}
      <section className="bg-white border-t border-gray-100 py-10 px-4 mt-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Find Properties Across India's Top Cities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {['Mumbai','Delhi NCR','Bengaluru','Hyderabad','Pune','Chennai','Noida','Gurugram','Kolkata','Ahmedabad','Jaipur','Lucknow'].map((city, i) => (
              <Link
                key={i}
                href={`/properties?city=${encodeURIComponent(city)}`}
                className="text-center px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 text-xs font-semibold text-gray-600 hover:text-primary-700 transition-all"
              >
                {city}
              </Link>
            ))}
          </div>
          <div className="mt-8 prose prose-sm max-w-none text-gray-500 leading-relaxed">
            <p>
              <strong className="text-gray-700">Think4BuySale</strong> is India's trusted real estate platform connecting property buyers,
              tenants, and investors with verified agents and property dealers. Whether you're looking for an apartment in Mumbai,
              a villa in Bengaluru, or a commercial space in Delhi NCR — our network of 10,000+ RERA-certified agents ensures
              you get the best property deals without paying any brokerage.
            </p>
            <p className="mt-3">
              Our free property matching service works in 3 simple steps: share your requirement, get matched with local agents,
              and close the best deal. From budget flats under ₹30 lakh to luxury villas above ₹5 crore,
              our platform covers all segments — residential, commercial, plots, and rental properties across 50+ Indian cities.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
