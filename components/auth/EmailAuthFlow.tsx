'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, Loader2, ArrowLeft, ArrowRight, ShieldCheck, KeyRound,
  Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Phone,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * The whole email-first auth flow, with no opinion about its surroundings.
 *
 * Rendered by both the /auth page and the global AuthModal. It lives in one
 * place deliberately: two copies of a login flow drift, and the copy that gets
 * forgotten is the one that quietly keeps offering a mobile OTP the backend has
 * already stopped honouring.
 */

// ─── Flow ─────────────────────────────────────────────────────────────────────
// Every visitor starts at `email`; the account lookup decides where they go next,
// so there is no "are you new here?" question and no separate register URL.
export type Step =
  | 'email'     // always the entry point
  | 'password'  // existing, verified, password-backed account
  | 'register'  // no account on this address
  | 'otp'       // 6-digit code sent to the address
  | 'phone'     // mobile number entry — only when ENABLE_MOBILE_OTP is on
  | 'phone-otp';

type Role = 'buyer' | 'owner' | 'agent';

const ROLES: { value: Role; label: string; desc: string; icon: string }[] = [
  { value: 'buyer', label: 'Buyer / Tenant', desc: 'Looking for a property',      icon: '🔍' },
  { value: 'owner', label: 'Owner',          desc: 'I have property to sell/rent', icon: '🏠' },
  { value: 'agent', label: 'Agent',          desc: 'Real estate professional',     icon: '🤝' },
];

// Mirrors the backend's 60s per-address resend throttle (auth.service.ts) so the
// countdown can start the moment a code is sent, with no extra round trip.
const RESEND_COOLDOWN_SECONDS = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Where a signed-in user lands when no explicit redirect was requested. */
export function homeForRole(user: any): string {
  if (user?.isSuperAdmin || user?.role === 'admin' || user?.role === 'super_admin') return '/admin';
  if (user?.role === 'agent' || user?.role === 'owner') return '/post-property';
  return '/';
}

/** Only ever hand `router.replace` an internal path — blocks open-redirects. */
export function safeRedirect(raw: string | null | undefined): string {
  if (!raw) return '';
  // Rejects protocol-relative ("//evil.com") and absolute URLs alike.
  if (!raw.startsWith('/') || raw.startsWith('//')) return '';
  return raw;
}

function apiError(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

// ─── Small shared UI ──────────────────────────────────────────────────────────

function ErrBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

function InfoBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-blue-700 text-sm">
      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

function PrimaryBtn({
  loading, disabled = false, children,
}: { loading: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full min-h-[54px] flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25 active:scale-[0.99]"
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</> : children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-600 mb-1.5">{children}</label>;
}

const INPUT_CLASS =
  'w-full min-h-[54px] pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-primary-400 focus:border-transparent';

function PasswordField({
  value, onChange, placeholder, autoFocus = false, autoComplete,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  autoFocus?: boolean; autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        required
        className={`${INPUT_CLASS} pr-12`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((p) => !p)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function PasswordStrength({ pw }: { pw: string }) {
  if (!pw) return null;
  const checks = [
    { label: '8+ characters', ok: pw.length >= 8 },
    { label: 'Uppercase',     ok: /[A-Z]/.test(pw) },
    { label: 'Number',        ok: /\d/.test(pw) },
    { label: 'Symbol',        ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score  = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-2.5 h-2.5" /> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-semibold shrink-0 ${score >= 3 ? 'text-emerald-600' : 'text-orange-500'}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Six single-character boxes. Paste fills the whole row from wherever it lands,
 * and Backspace on an empty box steps back a field — without those two, boxed
 * OTP inputs are worse than one plain text field.
 */
function OtpBoxes({
  value, onChange, onComplete, disabled,
}: { value: string; onChange: (v: string) => void; onComplete?: () => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const chars = value.split('');

    // Clearing a box: drop that digit and everything after it, so the string
    // never carries a hole that would misalign the remaining boxes.
    if (!digits) {
      onChange(chars.slice(0, index).join(''));
      return;
    }

    // Typing or pasting several digits at once fills forward from here.
    for (let i = 0; i < digits.length && index + i < 6; i++) chars[index + i] = digits[i];
    const joined = chars.join('').slice(0, 6);
    onChange(joined);

    refs.current[Math.min(index + digits.length, 5)]?.focus();
    if (joined.length === 6) onComplete?.();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      e.preventDefault();
      onChange(value.slice(0, index - 1));
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between" role="group" aria-label="6-digit verification code">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          disabled={disabled}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
          className="w-full h-14 text-center text-xl font-bold text-gray-900 bg-white border border-gray-200 rounded-2xl outline-none transition-all focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:opacity-50"
        />
      ))}
    </div>
  );
}

// ─── Flow ─────────────────────────────────────────────────────────────────────

export interface EmailAuthFlowProps {
  /** Internal path to return to after a successful sign-in. */
  redirectTo?: string;
  /**
   * Called on success INSTEAD of navigating. The modal uses this to close
   * itself and decide where to go; the page leaves it unset and takes the
   * default navigation.
   */
  onAuthenticated?: (data: any) => void;
  /** Heading override for the first step (the modal states why it opened). */
  title?: string;
  subtitle?: string;
  /** Renders the privacy note and terms line. On by default in both surfaces. */
  showFooter?: boolean;
}

export default function EmailAuthFlow({
  redirectTo = '',
  onAuthenticated,
  title,
  subtitle,
  showFooter = true,
}: EmailAuthFlowProps) {
  const router = useRouter();
  const { login, setLoginLoading } = useAuth();

  const [step,     setStep]     = useState<Step>('email');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [devOtp,   setDevOtp]   = useState('');
  const [timer,    setTimer]    = useState(0);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [role,     setRole]     = useState<Role>('buyer');
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [knownName, setKnownName] = useState<string | null>(null);

  const [mobileOtpEnabled, setMobileOtpEnabled] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // The mobile path is rendered only if the backend says the flag is on, so the
  // UI never advertises a door that `sendOtp` will refuse.
  useEffect(() => {
    authApi.getAuthConfig()
      .then(({ data }) => setMobileOtpEnabled(!!data?.mobileOtpEnabled))
      .catch(() => setMobileOtpEnabled(false));
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = useCallback(() => {
    setTimer(RESEND_COOLDOWN_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  const goTo = (next: Step) => { setStep(next); setError(''); };

  const resetTo = (target: Step) => {
    setStep(target);
    setError(''); setInfo(''); setOtp(''); setPassword(''); setDevOtp('');
  };

  /** Single place where a successful session turns into navigation. */
  const completeLogin = (data: any) => {
    setLoginLoading(true);
    login(data.token, data.user, data.menus);

    if (onAuthenticated) { onAuthenticated(data); return; }

    if (data.isNewUser) {
      const q = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
      router.replace(`/auth/onboarding${q}`);
      return;
    }
    router.replace(redirectTo || homeForRole(data.user));
  };

  /** Both OTP responses share this shape — a code was sent, so start the clock. */
  const handleOtpSent = (data: any, message: string) => {
    setDevOtp(data?.devOtp || '');
    setInfo(message);
    setOtp('');
    startCooldown();
  };

  // ── Step 1: which door does this address open? ─────────────────────────────

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await authApi.emailStatus(email.trim());
      setKnownName(data?.name ?? null);

      if (!data?.exists) { goTo('register'); return; }

      // A password box is only useful for a verified, password-backed account.
      // Anything else (OTP-only signup, or a registration that never finished
      // verifying) goes straight to a code, so the visitor is never asked for a
      // password that cannot work.
      if (data.hasPassword && data.isVerified) { goTo('password'); return; }

      const res = await authApi.sendEmailOtp(email.trim());
      handleOtpSent(res.data, `We sent a 6-digit code to ${email.trim()}.`);
      goTo('otp');
    } catch (err: any) {
      setError(apiError(err, 'Something went wrong. Please try again.'));
    } finally { setLoading(false); }
  };

  // ── Step 2a: password ─────────────────────────────────────────────────────

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await authApi.login(email.trim(), password);

      // An unverified account gets a code instead of a session (see the
      // verify-first gate in auth.service.login).
      if (data?.requiresVerification) {
        handleOtpSent(data, data.message || 'Please verify your email to continue.');
        goTo('otp');
        return;
      }
      completeLogin(data);
    } catch (err: any) {
      setLoginLoading(false);
      setError(apiError(err, 'Incorrect email or password.'));
    } finally { setLoading(false); }
  };

  /** Password recovery *is* the email code — there is no separate reset flow. */
  const useCodeInstead = async () => {
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await authApi.sendEmailOtp(email.trim());
      handleOtpSent(data, `We sent a 6-digit code to ${email.trim()}.`);
      goTo('otp');
    } catch (err: any) {
      setError(apiError(err, 'Could not send the code. Please try again.'));
    } finally { setLoading(false); }
  };

  // ── Step 2b: register ─────────────────────────────────────────────────────

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        ...(phone.trim() && { phone: phone.trim() }),
      });

      // Registration never returns a session — the address is proven first.
      if (data?.requiresVerification) {
        handleOtpSent(data, data.message || `We sent a 6-digit code to ${email.trim()}.`);
        goTo('otp');
        return;
      }
      completeLogin(data); // tolerated fallback if the backend ever returns a session
    } catch (err: any) {
      setError(apiError(err, 'Could not create your account. Please try again.'));
    } finally { setLoading(false); }
  };

  // ── Step 3: verify the emailed code ───────────────────────────────────────

  const submitOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.verifyEmailOtp(email.trim(), otp, name.trim() || undefined);
      completeLogin(data);
    } catch (err: any) {
      setLoginLoading(false);
      setError(apiError(err, 'That code was not right. Please try again.'));
      setOtp('');
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await authApi.sendEmailOtp(email.trim());
      handleOtpSent(data, 'A new code is on its way.');
    } catch (err: any) {
      setError(apiError(err, 'Could not resend the code.'));
    } finally { setLoading(false); }
  };

  // ── Optional mobile path — live only when ENABLE_MOBILE_OTP is on ─────────

  const sendPhoneOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const { data } = await authApi.sendOtp(phone);
      handleOtpSent(data, `We sent a 6-digit code to +91 ${phone}.`);
      goTo('phone-otp');
    } catch (err: any) {
      setError(apiError(err, 'Could not send the code.'));
    } finally { setLoading(false); }
  };

  const submitPhoneOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.verifyOtp(phone, otp);
      completeLogin(data);
    } catch (err: any) {
      setLoginLoading(false);
      setError(apiError(err, 'That code was not right. Please try again.'));
      setOtp('');
    } finally { setLoading(false); }
  };

  // ── Copy per step ─────────────────────────────────────────────────────────

  const HEADINGS: Record<Step, { title: string; sub: string }> = {
    email:       { title: title || 'Login or Sign Up', sub: subtitle || 'Enter your email to continue' },
    password:    { title: knownName ? `Welcome back, ${knownName}` : 'Welcome back', sub: email },
    register:    { title: 'Create your account', sub: `Signing up as ${email}` },
    otp:         { title: 'Check your email',   sub: `Code sent to ${email}` },
    phone:       { title: 'Login with mobile',  sub: 'We will text you a 6-digit code' },
    'phone-otp': { title: 'Verify your mobile', sub: `Code sent to +91 ${phone}` },
  };
  const heading = HEADINGS[step];

  const backTo = (): Step | null => {
    if (step === 'password' || step === 'register' || step === 'phone' || step === 'otp') return 'email';
    if (step === 'phone-otp') return 'phone';
    return null;
  };

  return (
    <div>
      {/* Back */}
      {backTo() && (
        <button
          type="button"
          onClick={() => resetTo(backTo()!)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{heading.title}</h2>
        <p className="text-sm text-gray-400 mt-1 break-words">{heading.sub}</p>
      </div>

      <div className="space-y-4">
        {error && <ErrBox msg={error} />}
        {!error && info && <InfoBox msg={info} />}

        {devOtp && (step === 'otp' || step === 'phone-otp') && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
            <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-700">Dev code: <strong>{devOtp}</strong></span>
          </div>
        )}

        {/* ── Email ─────────────────────────────────────────────── */}
        {step === 'email' && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <FieldLabel>Email address <span className="text-red-500">*</span></FieldLabel>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <PrimaryBtn loading={loading} disabled={!email.trim()}>
              Continue <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>

            {mobileOtpEnabled && (
              <>
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => resetTo('phone')}
                  className="w-full min-h-[54px] flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Continue with mobile number
                </button>
              </>
            )}
          </form>
        )}

        {/* ── Password ──────────────────────────────────────────── */}
        {step === 'password' && (
          <form onSubmit={submitPassword} className="space-y-4">
            <div>
              <FieldLabel>Password <span className="text-red-500">*</span></FieldLabel>
              <PasswordField
                value={password}
                onChange={(v) => { setPassword(v); setError(''); }}
                placeholder="Your password"
                autoComplete="current-password"
                autoFocus
              />
            </div>

            <PrimaryBtn loading={loading} disabled={!password}>
              Log in <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>

            {/* Doubles as the forgotten-password route: a code proves the
                address just as well as a remembered password does. */}
            <button
              type="button"
              onClick={useCodeInstead}
              disabled={loading}
              className="w-full text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50"
            >
              Forgot password? Email me a 6-digit code instead
            </button>
          </form>
        )}

        {/* ── Register ──────────────────────────────────────────── */}
        {step === 'register' && (
          <form onSubmit={submitRegister} className="space-y-4">
            <div>
              <FieldLabel>I am a <span className="text-red-500">*</span></FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    aria-pressed={role === r.value}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      role === r.value
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg leading-none mb-1">{r.icon}</div>
                    <div className="text-[11px] font-bold text-gray-900 leading-tight">{r.label}</div>
                    <div className="text-[9px] text-gray-400 leading-tight mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Full name <span className="text-red-500">*</span></FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                  required
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Mobile number <span className="text-gray-400 font-normal">(optional)</span></FieldLabel>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel"
                  className={INPUT_CLASS}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                So buyers and owners can reach you. We verify by email for now.
              </p>
            </div>

            <div>
              <FieldLabel>Create password <span className="text-red-500">*</span></FieldLabel>
              <PasswordField
                value={password}
                onChange={(v) => { setPassword(v); setError(''); }}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <PasswordStrength pw={password} />
            </div>

            <PrimaryBtn loading={loading} disabled={!name.trim() || password.length < 6}>
              Create account <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </form>
        )}

        {/* ── OTP (email or mobile) ─────────────────────────────── */}
        {(step === 'otp' || step === 'phone-otp') && (
          <form onSubmit={step === 'otp' ? submitOtp : submitPhoneOtp} className="space-y-4">
            <div>
              <FieldLabel>Enter the 6-digit code</FieldLabel>
              <OtpBoxes
                value={otp}
                onChange={(v) => { setOtp(v); setError(''); }}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Didn&apos;t get it?</span>
              {timer > 0 ? (
                <span className="text-gray-400">Resend in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={step === 'otp' ? resendOtp : sendPhoneOtp}
                  disabled={loading}
                  className="text-primary-600 font-semibold inline-flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" /> Resend code
                </button>
              )}
            </div>

            {step === 'otp' && (
              <p className="text-[11px] text-gray-400">
                Codes expire in 10 minutes. If it hasn&apos;t arrived, check your spam or
                promotions folder.
              </p>
            )}

            <PrimaryBtn loading={loading} disabled={otp.length !== 6}>
              Verify &amp; continue <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </form>
        )}

        {/* ── Mobile number entry ───────────────────────────────── */}
        {step === 'phone' && (
          <form onSubmit={(e) => { e.preventDefault(); sendPhoneOtp(); }} className="space-y-4">
            <div>
              <FieldLabel>Mobile number <span className="text-red-500">*</span></FieldLabel>
              <div className="flex rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-transparent overflow-hidden">
                <div className="flex items-center px-3.5 bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-medium shrink-0">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoFocus
                  className="flex-1 min-h-[54px] px-4 text-sm text-gray-900 outline-none"
                />
              </div>
            </div>
            <PrimaryBtn loading={loading} disabled={phone.length !== 10}>
              Send code <ArrowRight className="w-4 h-4" />
            </PrimaryBtn>
          </form>
        )}
      </div>

      {showFooter && (
        <>
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span>Your details stay private. We never sell your data or spam you.</span>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-4">
            By continuing you agree to our{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">Terms</Link>{' '}and{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
          </p>
        </>
      )}
    </div>
  );
}
