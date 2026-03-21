'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Home, Briefcase, ChevronRight, Loader2,
  CheckCircle2, Building2, Star, Shield, Zap, User, Plus, X, Camera, MapPin,
} from 'lucide-react';
import { authApi, agencyApi, locationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ─── Role definitions ───────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'buyer',
    label: 'Buyer / Renter',
    tagline: 'I\'m looking for a property',
    icon: Search,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    checkColor: 'text-blue-500',
    benefits: [
      'Browse thousands of verified listings',
      'Save & compare properties',
      'Get notified on price drops',
      'Connect directly with owners',
    ],
  },
  {
    id: 'owner',
    label: 'Property Owner',
    tagline: 'I want to sell or rent my property',
    icon: Home,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    checkColor: 'text-emerald-500',
    benefits: [
      'Post property listings for FREE',
      'Reach lakhs of genuine buyers',
      'Manage inquiries in one place',
      'Boost your listing with premium plans',
    ],
  },
  {
    id: 'agent',
    label: 'Real Estate Agent',
    tagline: 'I\'m a professional agent or broker',
    icon: Briefcase,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    activeBorder: 'border-violet-500',
    activeBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    checkColor: 'text-violet-500',
    benefits: [
      'List unlimited properties',
      'Get verified agent badge',
      'Lead management dashboard',
      'Priority placement in search',
    ],
  },
] as const;

type RoleId = 'buyer' | 'owner' | 'agent';

// ─── Inner form ─────────────────────────────────────────────────────────────

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refresh: refreshAuth, user, loading: authLoading } = useAuth();

  const roleParam = searchParams.get('role') as RoleId | null;
  // upgrade=1 means an existing buyer is upgrading their role (not a brand-new user)
  const isUpgrade = searchParams.get('upgrade') === '1';

  const [selectedRole, setSelectedRole] = useState<RoleId>(
    roleParam && ['buyer', 'owner', 'agent'].includes(roleParam) ? roleParam : 'buyer',
  );
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');

  // Pre-fill name for role upgrades (existing buyers)
  useEffect(() => {
    if (isUpgrade && user?.name && !firstName) {
      const parts = user.name.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const [agentLicense, setAgentLicense] = useState('');
  const [agentGstNumber, setAgentGstNumber] = useState('');
  const [agentExperience, setAgentExperience] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Profile image (optional, uploaded after onboarding completes)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Coverage — city auto-search based, no state required
  type CoverageEntry = {
    citySearch: string;
    citySuggestions: { id: string; name: string }[];
    showCitySuggestions: boolean;
    cityId: string; cityName: string;
    selectedLocalities: { id: string; name: string }[];
    localities: { id: string; name: string; locality?: string }[];
    localitiesLoading: boolean;
  };

  const [coverageEntries, setCoverageEntries] = useState<CoverageEntry[]>([
    { citySearch: '', citySuggestions: [], showCitySuggestions: false, cityId: '', cityName: '', selectedLocalities: [], localities: [], localitiesLoading: false },
  ]);

  // Per-entry debounce timers for city search
  const cityTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateEntry = (idx: number, patch: Partial<CoverageEntry>) => {
    setCoverageEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  };

  const handleCitySearch = (idx: number, value: string) => {
    updateEntry(idx, { citySearch: value, showCitySuggestions: true, cityId: '', cityName: '' });
    clearTimeout(cityTimers.current[idx]);
    if (!value.trim()) {
      updateEntry(idx, { citySuggestions: [], showCitySuggestions: false });
      return;
    }
    cityTimers.current[idx] = setTimeout(async () => {
      try {
        const r = await locationsApi.getCities(value, 20);
        const d = r.data?.data || r.data || [];
        updateEntry(idx, { citySuggestions: Array.isArray(d) ? d : [] });
      } catch {}
    }, 300);
  };

  const handleCitySelect = async (idx: number, city: { id: string; name: string }) => {
    updateEntry(idx, {
      cityId: city.id, cityName: city.name,
      citySearch: city.name,
      showCitySuggestions: false,
      selectedLocalities: [],
      localities: [],
      localitiesLoading: true,
    });
    try {
      const r = await locationsApi.getLocalities(city.name);
      const d = r.data;
      updateEntry(idx, { localities: Array.isArray(d) ? d : [], localitiesLoading: false });
    } catch {
      updateEntry(idx, { localitiesLoading: false });
    }
  };

  const toggleLocality = (idx: number, loc: { id: string; name: string }) => {
    setCoverageEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const exists = e.selectedLocalities.some(l => l.id === loc.id);
      return {
        ...e,
        selectedLocalities: exists
          ? e.selectedLocalities.filter(l => l.id !== loc.id)
          : [...e.selectedLocalities, loc],
      };
    }));
  };

  const addCoverageEntry = () => {
    setCoverageEntries(prev => [...prev, { citySearch: '', citySuggestions: [], showCitySuggestions: false, cityId: '', cityName: '', selectedLocalities: [], localities: [], localitiesLoading: false }]);
  };

  const removeCoverageEntry = (idx: number) => {
    setCoverageEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Profile image must be under 3 MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const redirect = searchParams.get('redirect') || '/';

  // If not authenticated, send to login
  if (!authLoading && !user) {
    router.replace(`/auth/login?redirect=${encodeURIComponent('/auth/onboarding' + (redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''))}`);
    return null;
  }

  // If onboarding already completed, redirect away — UNLESS this is a role upgrade
  if (!authLoading && user && user.needsOnboarding === false && user.name?.trim() && !isUpgrade) {
    router.replace(redirect);
    return null;
  }

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      return;
    }
    if (selectedRole === 'agent') {
      if (!agencyName.trim()) { setError('Business / Agency Name is required.'); return; }
      if (!contactPhone.trim()) { setError('Contact Phone is required.'); return; }
      if (!isUpgrade && !agentExperience) { setError('Years of Experience is required.'); return; }
      if (!isUpgrade && !businessAddress.trim()) { setError('Business Address is required.'); return; }
      const firstEntry = coverageEntries[0];
      if (!firstEntry.cityId) { setError('Please select at least one coverage City.'); return; }
    }
    setLoading(true);
    setError('');
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

      if (isUpgrade) {
        // Existing buyer upgrading role — use upgradeRole endpoint
        const { data } = await authApi.upgradeRole(selectedRole as 'owner' | 'agent');
        login(data.token || data.accessToken, data.user, data.menus);

        // Update name if it was changed
        if (fullName && fullName !== user?.name) {
          await authApi.updateProfile({ name: fullName }).catch(() => {});
        }

        // Upload avatar if selected
        if (avatarFile) {
          try { await authApi.uploadAvatar(avatarFile); } catch {}
        }

        // For agents: register agency and add coverage
        if (selectedRole === 'agent') {
          if (agencyName.trim()) {
            await agencyApi.selfRegisterOrJoin({
              agencyName: agencyName.trim(),
              contactPhone: contactPhone.trim() || undefined,
              address: businessAddress.trim() || undefined,
            }).catch(() => {});
          }
          for (const entry of coverageEntries) {
            if (!entry.cityId) continue;
            if (entry.selectedLocalities.length > 0) {
              for (const loc of entry.selectedLocalities) {
                await agencyApi.addMyLocation({
                  coverageType: 'locality',
                  cityId: entry.cityId, cityName: entry.cityName,
                  localityId: loc.id, localityName: loc.name,
                }).catch(() => {});
              }
            } else {
              await agencyApi.addMyLocation({
                coverageType: 'city',
                cityId: entry.cityId, cityName: entry.cityName,
              }).catch(() => {});
            }
          }
        }
      } else {
        // New user — standard onboarding flow
        const payload: any = { role: selectedRole, name: fullName };
        if (selectedRole === 'agent') {
          payload.agencyName      = agencyName.trim();
          payload.contactPhone    = contactPhone.trim();
          payload.agentExperience = Number(agentExperience);
          payload.businessAddress = businessAddress.trim();
          if (agentLicense.trim()) payload.agentLicense = agentLicense.trim();
          if (agentGstNumber.trim()) (payload as any).agentGstNumber = agentGstNumber.trim();
        }

        const { data } = await authApi.completeOnboarding(payload);
        login(data.token, data.user, data.menus);

        // Upload avatar if selected
        if (avatarFile) {
          try { await authApi.uploadAvatar(avatarFile); } catch {}
        }

        // Add coverage entries for agents
        if (selectedRole === 'agent') {
          for (const entry of coverageEntries) {
            if (!entry.cityId) continue;
            if (entry.selectedLocalities.length > 0) {
              for (const loc of entry.selectedLocalities) {
                await agencyApi.addMyLocation({
                  coverageType: 'locality',
                  cityId: entry.cityId, cityName: entry.cityName,
                  localityId: loc.id, localityName: loc.name,
                }).catch(() => {});
              }
            } else {
              await agencyApi.addMyLocation({
                coverageType: 'city',
                cityId: entry.cityId, cityName: entry.cityName,
              }).catch(() => {});
            }
          }
        }
      }

      // Re-fetch fresh profile for both paths
      await refreshAuth();

      if (redirect && redirect !== '/') {
        router.replace(redirect);
      } else {
        const dest =
          selectedRole === 'agent' ? '/agent' :
          selectedRole === 'owner' ? '/owner' :
          '/buyer';
        router.replace(dest);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDef = ROLES.find((r) => r.id === selectedRole)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">T4</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" />
              {isUpgrade ? 'Set up your listing account' : 'Almost there — one last step'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              {isUpgrade ? 'Complete your profile to post' : 'How are you using Think4BuySale?'}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
              {isUpgrade
                ? 'Tell us a bit about yourself so we can set up your listing account.'
                : 'Choose your role so we can personalise your experience and show you the right tools.'}
            </p>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* First Name — required */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); if (firstNameError) setFirstNameError(''); }}
                  placeholder="e.g. Rahul"
                  autoFocus
                  className={cn(
                    'w-full pl-9 pr-4 py-3 border rounded-2xl text-sm outline-none transition-all',
                    firstNameError
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  )}
                />
              </div>
              {firstNameError && <p className="text-red-500 text-xs mt-1">{firstNameError}</p>}
            </div>

            {/* Last Name — optional */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Last Name <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const active = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id as RoleId)}
                  className={cn(
                    'relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-200 group',
                    active
                      ? `${role.activeBorder} ${role.activeBg} shadow-lg scale-[1.02]`
                      : `${role.border} bg-white hover:shadow-md hover:scale-[1.01]`,
                  )}
                >
                  {/* Selected badge */}
                  {active && (
                    <span className={cn(
                      'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center',
                      role.checkColor,
                    )}>
                      <CheckCircle2 className="w-5 h-5 fill-current" />
                    </span>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all',
                    active
                      ? `bg-gradient-to-br ${role.gradient} shadow-md`
                      : role.bg,
                  )}>
                    <Icon className={cn('w-5 h-5', active ? 'text-white' : role.iconColor)} />
                  </div>

                  {/* Label */}
                  <p className="font-bold text-gray-900 text-sm leading-snug mb-0.5">{role.label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{role.tagline}</p>

                  {/* Benefits — show when active */}
                  {active && (
                    <ul className="mt-3 space-y-1.5 w-full">
                      {role.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <CheckCircle2 className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', role.checkColor)} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>

          {/* Agent extra fields */}
          {selectedRole === 'agent' && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5 space-y-3">
              <div className="flex items-center gap-2 text-violet-700 text-xs font-bold mb-1">
                <Star className="w-3.5 h-3.5" />
                Agent Profile
              </div>

              {/* Profile Photo */}
              <div className="flex items-center gap-4 pb-3 border-b border-violet-200">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-violet-300 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-violet-50 transition-colors">
                    <Camera className="w-3 h-3 text-violet-600" />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Profile Photo</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Upload a professional photo <span className="text-violet-500">(optional)</span></p>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                      className="text-[11px] text-red-500 hover:text-red-600 mt-0.5"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Business / Agency Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. PropElite Realty Pvt Ltd"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={agentExperience}
                    onChange={(e) => setAgentExperience(e.target.value)}
                    min="0"
                    max="60"
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    RERA / License Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={agentLicense}
                    onChange={(e) => setAgentLicense(e.target.value)}
                    placeholder="e.g. MH/RERA/A12345"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    GST Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={agentGstNumber}
                    onChange={(e) => setAgentGstNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AAPFU0939F1ZV"
                    maxLength={15}
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Business Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="e.g. 12, MG Road, Bangalore 560001"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>

                {/* Coverage Area */}
                <div className="sm:col-span-2">
                  <div className="border-t border-violet-200 pt-3 mt-1">
                    <p className="text-xs font-bold text-violet-700 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Coverage Areas <span className="text-red-500">*</span>
                    </p>
                    <div className="space-y-3">
                      {coverageEntries.map((entry, idx) => (
                        <div key={idx} className="border border-violet-100 rounded-xl p-3 bg-white relative">
                          {coverageEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCoverageEntry(idx)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <p className="text-[10px] font-semibold text-violet-600 mb-2">
                            {idx === 0 ? 'Primary Area' : `Area ${idx + 1}`}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* City auto-search */}
                            <div className="relative">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={entry.citySearch}
                                onChange={(e) => handleCitySearch(idx, e.target.value)}
                                onFocus={() => entry.citySuggestions.length > 0 && updateEntry(idx, { showCitySuggestions: true })}
                                placeholder="Type to search city..."
                                className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                              />
                              {entry.cityId && (
                                <CheckCircle2 className="absolute right-2.5 top-1/2 translate-y-1 w-3.5 h-3.5 text-violet-500" />
                              )}
                              {entry.showCitySuggestions && entry.citySuggestions.length > 0 && (
                                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {entry.citySuggestions.map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onMouseDown={() => handleCitySelect(idx, c)}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 transition-colors"
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Localities */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Localities <span className="text-gray-400 font-normal">(optional)</span>
                              </label>
                              {!entry.cityId ? (
                                <div className="w-full px-3 py-2 border border-violet-100 rounded-lg text-xs text-gray-400 bg-gray-50">
                                  Select city first
                                </div>
                              ) : entry.localitiesLoading ? (
                                <div className="w-full px-3 py-2 border border-violet-100 rounded-lg text-xs text-gray-400 bg-gray-50 flex items-center gap-1.5">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                                </div>
                              ) : entry.localities.length === 0 ? (
                                <div className="w-full px-3 py-2 border border-violet-100 rounded-lg text-xs text-gray-400 bg-gray-50">
                                  No localities available
                                </div>
                              ) : (
                                <>
                                  <div className="border border-violet-200 rounded-lg max-h-36 overflow-y-auto bg-white">
                                    {entry.localities.map((l) => {
                                      const displayName = l.locality || l.name;
                                      const checked = entry.selectedLocalities.some(s => s.id === l.id);
                                      return (
                                        <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-violet-50 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleLocality(idx, { id: l.id, name: displayName })}
                                            className="accent-violet-600"
                                          />
                                          <span className="text-xs text-gray-700">{displayName}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  {entry.selectedLocalities.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {entry.selectedLocalities.map(l => (
                                        <span key={l.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px] font-medium">
                                          {l.name}
                                          <button type="button" onClick={() => toggleLocality(idx, l)} className="hover:text-violet-900">×</button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addCoverageEntry}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add more city / locality
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400 mb-5">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> 10L+ listings</span>
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Verified platform</span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
              selectedDef.id === 'agent'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-violet-500/25'
                : selectedDef.id === 'owner'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25',
            )}
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account…</>
              : isUpgrade
                ? <>Start Posting as {selectedDef.label} <ChevronRight className="w-5 h-5" /></>
                : <>Continue as {selectedDef.label} <ChevronRight className="w-5 h-5" /></>
            }
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            You can always change your role later from Profile Settings.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
