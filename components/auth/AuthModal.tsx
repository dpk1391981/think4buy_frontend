'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, Phone, RefreshCw, Shield, CheckCircle, Loader2, Heart, Home, BookOpen } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { closeAuthModal, AuthModalReason } from '@/lib/store/slices/uiSlice';
import { cn } from '@/lib/utils';

const REASON_CONFIG: Record<AuthModalReason, { icon: React.ReactNode; title: string; subtitle: string }> = {
  wishlist: {
    icon: <Heart className="w-5 h-5 text-red-500 fill-red-500" />,
    title: 'Save to Wishlist',
    subtitle: 'Login to save your favourite properties',
  },
  'post-property': {
    icon: <Home className="w-5 h-5 text-primary-600" />,
    title: 'Post Property FREE',
    subtitle: 'Login to list your property in minutes',
  },
  'app-open': {
    icon: <BookOpen className="w-5 h-5 text-primary-600" />,
    title: 'Welcome to Think4BuySale',
    subtitle: 'Join 18L+ property seekers across India',
  },
  general: {
    icon: null,
    title: 'Login / Register',
    subtitle: 'Use your mobile number to continue',
  },
};

type Step = 'phone' | 'otp';

export default function AuthModal() {
  const dispatch  = useAppDispatch();
  const router    = useRouter();
  const pathname  = usePathname();
  const { authModalOpen, authModalReason, authModalRedirectTo } = useAppSelector((s) => s.ui);
  const { login, setLoginLoading } = useAuth();
  const reasonConfig = REASON_CONFIG[authModalReason] ?? REASON_CONFIG.general;

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  // Reset on close
  useEffect(() => {
    if (!authModalOpen) {
      setTimeout(() => {
        setStep('phone');
        setPhone('');
        setOtp('');
        setError('');
        setDevOtp('');
        setTimer(0);
      }, 300);
    }
  }, [authModalOpen]);

  // Animate in/out — track mounted state separately so CSS transition plays
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (authModalOpen) {
      // Tiny delay so the translate-y transition fires after mount
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const startTimer = () => {
    setTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

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
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the 6-digit OTP sent to your phone'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.verifyOtp(phone, otp);
      // Set full-screen loader BEFORE calling login() + router.push()
      // so the transition is covered from the first frame.
      setLoginLoading(true);
      login(data.token, data.user, data.menus);
      dispatch(closeAuthModal());

      if (data.isNewUser) {
        const next = authModalRedirectTo ? `?redirect=${encodeURIComponent(authModalRedirectTo)}` : '';
        router.push(`/auth/onboarding${next}`);
      } else if (authModalRedirectTo) {
        router.push(authModalRedirectTo);
      } else if (pathname === '/post-property/guest') {
        // User logged in via the header modal while on the guest post-property page —
        // always send them to the actual form regardless of role.
        router.push('/post-property');
      } else {
        const role = data.user?.role;
        const isAdminLevel = data.user?.isSuperAdmin || role === 'admin' || role === 'super_admin';
        if      (isAdminLevel)      router.push('/admin');
        else if (role === 'agent')  router.push('/post-property');
        else                        router.push('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.');
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
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-colors duration-300 ${visible ? 'bg-black/60' : 'bg-black/0'}`}
      onClick={() => dispatch(closeAuthModal())}
    >
      {/* Modal Panel — slides up from bottom on mobile, fades in centered on desktop */}
      <div
        className={`
          bg-white w-full sm:max-w-sm sm:mx-4
          rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          sm:transition-[opacity,transform]
          ${visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — tap to close on mobile */}
        <div
          className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer"
          onClick={() => dispatch(closeAuthModal())}
          aria-label="Close"
        >
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step === 'phone' && reasonConfig.icon && (
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                {reasonConfig.icon}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 'phone' ? reasonConfig.title : 'Verify OTP'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {step === 'phone'
                  ? reasonConfig.subtitle
                  : `Sent to +91 ${phone}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeAuthModal())}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Dev OTP hint */}
          {devOtp && step === 'otp' && (
            <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">Dev OTP: <strong>{devOtp}</strong></span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-transparent overflow-hidden">
                  <div className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-medium flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    autoFocus
                    className="flex-1 px-4 py-3 text-sm outline-none bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full py-3.5 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP…</>
                  : <><Phone className="w-4 h-4" /> Get OTP</>}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or continue with</span></div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setError('Google login coming soon')}
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
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setError('Facebook login coming soon')}
                >
                  <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </form>
          ) : (
            /* OTP Step */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); setDevOtp(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-1"
              >
                ← Change number
              </button>

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Enter 6-digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-center text-2xl font-bold tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              {/* Resend */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Didn't receive OTP?</span>
                {timer > 0 ? (
                  <span className="text-gray-400">Resend in {timer}s</span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-primary-600 font-semibold flex items-center gap-1 hover:underline">
                    <RefreshCw className="w-3 h-3" /> Resend
                  </button>
                )}
              </div>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl text-xs text-blue-700">
                <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Your number is only used to create your account. We never spam.
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3.5 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                  : '✓ Verify & Continue'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing you agree to our{' '}
            <a href="/terms" className="text-primary-600 hover:underline">Terms</a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
