'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, Loader2, Phone, RefreshCw, Shield,
  ArrowRight, Star, TrendingUp, Clock, Award,
} from 'lucide-react';
import { authApi, agencyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ── User type options (like 99acres) ──────────────────────────────────────────
const USER_TYPES = [
  { value: 'owner', icon: '🏠', label: 'Owner',          sub: 'I own this property' },
  { value: 'agent', icon: '🤝', label: 'Agent / Broker', sub: 'I represent owner' },
];

const STATS = [
  { value: '50,000+', label: 'Live Listings' },
  { value: '18 Lakh+', label: 'Monthly Visitors' },
  { value: '₹0',      label: 'Posting Cost' },
  { value: '< 30 min', label: 'First Inquiry' },
];

const BENEFITS = [
  { icon: TrendingUp, color: 'text-blue-600 bg-blue-50',   title: 'Maximum Exposure',    desc: 'Reach lakhs of verified buyers & tenants.' },
  { icon: CheckCircle, color: 'text-green-600 bg-green-50', title: '100% Free Listing',  desc: 'No charges. No commission. Ever.' },
  { icon: Clock, color: 'text-orange-600 bg-orange-50',     title: 'Go Live in Minutes', desc: 'Your listing goes live within minutes.' },
  { icon: Award, color: 'text-purple-600 bg-purple-50',     title: 'Premium Placement',  desc: 'Featured spots for more visibility.' },
];

export default function GuestPostPropertyPage() {
  const router          = useRouter();
  const { login, user } = useAuth();

  const [userType, setUserType] = useState('owner');
  const [phone, setPhone]       = useState('');
  const [otp,   setOtp]         = useState('');
  const [step,  setStep]        = useState<'landing' | 'otp' | 'agency' | 'success'>('landing');
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [devOtp,  setDevOtp]    = useState('');
  const [timer,   setTimer]     = useState(0);

  // Agency step state (agents only)
  const [agencyName,    setAgencyName]    = useState('');
  const [agencyPhone,   setAgencyPhone]   = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');

  // Redirect once auth state is confirmed.
  // Use hard navigation (window.location) so the browser sends a fresh request
  // through Next.js middleware — guaranteeing the t4bs_auth cookie is read
  // and the middleware allows /post-property instead of bouncing back here.
  useEffect(() => {
    if (step === 'success' && user) {
      window.location.href = '/post-property';
    }
  }, [step, user]);

  const startTimer = () => {
    setTimer(30);
    const id = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; }), 1000);
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.sendOtp(phone);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep('otp');
      startTimer();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP → redirect to onboarding (with role pre-selected) ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the 6-digit OTP sent to your phone'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.verifyOtp(phone, otp);
      login(data.token || data.accessToken, data.user);

      const currentRole = data.user?.role;

      // New user OR existing buyer — go to onboarding with selected role pre-filled
      if (data.user?.needsOnboarding || currentRole === 'buyer') {
        // Persist chosen role so onboarding keeps it on refresh / URL edits
        sessionStorage.setItem('t4bs_onboarding_role', userType);
        const upgradeFlag = !data.user?.needsOnboarding ? '&upgrade=1' : '';
        router.replace(`/auth/onboarding?redirect=/post-property&role=${userType}${upgradeFlag}`);
        return;
      }

      // Already an owner / agent / admin / seller — go straight to the post form
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step 3 (agents): Register/join agency ────────────────────────────────
  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) { setError('Agency / firm name is required'); return; }
    setLoading(true); setError('');
    try {
      await agencyApi.selfRegisterOrJoin({
        agencyName:   agencyName.trim(),
        contactPhone: agencyPhone.trim() || undefined,
        address:      agencyAddress.trim() || undefined,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register agency. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setOtp(''); setError(''); setDevOtp('');
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(phone);
      if (data.devOtp) setDevOtp(data.devOtp);
      startTimer();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white">
        <div className="container-max py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* Left: Copy + Stats */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                India's Fastest Growing Real Estate Platform
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                Sell or Rent Your<br />Property for{' '}
                <span className="text-yellow-400 underline decoration-wavy decoration-yellow-300/60">FREE</span>
              </h1>
              <p className="text-blue-100 text-base md:text-lg mb-8 max-w-md">
                Post your property on Think4BuySale and reach lakhs of genuine buyers & tenants — no commission, no hidden fees.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STATS.map((s) => (
                  <div key={s.label} className="bg-white/10 rounded-xl px-3 py-3 text-center backdrop-blur-sm">
                    <div className="text-xl font-extrabold text-white">{s.value}</div>
                    <div className="text-blue-200 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-5 mt-6 text-sm text-blue-200">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Zero Commission</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Verified Buyers</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Instant Go-Live</span>
              </div>
            </div>

            {/* Right: Form Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-7 text-gray-900">

              {step === 'success' ? (
                /* ── Success Step ── */
                <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-9 h-9 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">You're all set!</h2>
                    <p className="text-gray-500 text-sm">Account verified. Taking you to the property form…</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              ) : step === 'agency' ? (
                /* ── Agency Details Step ── */
                <form onSubmit={handleAgencySubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Your Agency Details</h2>
                    <p className="text-gray-500 text-sm">Tell us about your agency or firm. We'll link your listings to it.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Agency / Firm Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => { setAgencyName(e.target.value); setError(''); }}
                      placeholder="e.g. Sharma Properties, ABC Realty"
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">If your agency already exists on our platform, your listings will be linked to it automatically.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Phone (optional)</label>
                    <input
                      type="tel"
                      value={agencyPhone}
                      onChange={(e) => setAgencyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Agency contact number"
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Address (optional)</label>
                    <input
                      type="text"
                      value={agencyAddress}
                      onChange={(e) => setAgencyAddress(e.target.value)}
                      placeholder="Agency office address"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-blue-700">
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>New agencies are reviewed by our team. Your listings will be visible once the agency is approved (usually within 24 hrs).</span>
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !agencyName.trim()}
                    className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><ArrowRight className="w-4 h-4" /> Continue to Post Property</>
                    }
                  </button>
                </form>
              ) : step === 'landing' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Post Your Property</h2>
                  <p className="text-gray-500 text-sm mb-5">Create a free account and list your property in minutes.</p>

                  {/* I am */}
                  <p className="text-sm font-semibold text-gray-700 mb-2">I am a…</p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {USER_TYPES.map((ut) => (
                      <button
                        key={ut.value}
                        type="button"
                        onClick={() => setUserType(ut.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer',
                          userType === ut.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50/40',
                        )}
                      >
                        <span className="text-2xl">{ut.icon}</span>
                        <span className="font-semibold">{ut.label}</span>
                        <span className="text-gray-400 text-[10px] leading-tight text-center">{ut.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Phone form */}
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm font-medium">
                          🇮🇳 +91
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || phone.length !== 10}
                      className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP…</>
                        : <><Phone className="w-4 h-4" /> Get OTP & Start Posting</>
                      }
                    </button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                    <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
                  </div>

                  <Link
                    href="/auth/login?redirect=/post-property"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Already have account? Login <ArrowRight className="w-4 h-4" />
                  </Link>

                  <p className="text-center text-xs text-gray-400 mt-3">
                    By continuing you agree to our{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link>
                    {' '}&{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                  </p>
                </>
              ) : (
                /* ── OTP Step ── */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => { setStep('landing'); setOtp(''); setError(''); setDevOtp(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
                    >
                      ← Change number
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Verify your number</h2>
                    <p className="text-gray-500 text-sm">
                      OTP sent to <span className="font-semibold text-gray-700">+91 {phone}</span>
                    </p>
                  </div>

                  {devOtp && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-700">Dev OTP: <strong className="text-green-800">{devOtp}</strong></span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl text-center text-2xl font-bold tracking-widest text-gray-900 outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Didn't receive OTP?</span>
                    {timer > 0 ? (
                      <span className="text-gray-400">Resend in {timer}s</span>
                    ) : (
                      <button type="button" onClick={handleResend} disabled={loading}
                        className="text-primary-600 font-semibold flex items-center gap-1 hover:underline">
                        <RefreshCw className="w-3 h-3" /> Resend OTP
                      </button>
                    )}
                  </div>

                  {error && (
                    <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-amber-700">
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Your number is used only to create your free account and send property alerts. We never spam.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-base hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                      : '✓ Verify & Continue to Post'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Think4BuySale ── */}
      <section className="py-14 container-max">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2">Why Think4BuySale?</h2>
        <p className="text-gray-500 text-center mb-10">Everything you need to sell or rent your property faster</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works (3 steps) ── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="container-max">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-8">Post in 3 Simple Steps</h2>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { step: '1', icon: '📱', title: 'Enter Mobile',    desc: 'Verify with OTP — free & instant' },
              { step: '2', icon: '🏠', title: 'Add Details',     desc: 'Location, type, price, photos' },
              { step: '3', icon: '🚀', title: 'Go Live',         desc: 'Buyers start contacting you' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="relative inline-block mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm mx-auto">
                    {s.icon}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    {s.step}
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO content ── */}
      <section className="py-10 container-max max-w-3xl text-center">
        <p className="text-gray-400 text-sm leading-relaxed">
          Think4BuySale is India's trusted free property listing portal. Whether you're an owner or agent —
          list residential & commercial properties across Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, and 50+ cities.
          Zero commission, instant listing, verified buyer leads.
        </p>
      </section>
    </div>
  );
}
