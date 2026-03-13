'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Loader2, Eye, EyeOff, CheckCircle, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type UserType = 'owner' | 'agent';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  agreeToTerms: boolean;
}

const USER_TYPES: { value: UserType; label: string; desc: string; icon: string }[] = [
  { value: 'owner', label: 'Owner',  desc: 'I own property to sell/rent', icon: '🏠' },
  { value: 'agent', label: 'Agent',  desc: 'Real estate professional',     icon: '🤝' },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters',       ok: password.length >= 8 },
    { label: 'Uppercase letter',     ok: /[A-Z]/.test(password) },
    { label: 'Number',               ok: /\d/.test(password) },
    { label: 'Special character',    ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {checks.map(c => (
            <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
              <CheckCircle className="w-2.5 h-2.5" /> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className={`text-xs font-semibold ${score >= 3 ? 'text-emerald-600' : 'text-orange-500'}`}>{labels[score]}</span>}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'owner',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (key: keyof FormData, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: '' }));
    if (error) setError('');
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Full name must be at least 2 characters';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.password || form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    if (!form.agreeToTerms)
      errs.agreeToTerms = 'You must agree to the terms';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        role: form.userType,
      };
      if (form.phone) payload.phone = form.phone;

      const { data } = await authApi.register(payload);
      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) setError(msg.join('. '));
      else setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
          </span>
        </Link>
        <span className="text-sm text-gray-500">
          Already registered?{' '}
          <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </span>
      </div>

      <div className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-lg">
          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm">Join 10,000+ users on Think4BuySale</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* User type selector */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-5">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">I am a...</p>
              <div className="grid grid-cols-2 gap-3">
                {USER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('userType', t.value)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
                      form.userType === t.value
                        ? 'border-white bg-white/20 text-white'
                        : 'border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-bold">{t.label}</span>
                    <span className="text-[9px] text-center leading-tight opacity-75">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Rahul Sharma"
                    autoFocus
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                      fieldErrors.name
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent'
                    }`}
                  />
                </div>
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="rahul@example.com"
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                      fieldErrors.email
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent'
                    }`}
                  />
                </div>
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                        fieldErrors.phone
                          ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent'
                      }`}
                    />
                  </div>
                </div>
                {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Create a strong password"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                      fieldErrors.password
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(e) => set('agreeToTerms', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-primary-600 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary-600 hover:underline font-medium" target="_blank">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:underline font-medium" target="_blank">Privacy Policy</Link>
                  </span>
                </label>
                {fieldErrors.agreeToTerms && <p className="text-red-500 text-xs mt-1 ml-6">{fieldErrors.agreeToTerms}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25 mt-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  : <><ArrowRight className="w-4 h-4" /> Create Account</>
                }
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or sign up with</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setError('Google sign-up coming soon')}
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => setError('OTP login available on sign-in page')}
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  📱 OTP Login
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
