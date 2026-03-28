'use client';

import { useState, useEffect, useRef } from 'react';
import {
  HelpCircle, X, MessageSquare, Star, Send,
  ChevronRight, CheckCircle, LogIn, Loader2, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supportApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab       = 'help' | 'feedback';
type FormState = 'idle' | 'submitting' | 'success' | 'error';

const HELP_CATEGORIES = [
  'Property Listing Issue',
  'Payment / Billing',
  'Account & Login',
  'Agent Complaint',
  'Website / App Bug',
  'Search Not Working',
  'Other',
];

const FEEDBACK_CATEGORIES = [
  'Overall Experience',
  'Property Search',
  'Agent Quality',
  'Website Usability',
  'Listing Accuracy',
  'Customer Support',
];

// ── Star Rating component ─────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110"
            aria-label={`${star} star`}
          >
            <Star
              size={28}
              className={cn(
                'transition-colors',
                (hovered || value) >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-300',
              )}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 h-4">
        {labels[hovered || value] || 'Tap to rate'}
      </p>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export default function GlobalHelpWidget() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [open,      setOpen]      = useState(false);
  const [tab,       setTab]       = useState<Tab>('help');
  const [state,     setState]     = useState<FormState>('idle');
  const [errorMsg,  setErrorMsg]  = useState('');
  const [showPulse, setShowPulse] = useState(false);

  // Form fields
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [category, setCategory] = useState('');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [rating,   setRating]   = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);

  // Pulse hint after 15 seconds to draw attention
  useEffect(() => {
    const t = setTimeout(() => setShowPulse(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user) {
      setName(user.name  || '');
      setEmail(user.email || '');
      setPhone((user as any).phone || '');
    }
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reset form when switching tabs or closing
  const resetForm = () => {
    setCategory('');
    setSubject('');
    setMessage('');
    setRating(0);
    setState('idle');
    setErrorMsg('');
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    resetForm();
  };

  const handleOpen = () => {
    setOpen(true);
    setShowPulse(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (tab === 'feedback' && rating === 0) {
      setErrorMsg('Please select a star rating.');
      return;
    }

    setState('submitting');
    setErrorMsg('');

    try {
      await supportApi.create({
        name:     name.trim() || 'Anonymous',
        email:    email.trim() || undefined,
        phone:    phone.trim() || undefined,
        type:     tab,
        category: category || undefined,
        subject:  subject.trim() || undefined,
        message:  message.trim(),
        rating:   tab === 'feedback' ? rating : undefined,
      });
      setState('success');
      // Auto-close after 3 s
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 3000);
    } catch {
      setState('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  const categories = tab === 'help' ? HELP_CATEGORIES : FEEDBACK_CATEGORIES;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={handleOpen}
        aria-label="Help & Feedback"
        className={cn(
          // LEFT side — never conflicts with FloatingCTA (always bottom-right)
          // Mobile: bottom-20 clears the 64px mobile nav bar with room to spare
          // Desktop: bottom-6 aligns with FloatingCTA height for visual symmetry
          'fixed bottom-20 left-4 lg:bottom-6 z-50',
          'w-12 h-12 rounded-full shadow-lg',
          'bg-indigo-600 hover:bg-indigo-700 text-white',
          'flex items-center justify-center',
          'transition-all duration-200 hover:scale-110 focus:outline-none',
          open && 'scale-90 opacity-0 pointer-events-none',
        )}
      >
        <HelpCircle size={22} />
        {/* Pulse ring hint */}
        {showPulse && !open && (
          <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-60" />
        )}
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          // Panel anchored bottom-left, opens upward — mirrors button position
          'fixed bottom-20 left-4 lg:bottom-6 z-50',
          'w-[calc(100vw-2rem)] sm:w-[380px]',
          'bg-white rounded-2xl shadow-2xl border border-slate-100',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 origin-bottom-left',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none',
        )}
        style={{ maxHeight: 'min(600px, calc(100vh - 6rem))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} />
            <span className="font-semibold text-sm">Help &amp; Feedback</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-full hover:bg-indigo-500 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          {(['help', 'feedback'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium transition-colors',
                tab === t
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t === 'help' ? (
                <span className="flex items-center justify-center gap-1.5">
                  <MessageSquare size={14} /> Get Help
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Star size={14} /> Leave Feedback
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Success State ── */}
          {state === 'success' && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-800">
                {tab === 'help' ? 'Query Submitted!' : 'Thank You!'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {tab === 'help'
                  ? "We've received your query and will get back to you shortly."
                  : 'Your feedback helps us improve Think4BuySale for everyone.'}
              </p>
              <p className="text-xs text-slate-400">Closing in a moment…</p>
            </div>
          )}

          {/* ── Login Gate ── */}
          {state !== 'success' && !user && (
            <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <LogIn size={22} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 mb-1">Login Required</p>
                <p className="text-sm text-slate-500">
                  Please log in to submit a{' '}
                  {tab === 'help' ? 'help query' : 'feedback'}.
                  Your contact details will be auto-filled.
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); dispatch(openAuthModal({ mode: 'login' })); }}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <LogIn size={15} /> Log In / Sign Up
              </button>
              <p className="text-xs text-slate-400">
                Don&apos;t have an account? Sign up free in seconds.
              </p>
            </div>
          )}

          {/* ── Form ── */}
          {state !== 'success' && user && (
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
              {/* Name / Email / Phone — prefilled, editable */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-0.5 block">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Full name"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-0.5 block">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    placeholder="Optional"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-0.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={150}
                  placeholder="Optional"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                />
              </div>

              {/* Feedback: star rating */}
              {tab === 'feedback' && (
                <div className="py-1">
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block text-center">
                    How would you rate your experience?
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
              )}

              {/* Category */}
              <div className="relative">
                <label className="text-xs font-medium text-slate-600 mb-0.5 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm px-3 py-2 pr-8 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 appearance-none"
                >
                  <option value="">Select category (optional)</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-[calc(50%+6px)] text-slate-400 pointer-events-none" />
              </div>

              {/* Subject — help only */}
              {tab === 'help' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-0.5 block">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    placeholder="Brief summary of your issue"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-0.5 block">
                  {tab === 'help' ? 'Describe your issue *' : 'Your thoughts *'}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={2000}
                  rows={4}
                  placeholder={
                    tab === 'help'
                      ? 'Tell us what happened and how we can help…'
                      : 'Share what you liked, disliked, or what we can improve…'
                  }
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 resize-none"
                />
                <p className="text-right text-xs text-slate-400 mt-0.5">{message.length}/2000</p>
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="text-xs text-red-500 -mt-1">{errorMsg}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={state === 'submitting' || !message.trim()}
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                  state === 'submitting' || !message.trim()
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95',
                )}
              >
                {state === 'submitting' ? (
                  <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                ) : (
                  <><Send size={15} /> {tab === 'help' ? 'Submit Query' : 'Send Feedback'}</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                We typically respond within 24 hours.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
