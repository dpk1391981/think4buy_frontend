'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authApi, agencyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AvatarUpload from '@/components/common/AvatarUpload';
import {
  MapPin, Briefcase, ArrowRight, Plus, Pencil, X, Check,
  Mail, Phone, Building2, BadgeCheck, FileText, Clock,
  ChevronRight, AlertCircle,
} from 'lucide-react';

interface ProfileForm {
  name: string;
  phone: string;
  company: string;
  agentLicense: string;
  agentGstNumber: string;
  agentBio: string;
  agentExperience: string;
}

export default function AgentProfilePage() {
  const { user, refresh } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    name: '', phone: '', company: '',
    agentLicense: '', agentGstNumber: '', agentBio: '', agentExperience: '',
  });

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [profStatus, setProfStatus] = useState<'none' | 'pending' | 'approved' | 'inactive'>('none');
  const [coverageAreas, setCoverageAreas] = useState<{
    id: string; coverageType: string; cityName?: string; localityName?: string;
  }[]>([]);

  // Email inline-edit state
  const [emailEdit, setEmailEdit]       = useState(false);
  const [emailValue, setEmailValue]     = useState('');
  const [emailSaving, setEmailSaving]   = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    agencyApi.getMyLocations()
      .then((r) => setCoverageAreas(r.data || []))
      .catch(() => {});

    authApi.getProfile()
      .then((r) => {
        const d = r.data;
        setForm({
          name: d.name || '',
          phone: d.phone || '',
          company: d.company || '',
          agentLicense: d.agentLicense || '',
          agentGstNumber: d.agentGstNumber || '',
          agentBio: d.agentBio || '',
          agentExperience: d.agentExperience ? String(d.agentExperience) : '',
        });
        setEmailValue(d.email || '');
        setProfStatus(d.agentProfileStatus || 'none');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function openEmailEdit() {
    setEmailValue(user?.email || '');
    setEmailEdit(true);
    setTimeout(() => emailInputRef.current?.focus(), 50);
  }

  function cancelEmailEdit() {
    setEmailEdit(false);
    setEmailValue(user?.email || '');
  }

  async function saveEmail() {
    const trimmed = emailValue.trim();
    if (!trimmed || trimmed === user?.email) { setEmailEdit(false); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      showToast('error', 'Enter a valid email address.');
      return;
    }
    setEmailSaving(true);
    try {
      await authApi.updateProfile({ email: trimmed } as any);
      await refresh();
      setEmailEdit(false);
      setEmailChanged(true);
      showToast('success', 'Email updated. Please verify your new email.');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to update email.');
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { showToast('error', 'Name is required.'); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        ...({ phone: form.phone.trim() || undefined } as any),
        ...({ agentLicense: form.agentLicense.trim() || undefined } as any),
        ...({ agentGstNumber: form.agentGstNumber.trim() || undefined } as any),
        ...({ agentBio: form.agentBio.trim() || undefined } as any),
        ...({ agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined } as any),
      });
      await refresh();
      showToast('success', 'Profile updated successfully!');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Badge helpers ────────────────────────────────────────────────────────── */
  const tickColors: Record<string, string> = {
    blue:    'bg-blue-100 text-blue-700 border-blue-200',
    gold:    'bg-yellow-100 text-yellow-700 border-yellow-200',
    diamond: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  const tickIcon: Record<string, string> = { blue: '✓', gold: '★', diamond: '◆' };

  /* ── Loading skeleton ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-b-3xl mb-16" />
        <div className="px-4 space-y-4 max-w-2xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasBadge = user?.agentTick && user.agentTick !== 'none';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-xs ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success'
            ? <Check className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Hero banner ───────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 pb-20 pt-6 px-4">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-white font-bold text-xl mb-1 opacity-90">My Profile</h1>
          <p className="text-blue-200 text-sm">Manage your personal &amp; professional info</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-14 space-y-4">

        {/* ── Identity card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar */}
            <div className="flex-shrink-0">
              <AvatarUpload size={96} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-lg font-bold text-gray-900 truncate">{user?.name}</span>
                {hasBadge && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${tickColors[user!.agentTick!]}`}>
                    {tickIcon[user!.agentTick!]} {user!.agentTick!.charAt(0).toUpperCase() + user!.agentTick!.slice(1)} Badge
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-sm text-gray-500">
                <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                  {user?.role}
                </span>
                {form.agentExperience && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                    {form.agentExperience} yr{Number(form.agentExperience) !== 1 ? 's' : ''} exp
                  </span>
                )}
              </div>

              {/* Coverage pills */}
              <div className="mt-3">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Coverage Areas</span>
                </div>
                {coverageAreas.length === 0 ? (
                  <Link
                    href="/agent/agency"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add coverage areas
                  </Link>
                ) : (
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {coverageAreas.slice(0, 6).map((loc) => (
                      <span
                        key={loc.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          loc.coverageType === 'locality'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        {loc.coverageType === 'locality'
                          ? `${loc.localityName}, ${loc.cityName}`
                          : loc.cityName}
                      </span>
                    ))}
                    {coverageAreas.length > 6 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        +{coverageAreas.length - 6} more
                      </span>
                    )}
                    <Link
                      href="/agent/agency"
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Edit <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Account details ───────────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="space-y-4">

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Account Details</h2>
            </div>

            <div className="divide-y divide-gray-50">

              {/* Name */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Email */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                {emailEdit ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveEmail(); }
                        if (e.key === 'Escape') cancelEmailEdit();
                      }}
                      className="flex-1 border border-blue-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      placeholder="new@email.com"
                      autoComplete="email"
                    />
                    <button
                      type="button"
                      onClick={saveEmail}
                      disabled={emailSaving}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors"
                      aria-label="Save email"
                    >
                      {emailSaving
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEmailEdit}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 border border-gray-100 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 min-w-0">
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={openEmailEdit}
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 flex items-center justify-center transition-colors"
                      aria-label="Edit email"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {emailChanged && !emailEdit && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Please verify your new email address to confirm the change.
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* ── Professional info ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Professional Details</h2>
              {profStatus !== 'none' && (
                <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  profStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                  profStatus === 'pending'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {profStatus === 'approved' ? '✓ Approved' :
                   profStatus === 'pending'  ? '⏳ Pending Review' :
                   'Inactive'}
                </span>
              )}
            </div>

            <div className="divide-y divide-gray-50">

              {/* Company */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Company / Agency</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="e.g. XYZ Realty Pvt Ltd"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* License + Experience in a row on desktop */}
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-gray-400" /> License Number
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.agentLicense}
                    onChange={(e) => setForm((f) => ({ ...f, agentLicense: e.target.value }))}
                    placeholder="e.g. RERA/MH/2024/001234"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-gray-400" /> GST Number <span className="text-gray-400 font-normal">(optional)</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.agentGstNumber}
                    onChange={(e) => setForm((f) => ({ ...f, agentGstNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. 27AAPFU0939F1ZV"
                    maxLength={15}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Experience (years)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.agentExperience}
                    onChange={(e) => setForm((f) => ({ ...f, agentExperience: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="px-5 py-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400" /> Professional Bio
                  </span>
                </label>
                <textarea
                  value={form.agentBio}
                  onChange={(e) => setForm((f) => ({ ...f, agentBio: e.target.value }))}
                  placeholder="A brief description about yourself and your expertise..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.agentBio.length}/500 characters</p>
              {profStatus === 'pending' && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Your professional details are under review by our admin team.
                </p>
              )}
              {profStatus === 'inactive' && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Your professional profile is inactive. Contact admin: @think4buysale
                </p>
              )}
              </div>
            </div>
          </div>

          {/* ── Quick links ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <Link
              href="/agent/agency"
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">Manage Coverage Areas</div>
                  <div className="text-xs text-gray-400">
                    {coverageAreas.length > 0
                      ? `${coverageAreas.length} area${coverageAreas.length !== 1 ? 's' : ''} configured`
                      : 'No areas added yet'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>

          {/* ── Save button ─────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-1 pb-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
