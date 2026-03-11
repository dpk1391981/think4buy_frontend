'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'phone' | 'otp' | 'name';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(phone);
      setIsNewUser(data.isNewUser);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep('otp');
      setResendTimer(30);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
    if (next.every((d) => d !== '') && next.join('').length === 4) {
      // auto-verify when all 4 digits filled
      handleVerifyOtp(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== 4) { setError('Enter the 4-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      if (isNewUser) {
        // New user — collect name first then verify
        setStep('name');
        setLoading(false);
        return;
      }
      const { data } = await authApi.verifyOtp(phone, code);
      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone, otp.join(''), name.trim() || undefined);
      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '']);
    setDevOtp('');
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(phone);
      if (data.devOtp) setDevOtp(data.devOtp);
      setResendTimer(30);
      otpRefs[0].current?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-primary-600 px-6 pt-8 pb-10 text-white">
              <div className="flex items-center gap-3 mb-4">
                {step !== 'phone' && (
                  <button
                    onClick={() => { setStep(step === 'name' ? 'otp' : 'phone'); setError(''); }}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h1 className="text-xl font-bold">
                    {step === 'phone' && 'Login / Register'}
                    {step === 'otp' && 'Verify OTP'}
                    {step === 'name' && 'Almost there!'}
                  </h1>
                  <p className="text-primary-100 text-sm mt-0.5">
                    {step === 'phone' && 'Enter your mobile number to continue'}
                    {step === 'otp' && `OTP sent to +91 ${phone}`}
                    {step === 'name' && 'Tell us your name to get started'}
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex gap-1.5">
                {(['phone', 'otp', 'name'] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full flex-1 transition-all ${
                      step === s ? 'bg-white' :
                      (['phone', 'otp', 'name'] as Step[]).indexOf(step) > i ? 'bg-white/60' : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="px-6 pt-6 pb-8 -mt-4 relative">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                {error && (
                  <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Dev OTP hint */}
                {devOtp && step === 'otp' && (
                  <div className="mb-4 px-3 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-center gap-2">
                    <span className="font-semibold">Dev OTP:</span>
                    <span className="font-mono tracking-widest text-lg font-bold">{devOtp}</span>
                  </div>
                )}

                {/* ── Step: Phone ── */}
                {step === 'phone' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 flex-shrink-0">
                          🇮🇳 +91
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter 10-digit number"
                          autoFocus
                          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || phone.length !== 10}
                      className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get OTP'}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400">or continue with</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Social login */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setError('Google login coming soon')}
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
                        onClick={() => setError('Facebook login coming soon')}
                        className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Step: OTP ── */}
                {step === 'otp' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                        Enter 4-digit OTP
                      </label>
                      <div className="flex gap-3 justify-center">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={otpRefs[i]}
                            type="tel"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`w-14 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                              digit
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 text-gray-900 focus:border-primary-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleVerifyOtp()}
                      disabled={loading || otp.join('').length !== 4}
                      className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><CheckCircle className="w-4 h-4" /> Verify OTP</>
                      )}
                    </button>

                    <div className="text-center text-sm text-gray-500">
                      Didn't receive?{' '}
                      {resendTimer > 0 ? (
                        <span className="text-gray-400">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          onClick={handleResend}
                          className="text-primary-600 font-semibold hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Step: Name (new user) ── */}
                {step === 'name' && (
                  <form onSubmit={handleNameSubmit} className="space-y-4">
                    <div className="text-center text-4xl mb-2">👋</div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        autoFocus
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">You can update this later in your profile</p>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue →'}
                    </button>
                  </form>
                )}
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link> &amp;{' '}
                <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-5">
            <Link href="/" className="hover:text-primary-600 transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
