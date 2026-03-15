'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Home, Briefcase, ChevronRight, Loader2,
  CheckCircle2, Building2, Star, Shield, Zap,
} from 'lucide-react';
import { authApi } from '@/lib/api';
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
  const { login, user, loading: authLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleId>('buyer');
  const [agentLicense, setAgentLicense] = useState('');
  const [agentExperience, setAgentExperience] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  // If not authenticated, send to login
  if (!authLoading && !user) {
    router.replace(`/auth/login?redirect=${encodeURIComponent('/auth/onboarding' + (redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''))}`);
    return null;
  }

  // If user already completed onboarding, redirect them onward
  if (!authLoading && user && !user.needsOnboarding) {
    router.replace(redirect);
    return null;
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload: { role: string; agentLicense?: string; agentExperience?: number; agencyName?: string } = {
        role: selectedRole,
      };
      if (selectedRole === 'agent') {
        if (agentLicense.trim()) payload.agentLicense = agentLicense.trim();
        if (agentExperience) payload.agentExperience = Number(agentExperience);
        if (agencyName.trim()) payload.agencyName = agencyName.trim();
      }

      const { data } = await authApi.completeOnboarding(payload);
      // Re-login with updated user (new role, needsOnboarding = false)
      login(data.token, data.user, data.menus);

      // Redirect to role-appropriate dashboard
      const dest =
        selectedRole === 'agent' ? '/agent' :
        selectedRole === 'owner' ? '/owner' :
        '/buyer';

      router.replace(dest);
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
              Almost there — one last step
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              How are you using Think4BuySale?
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
              Choose your role so we can personalise your experience and show you the right tools.
            </p>
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
                Agent Profile (optional — helps verify your listing)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Agency / Company Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. PropElite Realty Pvt Ltd"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                  <p className="text-[10px] text-violet-500 mt-1">Will be submitted for admin approval as a pending agency</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">RERA / License Number</label>
                  <input
                    type="text"
                    value={agentLicense}
                    onChange={(e) => setAgentLicense(e.target.value)}
                    placeholder="e.g. MH/RERA/A12345"
                    className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Years of Experience</label>
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
