'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Home, Briefcase, ChevronRight, ChevronLeft, Loader2,
  CheckCircle2, Building2, Star, Shield, Zap, User, Plus, X, Camera,
  MapPin, Phone, Globe, Clock, Award, TrendingUp, Users, BadgeCheck,
  IndianRupee, BedDouble, AlertCircle, Sparkles,
} from 'lucide-react';
import { authApi, agencyApi, locationsApi, propertyConfigApi, leadsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { updateForm as updatePostPropertyForm } from '@/lib/store/slices/postPropertySlice';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'buyer' as const,
    label: 'Buyer / Renter',
    tagline: "I'm looking for a property",
    icon: Search,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    checkColor: 'text-blue-500',
    cta: 'Start Exploring',
    ctaGradient: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25',
    benefits: [
      'Browse thousands of verified listings',
      'Save & compare properties',
      'Get notified on price drops',
      'Connect directly with owners',
    ],
    steps: 2,
  },
  {
    id: 'owner' as const,
    label: 'Property Owner',
    tagline: "I want to sell or rent my property",
    icon: Home,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    checkColor: 'text-emerald-500',
    cta: 'Post Property & Go Live',
    ctaGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25',
    benefits: [
      'Post property listings for FREE',
      'Reach lakhs of genuine buyers',
      'Manage inquiries in one place',
      'Boost your listing with premium plans',
    ],
    steps: 4,
  },
  {
    id: 'agent' as const,
    label: 'Real Estate Agent',
    tagline: "I'm a professional agent or broker",
    icon: Briefcase,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    activeBorder: 'border-violet-500',
    activeBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    checkColor: 'text-violet-500',
    cta: 'Start Getting Leads',
    ctaGradient: 'from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/25',
    benefits: [
      'Get 10× more qualified leads',
      'RERA-verified badge builds trust',
      'Lead management dashboard',
      'Priority placement in search results',
    ],
    steps: 4,
  },
] as const;

type RoleId = 'buyer' | 'owner' | 'agent';

const BUDGET_RANGES = [
  { label: 'Under ₹30L',    min: 0,         max: 3000000  },
  { label: '₹30L – ₹60L',  min: 3000000,   max: 6000000  },
  { label: '₹60L – ₹1Cr',  min: 6000000,   max: 10000000 },
  { label: '₹1Cr – ₹2Cr',  min: 10000000,  max: 20000000 },
  { label: '₹2Cr – ₹5Cr',  min: 20000000,  max: 50000000 },
  { label: 'Above ₹5Cr',   min: 50000000,  max: 0        },
];

const PROPERTY_TYPES = [
  { label: 'Apartment',  value: 'apartment' },
  { label: 'Villa',      value: 'villa'     },
  { label: 'Plot',       value: 'plot'      },
  { label: 'Office',     value: 'office'    },
  { label: 'Shop',       value: 'shop'      },
  { label: 'Warehouse',  value: 'warehouse' },
];

const SPECIALIZATIONS = [
  'Residential', 'Commercial', 'Plots / Land', 'Luxury', 'Affordable',
  'Industrial', 'Retail', 'Co-working', 'NRI',
];

const LANGUAGES = [
  'Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Kannada',
  'Bengali', 'Gujarati', 'Punjabi', 'Malayalam',
];

const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BUSINESS_TYPES = [
  { label: 'Individual / Freelancer', value: 'individual' },
  { label: 'Partnership Firm',        value: 'partnership' },
  { label: 'LLP',                     value: 'llp'         },
  { label: 'Private Limited',         value: 'pvt_ltd'     },
  { label: 'Public Limited',          value: 'pub_ltd'     },
];

// ─── Helper: step labels per role ────────────────────────────────────────────

function getStepLabels(role: RoleId) {
  if (role === 'buyer')  return ['Your Profile', 'Preferences'];
  if (role === 'owner')  return ['Your Profile', 'Property', 'Location', 'Pricing'];
  return ['Your Profile', 'Basic Info', 'Company Details', 'Coverage'];
}

// ─── Progress Stepper ────────────────────────────────────────────────────────

function Stepper({ role, step }: { role: RoleId; step: number }) {
  const labels = getStepLabels(role);
  const def = ROLES.find(r => r.id === role)!;
  return (
    <div className="flex items-center justify-center gap-0 mb-8 px-2">
      {labels.map((label, i) => {
        const idx = i + 1;
        const done    = idx < step;
        const current = idx === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                done    ? `bg-gradient-to-br ${def.gradient} border-transparent text-white shadow-sm` :
                current ? `border-current ${def.iconColor} bg-white` :
                'border-gray-200 text-gray-400 bg-white',
              )}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
              </div>
              <span className={cn(
                'text-[10px] mt-1 font-medium hidden sm:block',
                current ? def.iconColor : done ? 'text-gray-600' : 'text-gray-400',
              )}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn(
                'h-0.5 w-8 sm:w-12 mx-1 mt-[-12px] sm:mt-[-14px] rounded transition-all',
                done ? `bg-gradient-to-r ${def.gradient}` : 'bg-gray-200',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Coverage entry type ──────────────────────────────────────────────────────

type CoverageEntry = {
  citySearch: string;
  citySuggestions: { id: string; name: string }[];
  showCitySuggestions: boolean;
  cityId: string;
  cityName: string;
  selectedLocalities: { id: string; name: string }[];
  localities: { id: string; name: string; locality?: string }[];
  localitiesLoading: boolean;
};

// ─── Main form ────────────────────────────────────────────────────────────────

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, refresh: refreshAuth, user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();

  const roleParam = searchParams.get('role') as RoleId | null;
  const isUpgrade = searchParams.get('upgrade') === '1';
  const redirect  = searchParams.get('redirect') || '/';

  const VALID_ROLES: RoleId[] = ['buyer', 'owner', 'agent'];

  // ── Role & step state ──────────────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState<RoleId>(
    roleParam && VALID_ROLES.includes(roleParam) ? roleParam : 'buyer'
  );
  const [step, setStep] = useState(1);

  const roleDef   = ROLES.find(r => r.id === selectedRole)!;
  const totalSteps = roleDef.steps;
  const stepLabels = getStepLabels(selectedRole);

  // Restore role from sessionStorage on mount
  useEffect(() => {
    if (!roleParam) {
      const stored = sessionStorage.getItem('t4bs_onboarding_role') as RoleId | null;
      if (stored && VALID_ROLES.includes(stored)) setSelectedRole(stored);
    }
  }, []); // eslint-disable-line

  // Persist role to sessionStorage
  useEffect(() => {
    if (roleParam && VALID_ROLES.includes(roleParam)) {
      sessionStorage.setItem('t4bs_onboarding_role', roleParam);
    }
  }, [roleParam]);

  // Reset step when role changes
  useEffect(() => { setStep(1); }, [selectedRole]);

  // ── Step 1: name ───────────────────────────────────────────────────────────
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]        = useState('');
  const [firstNameError, setFirstNameError]  = useState('');

  // Pre-fill name for upgrades
  useEffect(() => {
    if ((isUpgrade || !!sessionStorage.getItem('t4bs_onboarding_role')) && user?.name && !firstName) {
      const parts = user.name.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [user]); // eslint-disable-line

  // Avatar
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Buyer preferences ──────────────────────────────────────────────────────
  const [buyerCitySearch,       setBuyerCitySearch]       = useState('');
  const [buyerCitySuggestions,  setBuyerCitySuggestions]  = useState<{ id: string; name: string }[]>([]);
  const [showBuyerCitySuggest,  setShowBuyerCitySuggest]  = useState(false);
  const [buyerCityId,           setBuyerCityId]           = useState('');
  const [buyerCityName,         setBuyerCityName]         = useState('');
  const [buyerBudgetRange,      setBuyerBudgetRange]       = useState<typeof BUDGET_RANGES[number] | null>(null);
  const [buyerPropertyTypes,    setBuyerPropertyTypes]    = useState<string[]>([]);
  const [buyerPurpose,          setBuyerPurpose]          = useState<'buy' | 'rent'>('buy');
  const buyerCityTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Owner intent ───────────────────────────────────────────────────────────
  const [ownerPropertyType,   setOwnerPropertyType]   = useState('');
  const [ownerListingType,    setOwnerListingType]     = useState<'sale' | 'rent'>('sale');
  const [ownerCitySearch,     setOwnerCitySearch]      = useState('');
  const [ownerCitySuggestions,setOwnerCitySuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showOwnerCitySuggest,setShowOwnerCitySuggest] = useState(false);
  const [ownerCityId,         setOwnerCityId]          = useState('');
  const [ownerCityName,       setOwnerCityName]        = useState('');
  const [ownerLocalities,     setOwnerLocalities]      = useState<{ id: string; name: string; locality?: string }[]>([]);
  const [ownerLocalityId,     setOwnerLocalityId]      = useState('');
  const [ownerLocalityName,   setOwnerLocalityName]    = useState('');
  const [ownerLocalitiesLoading, setOwnerLocalitiesLoading] = useState(false);
  const [ownerPriceMin,       setOwnerPriceMin]        = useState('');
  const [ownerPriceMax,       setOwnerPriceMax]        = useState('');
  const [ownerArea,           setOwnerArea]            = useState('');
  const ownerCityTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Agent Step 2: basic ────────────────────────────────────────────────────
  const [agencyName,      setAgencyName]      = useState('');
  const [contactPhone,    setContactPhone]    = useState('');
  const [agentExperience, setAgentExperience] = useState('');
  const [agentCitySearch, setAgentCitySearch] = useState('');
  const [agentCitySugs,   setAgentCitySugs]   = useState<{ id: string; name: string }[]>([]);
  const [showAgentCitySug,setShowAgentCitySug]= useState(false);
  const [agentCityId,     setAgentCityId]     = useState('');
  const [agentCityName,   setAgentCityName]   = useState('');
  const agentCityTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Agent Step 3: company ─────────────────────────────────────────────────
  const [agentLicense,        setAgentLicense]        = useState('');
  const [agentGstNumber,       setAgentGstNumber]      = useState('');
  const [agentPan,             setAgentPan]            = useState('');
  const [businessType,         setBusinessType]        = useState('individual');
  const [businessAddress,      setBusinessAddress]     = useState('');
  const [agentWebsite,         setAgentWebsite]        = useState('');
  const [officeStartTime,      setOfficeStartTime]     = useState('09:00');
  const [officeEndTime,        setOfficeEndTime]       = useState('19:00');
  const [selectedWorkingDays,  setSelectedWorkingDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri','Sat']);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedLanguages,    setSelectedLanguages]   = useState<string[]>(['English', 'Hindi']);

  // ── Agent Step 4: coverage ────────────────────────────────────────────────
  const [coverageEntries, setCoverageEntries] = useState<CoverageEntry[]>([
    { citySearch:'', citySuggestions:[], showCitySuggestions:false, cityId:'', cityName:'', selectedLocalities:[], localities:[], localitiesLoading:false },
  ]);
  const cityTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // ── Shared ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Dynamic property types from DB ────────────────────────────────────────
  const [dbPropTypes, setDbPropTypes] = useState<{ label: string; value: string; icon?: string }[]>([]);
  useEffect(() => {
    propertyConfigApi.getCategories()
      .then(r => {
        const cats: any[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setDbPropTypes(
          cats.map(c => ({ label: c.name, value: c.slug, icon: c.icon }))
        );
      })
      .catch(() => {
        // fallback to sensible defaults if API unavailable
        setDbPropTypes([
          { label: 'Apartment', value: 'apartment' },
          { label: 'Villa',     value: 'villa'     },
          { label: 'Plot',      value: 'plot'      },
          { label: 'Office',    value: 'office'    },
          { label: 'Shop',      value: 'shop'      },
        ]);
      });
  }, []);

  // ── updateEntry must live before any early returns (it's a useCallback — a hook) ──
  const updateEntry = useCallback((idx: number, patch: Partial<CoverageEntry>) => {
    setCoverageEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  }, []);

  // ── Guards (all hooks are declared above — early returns are safe here) ───
  const hasGuestRoleKey = typeof window !== 'undefined' && !!sessionStorage.getItem('t4bs_onboarding_role');
  const effectiveUpgrade = isUpgrade || (hasGuestRoleKey && user?.needsOnboarding === false && !!user?.name?.trim());

  if (!authLoading && !user) {
    router.replace(`/auth?redirect=${encodeURIComponent('/auth/onboarding' + (redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''))}`);
    return null;
  }
  if (!authLoading && user && user.needsOnboarding === false && user.name?.trim() && !isUpgrade && !hasGuestRoleKey) {
    router.replace(redirect);
    return null;
  }

  // ── City search helpers ───────────────────────────────────────────────────
  const searchCities = async (
    q: string,
    setSugs: (v: { id: string; name: string }[]) => void,
  ) => {
    if (!q.trim()) { setSugs([]); return; }
    try {
      const r = await locationsApi.getCities(q, 20);
      const d = r.data?.data || r.data || [];
      setSugs(Array.isArray(d) ? d : []);
    } catch { setSugs([]); }
  };

  // ── Buyer city ─────────────────────────────────────────────────────────────
  const handleBuyerCityChange = (v: string) => {
    setBuyerCitySearch(v); setBuyerCityId(''); setBuyerCityName('');
    setShowBuyerCitySuggest(true);
    clearTimeout(buyerCityTimer.current);
    buyerCityTimer.current = setTimeout(() => searchCities(v, setBuyerCitySuggestions), 280);
  };

  // ── Owner city ─────────────────────────────────────────────────────────────
  const handleOwnerCityChange = (v: string) => {
    setOwnerCitySearch(v); setOwnerCityId(''); setOwnerCityName('');
    setOwnerLocalities([]); setOwnerLocalityId(''); setOwnerLocalityName('');
    setShowOwnerCitySuggest(true);
    clearTimeout(ownerCityTimer.current);
    ownerCityTimer.current = setTimeout(() => searchCities(v, setOwnerCitySuggestions), 280);
  };

  const handleOwnerCitySelect = async (city: { id: string; name: string }) => {
    setOwnerCityId(city.id); setOwnerCityName(city.name);
    setOwnerCitySearch(city.name); setShowOwnerCitySuggest(false);
    setOwnerLocalitiesLoading(true);
    try {
      const r = await locationsApi.getLocalities(city.name);
      const d = r.data;
      setOwnerLocalities(Array.isArray(d) ? d : []);
    } catch { setOwnerLocalities([]); }
    finally { setOwnerLocalitiesLoading(false); }
  };

  // ── Agent basic city ───────────────────────────────────────────────────────
  const handleAgentCityChange = (v: string) => {
    setAgentCitySearch(v); setAgentCityId(''); setAgentCityName('');
    setShowAgentCitySug(true);
    clearTimeout(agentCityTimer.current);
    agentCityTimer.current = setTimeout(() => searchCities(v, setAgentCitySugs), 280);
  };

  // ── Coverage area helpers ──────────────────────────────────────────────────
  const handleCoverageCity = (idx: number, v: string) => {
    updateEntry(idx, { citySearch: v, cityId: '', cityName: '', showCitySuggestions: true });
    clearTimeout(cityTimers.current[idx]);
    if (!v.trim()) { updateEntry(idx, { citySuggestions: [], showCitySuggestions: false }); return; }
    cityTimers.current[idx] = setTimeout(async () => {
      try {
        const r = await locationsApi.getCities(v, 20);
        const d = r.data?.data || r.data || [];
        updateEntry(idx, { citySuggestions: Array.isArray(d) ? d : [] });
      } catch {}
    }, 280);
  };

  const handleCoverageSelect = async (idx: number, city: { id: string; name: string }) => {
    updateEntry(idx, { cityId: city.id, cityName: city.name, citySearch: city.name, showCitySuggestions: false, selectedLocalities: [], localities: [], localitiesLoading: true });
    try {
      const r = await locationsApi.getLocalities(city.name);
      const d = r.data;
      updateEntry(idx, { localities: Array.isArray(d) ? d : [], localitiesLoading: false });
    } catch { updateEntry(idx, { localitiesLoading: false }); }
  };

  const toggleLocality = (idx: number, loc: { id: string; name: string }) => {
    setCoverageEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      const exists = e.selectedLocalities.some(l => l.id === loc.id);
      return { ...e, selectedLocalities: exists ? e.selectedLocalities.filter(l => l.id !== loc.id) : [...e.selectedLocalities, loc] };
    }));
  };

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Profile image must be under 3 MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // ── Step validation ────────────────────────────────────────────────────────
  const validateStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!firstName.trim()) { setFirstNameError('First name is required'); return false; }
    }
    if (selectedRole === 'agent') {
      if (step === 2) {
        if (!agencyName.trim())    { setError('Business / Agency Name is required.'); return false; }
        if (!contactPhone.trim())  { setError('Contact Phone is required.'); return false; }
        if (!agentExperience)      { setError('Years of Experience is required.'); return false; }
        if (!agentCityId)          { setError('Please select your primary city.'); return false; }
      }
      if (step === 4) {
        if (!coverageEntries[0].cityId) { setError('Please select at least one coverage city.'); return false; }
      }
    }
    if (selectedRole === 'owner') {
      if (step === 2 && !ownerPropertyType) { setError('Please select a property type.'); return false; }
      if (step === 3 && !ownerCityId)       { setError('Please select your property city.'); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

      if (effectiveUpgrade) {
        const { data } = await authApi.upgradeRole(selectedRole as 'owner' | 'agent');
        login(data.token || data.accessToken, data.user, data.menus);

        if (fullName && fullName !== user?.name) {
          await authApi.updateProfile({ name: fullName }).catch(() => {});
        }
        if (avatarFile) {
          await authApi.uploadAvatar(avatarFile).catch(() => {});
        }

        // Agent coverage + agency
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
                await agencyApi.addMyLocation({ coverageType: 'locality', cityId: entry.cityId, cityName: entry.cityName, localityId: loc.id, localityName: loc.name }).catch(() => {});
              }
            } else {
              await agencyApi.addMyLocation({ coverageType: 'city', cityId: entry.cityId, cityName: entry.cityName }).catch(() => {});
            }
          }
        }
      } else {
        // ── New user standard onboarding ──────────────────────────────────
        const payload: any = { role: selectedRole, name: fullName };

        if (selectedRole === 'buyer') {
          if (buyerCityName)    payload.buyerCity     = buyerCityName;
          if (buyerCityId)      payload.buyerCityId   = buyerCityId;
          if (buyerBudgetRange) {
            payload.buyerBudgetMin = buyerBudgetRange.min;
            payload.buyerBudgetMax = buyerBudgetRange.max;
          }
          if (buyerPropertyTypes.length) payload.buyerPropertyTypes = buyerPropertyTypes.join(',');
          payload.buyerPurpose = buyerPurpose;
        }

        if (selectedRole === 'owner') {
          if (ownerPropertyType) payload.ownerPropertyType = ownerPropertyType;
          payload.ownerListingType = ownerListingType;
        }

        if (selectedRole === 'agent') {
          payload.agencyName      = agencyName.trim();
          payload.contactPhone    = contactPhone.trim();
          payload.agentExperience = Number(agentExperience);
          payload.businessAddress = businessAddress.trim();
          if (agentLicense.trim())   payload.agentLicense         = agentLicense.trim();
          if (agentGstNumber.trim()) payload.agentGstNumber        = agentGstNumber.trim().toUpperCase();
          if (agentPan.trim())       payload.agentPan              = agentPan.trim().toUpperCase();
          if (businessType)          payload.businessType          = businessType;
          if (selectedSpecializations.length) payload.agentSpecializations = selectedSpecializations.join(',');
          if (selectedLanguages.length)       payload.agentLanguages       = selectedLanguages.join(',');
          if (selectedWorkingDays.length)     payload.workingDays          = selectedWorkingDays.join(',');
          payload.officeStartTime = officeStartTime;
          payload.officeEndTime   = officeEndTime;
          if (agentWebsite.trim())   payload.agentWebsite = agentWebsite.trim();
        }

        const { data } = await authApi.completeOnboarding(payload);
        login(data.token, data.user, data.menus);

        if (avatarFile) {
          await authApi.uploadAvatar(avatarFile).catch(() => {});
        }

        // Agent coverage after onboarding
        if (selectedRole === 'agent') {
          for (const entry of coverageEntries) {
            if (!entry.cityId) continue;
            if (entry.selectedLocalities.length > 0) {
              for (const loc of entry.selectedLocalities) {
                await agencyApi.addMyLocation({ coverageType: 'locality', cityId: entry.cityId, cityName: entry.cityName, localityId: loc.id, localityName: loc.name }).catch(() => {});
              }
            } else {
              await agencyApi.addMyLocation({ coverageType: 'city', cityId: entry.cityId, cityName: entry.cityName }).catch(() => {});
            }
          }
          // Also add the primary city from step 2
          if (agentCityId && !coverageEntries.some(e => e.cityId === agentCityId)) {
            await agencyApi.addMyLocation({ coverageType: 'city', cityId: agentCityId, cityName: agentCityName }).catch(() => {});
          }
        }
      }

      await refreshAuth();
      sessionStorage.removeItem('t4bs_onboarding_role');

      // ── Capture onboarding lead (fire-and-forget) ──────────────────────────
      const phone = user?.phone ?? '';
      const fullNameForLead = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

      if (phone && selectedRole === 'buyer') {
        const propTypeMap: Record<string, string> = {
          plot: 'plot', land: 'plot',
          office: 'commercial', shop: 'commercial', warehouse: 'commercial', commercial: 'commercial',
          rental: 'rental', pg: 'rental',
        };
        const firstType = buyerPropertyTypes[0];
        const leadPropertyType = firstType ? (propTypeMap[firstType] ?? 'residential') : undefined;

        const requirementParts: string[] = [];
        if (buyerPurpose) requirementParts.push(`Looking to ${buyerPurpose}`);
        if (buyerPropertyTypes.length) requirementParts.push(buyerPropertyTypes.join(', '));
        if (buyerCityName) requirementParts.push(`in ${buyerCityName}`);
        if (buyerBudgetRange) requirementParts.push(`Budget: ${buyerBudgetRange.label}`);

        leadsApi.capturePublic({
          source: 'onboarding',
          contactName: fullNameForLead || user?.name || 'User',
          contactPhone: phone,
          contactUserId: user?.id,
          city: buyerCityName || undefined,
          cityId: buyerCityId || undefined,
          propertyFor: buyerPurpose,
          ...(leadPropertyType ? { propertyType: leadPropertyType } : {}),
          budgetMin: buyerBudgetRange?.min || undefined,
          budgetMax: buyerBudgetRange?.max || undefined,
          requirement: requirementParts.join(' — ') || undefined,
          userType: 'buyer',
          sessionId: (() => { try { return sessionStorage.getItem('t4bs_sid') ?? undefined; } catch { return undefined; } })(),
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }).catch(() => {});

      } else if (phone && selectedRole === 'owner') {
        const ownerPropTypeMap: Record<string, string> = {
          plot: 'plot', land: 'plot',
          office: 'commercial', shop: 'commercial', warehouse: 'commercial', commercial: 'commercial',
        };
        const ownerLeadType = ownerPropertyType
          ? (ownerPropTypeMap[ownerPropertyType] ?? 'residential')
          : undefined;

        leadsApi.capturePublic({
          source: 'onboarding',
          contactName: fullNameForLead || user?.name || 'Owner',
          contactPhone: phone,
          contactUserId: user?.id,
          city: ownerCityName || undefined,
          cityId: ownerCityId || undefined,
          locality: ownerLocalityName || undefined,
          localityId: ownerLocalityId || undefined,
          propertyFor: ownerListingType,
          ...(ownerLeadType ? { propertyType: ownerLeadType } : {}),
          requirement: [
            `Owner wants to ${ownerListingType === 'rent' ? 'rent out' : 'sell'}`,
            ownerPropertyType,
            ownerCityName ? `in ${ownerCityName}` : '',
          ].filter(Boolean).join(' ') || undefined,
          userType: 'owner',
          sessionId: (() => { try { return sessionStorage.getItem('t4bs_sid') ?? undefined; } catch { return undefined; } })(),
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }).catch(() => {});
      }

      // ── Smart post-onboarding redirect based on role ───────────────────────
      if (selectedRole === 'agent') {
        router.replace('/agent');
      } else if (selectedRole === 'owner') {
        // Persist pre-fill to sessionStorage so it survives any navigation type (hard refresh included)
        try {
          sessionStorage.setItem('t4bs_pp_prefill', JSON.stringify({
            mainCategory: ownerListingType === 'rent' ? 'rent' : 'buy',
            propertyType: ownerPropertyType || '',
            city: ownerCityName || '',
            cityId: ownerCityId || '',
            ...(ownerLocalityId ? { locality: ownerLocalityName, localityId: ownerLocalityId } : {}),
          }));
        } catch {}
        // Also dispatch for the client-side-navigation fast path
        dispatch(updatePostPropertyForm({
          mainCategory: ownerListingType === 'rent' ? 'rent' : 'buy',
          propertyType: ownerPropertyType || '',
          city: ownerCityName || '',
          cityId: ownerCityId || '',
          ...(ownerLocalityId ? { locality: ownerLocalityName, localityId: ownerLocalityId } : {}),
        }));
        router.replace('/post-property');
      } else {
        // Buyer: redirect to listings filtered by their preferences
        if (redirect && redirect !== '/') {
          router.replace(redirect);
        } else {
          const params = new URLSearchParams();
          params.set('category', buyerPurpose === 'rent' ? 'rent' : 'buy');
          if (buyerCityName)               params.set('city', buyerCityName);
          if (buyerPropertyTypes.length)   params.set('type', buyerPropertyTypes[0]);
          if (buyerBudgetRange?.max)       params.set('maxPrice', String(buyerBudgetRange.max));
          router.replace(`/properties?${params.toString()}`);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = step === totalSteps;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STEP CONTENT
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep = () => {
    // ── STEP 1 (all roles): Name + Role Selection ──────────────────────────
    if (step === 1) return (
      <div className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); if (firstNameError) setFirstNameError(''); }}
                placeholder="e.g. Rahul"
                autoFocus
                className={cn(
                  'w-full pl-9 pr-4 py-3 border rounded-2xl text-sm outline-none transition-all',
                  firstNameError ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                )}
              />
            </div>
            {firstNameError && <p className="text-red-500 text-xs mt-1">{firstNameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Last Name <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="e.g. Sharma"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden ring-2 ring-white shadow">
              {avatarPreview
                ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-white" />
              }
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-50 transition-colors">
              <Camera className="w-3 h-3 text-gray-600" />
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Profile Photo <span className="text-gray-400 font-normal">(optional)</span></p>
            <p className="text-[11px] text-gray-500 mt-0.5">Agents with photos get 3× more inquiries</p>
            {avatarPreview && (
              <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="text-[11px] text-red-500 hover:text-red-600 mt-0.5">Remove</button>
            )}
          </div>
        </div>

        {/* Role selection */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">I am a…</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROLES.map(role => {
              const Icon  = role.icon;
              const active = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    'relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all duration-200',
                    active
                      ? `${role.activeBorder} ${role.activeBg} shadow-lg scale-[1.02]`
                      : `${role.border} bg-white hover:shadow-md hover:scale-[1.01]`,
                  )}
                >
                  {active && (
                    <span className={cn('absolute top-2.5 right-2.5', role.checkColor)}>
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </span>
                  )}
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-all', active ? `bg-gradient-to-br ${role.gradient} shadow` : role.bg)}>
                    <Icon className={cn('w-4 h-4', active ? 'text-white' : role.iconColor)} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm leading-snug">{role.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{role.tagline}</p>
                  {active && (
                    <ul className="mt-2.5 space-y-1 w-full">
                      {role.benefits.map(b => (
                        <li key={b} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                          <CheckCircle2 className={cn('w-3 h-3 flex-shrink-0 mt-0.5', role.checkColor)} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

    // ── BUYER STEP 2: Preferences ─────────────────────────────────────────
    if (selectedRole === 'buyer' && step === 2) return (
      <div className="space-y-5">
        <div className="text-center pb-1">
          <p className="text-sm text-gray-500">Just 3 quick questions — we'll personalise your feed instantly</p>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Looking to…</label>
          <div className="grid grid-cols-2 gap-3">
            {(['buy', 'rent'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setBuyerPurpose(p)}
                className={cn(
                  'py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                  buyerPurpose === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300',
                )}
              >
                {p === 'buy' ? '🏠 Buy a Property' : '🔑 Rent a Property'}
              </button>
            ))}
          </div>
        </div>

        {/* City */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Preferred City <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={buyerCitySearch}
              onChange={e => handleBuyerCityChange(e.target.value)}
              onFocus={() => buyerCitySuggestions.length > 0 && setShowBuyerCitySuggest(true)}
              onBlur={() => setTimeout(() => setShowBuyerCitySuggest(false), 150)}
              placeholder="Type city name…"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            {buyerCityId && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />}
          </div>
          {showBuyerCitySuggest && buyerCitySuggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {buyerCitySuggestions.map(c => (
                <button key={c.id} type="button" onMouseDown={() => { setBuyerCityId(c.id); setBuyerCityName(c.name); setBuyerCitySearch(c.name); setShowBuyerCitySuggest(false); setBuyerCitySuggestions([]); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                  <MapPin className="w-3 h-3 inline mr-1.5 text-gray-400" />{c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Budget Range <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUDGET_RANGES.map(r => (
              <button
                key={r.label}
                type="button"
                onClick={() => setBuyerBudgetRange(buyerBudgetRange?.label === r.label ? null : r)}
                className={cn(
                  'py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all',
                  buyerBudgetRange?.label === r.label ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property types */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Type <span className="text-gray-400 font-normal text-xs">(optional, multi-select)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {dbPropTypes.map(pt => {
              const sel = buyerPropertyTypes.includes(pt.value);
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setBuyerPropertyTypes(prev => sel ? prev.filter(v => v !== pt.value) : [...prev, pt.value])}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                    sel ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-400',
                  )}
                >
                  {pt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Value message */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">We'll show you matched listings instantly — you can refine anytime from the dashboard.</p>
        </div>
      </div>
    );

    // ── OWNER STEP 2: Property Type + Listing Type ────────────────────────
    if (selectedRole === 'owner' && step === 2) return (
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dbPropTypes.map(pt => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setOwnerPropertyType(pt.value)}
                className={cn(
                  'py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all text-center',
                  ownerPropertyType === pt.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-300',
                )}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Listing For <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['sale', 'rent'] as const).map(lt => (
              <button
                key={lt}
                type="button"
                onClick={() => setOwnerListingType(lt)}
                className={cn(
                  'py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                  ownerListingType === lt ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-300',
                )}
              >
                {lt === 'sale' ? '💰 For Sale' : '🔑 For Rent'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700">Properties with complete details get <strong>4× more inquiries</strong>. You'll add full details in the next step.</p>
        </div>
      </div>
    );

    // ── OWNER STEP 3: City + Locality ─────────────────────────────────────
    if (selectedRole === 'owner' && step === 3) return (
      <div className="space-y-4">
        {/* City */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={ownerCitySearch}
              onChange={e => handleOwnerCityChange(e.target.value)}
              onFocus={() => ownerCitySuggestions.length > 0 && setShowOwnerCitySuggest(true)}
              onBlur={() => setTimeout(() => setShowOwnerCitySuggest(false), 150)}
              placeholder="Type city name…"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            {ownerCityId && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
          </div>
          {showOwnerCitySuggest && ownerCitySuggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {ownerCitySuggestions.map(c => (
                <button key={c.id} type="button" onMouseDown={() => handleOwnerCitySelect(c)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors">
                  <MapPin className="w-3 h-3 inline mr-1.5 text-gray-400" />{c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locality */}
        {ownerCityId && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Locality / Area <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            {ownerLocalitiesLoading ? (
              <div className="flex items-center gap-2 py-3 px-4 border border-gray-200 rounded-2xl text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading localities…
              </div>
            ) : ownerLocalities.length > 0 ? (
              <select
                value={ownerLocalityId}
                onChange={e => {
                  const loc = ownerLocalities.find(l => l.id === e.target.value);
                  setOwnerLocalityId(e.target.value);
                  setOwnerLocalityName(loc?.locality || loc?.name || '');
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white"
              >
                <option value="">Select locality…</option>
                {ownerLocalities.map(l => (
                  <option key={l.id} value={l.id}>{l.locality || l.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-400 py-2">No localities found for this city.</p>
            )}
          </div>
        )}
      </div>
    );

    // ── OWNER STEP 4: Pricing + Area ──────────────────────────────────────
    if (selectedRole === 'owner' && step === 4) return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {ownerListingType === 'rent' ? 'Monthly Rent' : 'Expected Price'} <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={ownerPriceMin}
                onChange={e => setOwnerPriceMin(e.target.value)}
                placeholder={ownerListingType === 'rent' ? '25000' : '5000000'}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Area (sq. ft.) <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={ownerArea}
                onChange={e => setOwnerArea(e.target.value)}
                placeholder="1200"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Ready to post? You can skip pricing for now.
          </p>
          <p className="text-[11px] text-emerald-600 leading-relaxed">
            Click <strong>Post Property & Go Live</strong> — you'll complete the full listing from your dashboard with photos, amenities, and more.
          </p>
        </div>
      </div>
    );

    // ── AGENT STEP 2: Basic Info ───────────────────────────────────────────
    if (selectedRole === 'agent' && step === 2) return (
      <div className="space-y-4">
        {/* Trust banner */}
        <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
          <BadgeCheck className="w-5 h-5 text-violet-600 flex-shrink-0" />
          <p className="text-xs text-violet-700"><strong>Verified agents get 5× more leads.</strong> Complete your profile to unlock your badge.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Business / Agency Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="PropElite Realty Pvt Ltd"
              className="w-full pl-9 pr-4 py-3 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-9 pr-4 py-3 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={agentExperience}
              onChange={e => setAgentExperience(e.target.value)}
              min="0" max="60"
              placeholder="5"
              className="w-full px-3 py-3 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            />
          </div>
        </div>

        {/* Primary city */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Primary City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={agentCitySearch}
              onChange={e => handleAgentCityChange(e.target.value)}
              onFocus={() => agentCitySugs.length > 0 && setShowAgentCitySug(true)}
              onBlur={() => setTimeout(() => setShowAgentCitySug(false), 150)}
              placeholder="Type city name…"
              className="w-full pl-9 pr-4 py-3 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            />
            {agentCityId && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />}
          </div>
          {showAgentCitySug && agentCitySugs.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-violet-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {agentCitySugs.map(c => (
                <button key={c.id} type="button" onMouseDown={() => { setAgentCityId(c.id); setAgentCityName(c.name); setAgentCitySearch(c.name); setShowAgentCitySug(false); setAgentCitySugs([]); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 transition-colors">
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );

    // ── AGENT STEP 3: Company Details ─────────────────────────────────────
    if (selectedRole === 'agent' && step === 3) return (
      <div className="space-y-4">

        {/* RERA — star treatment */}
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-bold text-amber-800">RERA Registration</p>
            <span className="ml-auto text-[10px] bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-semibold">STRONGLY RECOMMENDED</span>
          </div>
          <input
            type="text"
            value={agentLicense}
            onChange={e => setAgentLicense(e.target.value)}
            placeholder="e.g. MH/RERA/A12345 or UP-RERA/AGENT/2023/12345"
            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
          <p className="text-[11px] text-amber-700 mt-1.5">RERA agents get <strong>gold-verified badge</strong> and rank higher in search — leading to <strong>8× more leads</strong>.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Business type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Business Type</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white">
              {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
            </select>
          </div>

          {/* GST */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">GST Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={agentGstNumber}
              onChange={e => setAgentGstNumber(e.target.value.toUpperCase())}
              placeholder="27AAPFU0939F1ZV"
              maxLength={15}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            />
          </div>

          {/* PAN */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">PAN Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={agentPan}
              onChange={e => setAgentPan(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Website <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="url"
                value={agentWebsite}
                onChange={e => setAgentWebsite(e.target.value)}
                placeholder="https://youragency.com"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Office Address <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={businessAddress}
            onChange={e => setBusinessAddress(e.target.value)}
            placeholder="12, MG Road, Bangalore 560001"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
          />
        </div>

        {/* Office hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Opens</label>
            <input type="time" value={officeStartTime} onChange={e => setOfficeStartTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Closes</label>
            <input type="time" value={officeEndTime} onChange={e => setOfficeEndTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
          </div>
        </div>

        {/* Working days */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {WORKING_DAYS.map(d => {
              const sel = selectedWorkingDays.includes(d);
              return (
                <button key={d} type="button"
                  onClick={() => setSelectedWorkingDays(prev => sel ? prev.filter(x => x !== d) : [...prev, d])}
                  className={cn('px-3 py-1 rounded-lg border text-xs font-semibold transition-all', sel ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 text-gray-600 hover:border-violet-400')}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specializations */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Specialization <span className="text-gray-400 font-normal">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(s => {
              const sel = selectedSpecializations.includes(s);
              return (
                <button key={s} type="button"
                  onClick={() => setSelectedSpecializations(prev => sel ? prev.filter(x => x !== s) : [...prev, s])}
                  className={cn('px-3 py-1 rounded-full border text-xs font-semibold transition-all', sel ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 text-gray-600 hover:border-violet-400')}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Languages Spoken</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => {
              const sel = selectedLanguages.includes(lang);
              return (
                <button key={lang} type="button"
                  onClick={() => setSelectedLanguages(prev => sel ? prev.filter(x => x !== lang) : [...prev, lang])}
                  className={cn('px-3 py-1 rounded-full border text-xs font-semibold transition-all', sel ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 text-gray-600 hover:border-violet-400')}>
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

    // ── AGENT STEP 4: Coverage + RERA trust ───────────────────────────────
    if (selectedRole === 'agent' && step === 4) return (
      <div className="space-y-5">

        {/* RERA status nudge */}
        {!agentLicense && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">You haven't added your RERA number yet</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Add it on the previous step to get the <strong>gold-verified badge</strong> and rank at the top.</p>
              <button type="button" onClick={() => setStep(3)} className="text-[11px] text-amber-600 underline mt-0.5">Go back to add it →</button>
            </div>
          </div>
        )}

        {agentLicense && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-800">RERA number added — eligible for gold-verified badge</p>
              <p className="text-[11px] text-green-600 mt-0.5">Admin will verify and activate your badge within 24 hours.</p>
            </div>
          </div>
        )}

        {/* Coverage areas */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-violet-600" />
            Coverage Areas <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-500 mb-3">Leads from these areas will be matched to you automatically.</p>

          <div className="space-y-3">
            {coverageEntries.map((entry, idx) => (
              <div key={idx} className="border border-violet-200 rounded-xl p-3 bg-violet-50/30 relative">
                {coverageEntries.length > 1 && (
                  <button type="button" onClick={() => setCoverageEntries(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <p className="text-[10px] font-bold text-violet-600 mb-2">{idx === 0 ? 'PRIMARY AREA' : `AREA ${idx + 1}`}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* City */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={entry.citySearch}
                      onChange={e => handleCoverageCity(idx, e.target.value)}
                      onFocus={() => entry.citySuggestions.length > 0 && updateEntry(idx, { showCitySuggestions: true })}
                      onBlur={() => setTimeout(() => updateEntry(idx, { showCitySuggestions: false }), 150)}
                      placeholder="Type city…"
                      className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                    />
                    {entry.cityId && <CheckCircle2 className="absolute right-2.5 top-[30px] w-3.5 h-3.5 text-violet-500" />}
                    {entry.showCitySuggestions && entry.citySuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                        {entry.citySuggestions.map(c => (
                          <button key={c.id} type="button" onMouseDown={() => handleCoverageSelect(idx, c)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-violet-50">
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Localities */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Localities <span className="text-gray-400 font-normal">(optional)</span></label>
                    {!entry.cityId ? (
                      <div className="px-3 py-2 border border-violet-100 rounded-lg text-xs text-gray-400 bg-gray-50">Select city first</div>
                    ) : entry.localitiesLoading ? (
                      <div className="px-3 py-2 border border-violet-100 rounded-lg text-xs text-gray-400 bg-gray-50 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                      </div>
                    ) : entry.localities.length === 0 ? (
                      <div className="px-3 py-2 border border-violet-100 rounded-lg text-xs text-gray-400 bg-gray-50">No localities found</div>
                    ) : (
                      <>
                        <div className="border border-violet-200 rounded-lg max-h-32 overflow-y-auto bg-white">
                          {entry.localities.map(l => {
                            const name = l.locality || l.name;
                            const checked = entry.selectedLocalities.some(s => s.id === l.id);
                            return (
                              <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-violet-50 cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={() => toggleLocality(idx, { id: l.id, name })} className="accent-violet-600" />
                                <span className="text-xs text-gray-700">{name}</span>
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

          <button type="button" onClick={() => setCoverageEntries(prev => [...prev, { citySearch:'', citySuggestions:[], showCitySuggestions:false, cityId:'', cityName:'', selectedLocalities:[], localities:[], localitiesLoading:false }])}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add another city
          </button>
        </div>

        {/* Social proof */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { icon: Users, label: '50K+ Agents', sub: 'on platform' },
            { icon: TrendingUp, label: '5× Leads', sub: 'for verified' },
            { icon: BadgeCheck, label: 'RERA Trust', sub: 'badge system' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center p-2.5 bg-violet-50 rounded-xl border border-violet-100 text-center">
              <Icon className="w-4 h-4 text-violet-600 mb-1" />
              <p className="text-xs font-bold text-violet-800">{label}</p>
              <p className="text-[10px] text-violet-600">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    );

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT — full-screen overlay, no header/nav (hidden in layout via pathname)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    /*
     * Fixed full-screen backdrop — the site content behind is semi-visible
     * but click-blocked. The onboarding modal floats in the center.
     */
    <div className="fixed inset-0 z-[500] flex flex-col overflow-hidden">

      {/* ── Blurred site-background layer ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900"
      >
        {/* Decorative property-card ghost tiles to evoke "the site behind" */}
        <div className="absolute inset-0 opacity-10 grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 pointer-events-none select-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white/20 rounded-xl h-32 sm:h-40 flex flex-col gap-2 p-3 overflow-hidden">
              <div className="flex-1 bg-white/20 rounded-lg" />
              <div className="h-2.5 bg-white/30 rounded w-3/4" />
              <div className="h-2 bg-white/20 rounded w-1/2" />
            </div>
          ))}
        </div>
        {/* Radial light glow behind modal */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[80px]" />
        </div>
      </div>

      {/* ── Dark semi-transparent scrim ── */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* ── Scrollable modal container ── */}
      <div className="relative z-10 flex-1 flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-10">
        <div className="w-full max-w-2xl">

          {/* Logo — floating at top of modal */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">T4</span>
            </div>
            <span className="text-xl font-black text-white drop-shadow">
              Think<span className="text-primary-400">4Buy</span><span className="text-amber-400">Sale</span>
            </span>
            <span className="ml-2 flex items-center gap-1 text-xs text-white/60">
              <Shield className="w-3 h-3" /> Secure
            </span>
          </div>

          {/* Step badge + headline */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 text-white/90 rounded-full text-xs font-semibold mb-3 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {isUpgrade ? 'Upgrade your account' : step === 1 ? 'One quick step before you explore' : `Step ${step} of ${totalSteps} — ${stepLabels[step - 1]}`}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow mb-1.5">
              {step === 1
                ? (isUpgrade ? 'Set up your listing account' : 'How are you using Think4BuySale?')
                : stepLabels[step - 1]
              }
            </h1>
            <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
              {step === 1
                ? 'Pick your role so we can personalise your experience.'
                : selectedRole === 'buyer'  && step === 2 ? "Tell us what you're looking for — 30 seconds."
                : selectedRole === 'owner'  && step === 2 ? 'Tell us about the property you want to list.'
                : selectedRole === 'owner'  && step === 3 ? 'Where is your property located?'
                : selectedRole === 'owner'  && step === 4 ? 'Optional: pricing details attract more buyers.'
                : selectedRole === 'agent'  && step === 2 ? 'Basic details to create your agent profile.'
                : selectedRole === 'agent'  && step === 3 ? 'Company details build trust and unlock your badge.'
                : 'Select the areas where you want to receive leads.'
              }
            </p>
          </div>

          {/* Progress stepper */}
          {totalSteps > 1 && <Stepper role={selectedRole} step={step} />}

          {/* Form card — solid white, modal-style */}
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-6 mb-4">
            {renderStep()}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-900/80 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-2xl backdrop-blur-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3 mb-4">
            {step > 1 && (
              <button type="button" onClick={prevStep}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-white/20 text-white font-semibold text-sm hover:border-white/40 hover:bg-white/10 transition-all backdrop-blur-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={isLastStep ? handleSubmit : nextStep}
              disabled={loading}
              className={cn(
                'flex-1 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
                `bg-gradient-to-r ${roleDef.ctaGradient} text-white`,
              )}
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account…</>
                : isLastStep
                  ? <>{roleDef.cta} <ChevronRight className="w-5 h-5" /></>
                  : <>Continue <ChevronRight className="w-5 h-5" /></>
              }
            </button>
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-5 text-xs text-white/40 mb-2">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 100% Secure</span>
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> 10L+ Listings</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Verified Platform</span>
          </div>

          {/* Skip / role-change hint */}
          {selectedRole !== 'agent' && step > 1 && !isLastStep && (
            <p className="text-center text-xs text-white/40 mt-1">
              All fields on this step are optional — skip and complete later.
            </p>
          )}
          {step === 1 && (
            <p className="text-center text-xs text-white/40 mt-1">
              You can update your role later from Profile Settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
