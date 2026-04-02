'use client';

import { useEffect, useRef, useState } from 'react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2, BadgeCheck, FileText, Globe, Clock, Users, Star,
  Languages, Briefcase, Phone, Loader2, CheckCircle2, Upload,
  AlertCircle, X, ChevronDown,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMeta(bio: string | null | undefined): Record<string, string> {
  if (!bio?.startsWith('__meta__:')) return {};
  try { return JSON.parse(bio.slice(9)); } catch { return {}; }
}

const BUSINESS_TYPES = ['Individual', 'Sole Proprietor', 'Partnership', 'LLP', 'Pvt. Ltd.', 'Other'];
const SPECIALIZATION_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Plots / Land', 'Builder Projects', 'Rental', 'Investment', 'NRI Deals'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Urdu', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MultiSelect({
  label, options, selected, onChange,
}: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selected.includes(opt)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldRow({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      {children}
    </div>
  );
}

function InputField({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}

// ── Document upload card ──────────────────────────────────────────────────────

function DocUpload({
  label, docType, hasDoc, onUploaded,
}: {
  label: string; docType: 'rera' | 'gst' | 'pan'; hasDoc: boolean; onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch preview via authenticated BE endpoint
  useEffect(() => {
    if (!hasDoc) { setPreviewSrc(''); return; }
    let objectUrl = '';
    setLoadingPreview(true);
    authApi.previewDocument(docType)
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setPreviewSrc(objectUrl);
      })
      .catch(() => setPreviewSrc(''))
      .finally(() => setLoadingPreview(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [docType, hasDoc]); // eslint-disable-line

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await authApi.uploadDocument(docType, file);
      const meta = parseMeta(res.data?.agentBio);
      const key = `doc${docType.charAt(0).toUpperCase()}${docType.slice(1)}`;
      onUploaded(meta[key] || '');
      // Reload preview from BE after upload
      const previewRes = await authApi.previewDocument(docType);
      const objectUrl = URL.createObjectURL(previewRes.data);
      setPreviewSrc(prev => { if (prev) URL.revokeObjectURL(prev); return objectUrl; });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {hasDoc && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </span>
        )}
      </div>
      <div className="mb-2 rounded-lg overflow-hidden border border-gray-200 bg-white min-h-[7rem] flex items-center justify-center">
        {loadingPreview ? (
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        ) : previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt={label} className="w-full h-28 object-contain p-2" />
        ) : (
          <span className="text-xs text-gray-300">No document</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? 'Uploading…' : hasDoc ? 'Replace' : 'Upload image'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <p className="text-gray-400 text-[11px] mt-1">JPEG / PNG / WebP · max 5 MB</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentCompanyPage() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Company fields
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [agentLicense, setAgentLicense] = useState('');   // RERA number
  const [agentGstNumber, setAgentGstNumber] = useState('');
  const [pan, setPan] = useState('');
  const [agentExperience, setAgentExperience] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [website, setWebsite] = useState('');
  const [officeStart, setOfficeStart] = useState('');
  const [officeEnd, setOfficeEnd] = useState('');
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Document URLs (stored in agentBio meta)
  const [docRera, setDocRera] = useState('');
  const [docGst, setDocGst] = useState('');
  const [docPan, setDocPan] = useState('');

  const [profStatus, setProfStatus] = useState<string>('none');

  useEffect(() => {
    authApi.getProfile().then(r => {
      const d = r.data;
      const meta = parseMeta(d.agentBio);
      setAgencyName(d.company || '');
      setPhone(d.phone || '');
      setAgentLicense(d.agentLicense || '');
      setAgentGstNumber(d.agentGstNumber || '');
      setPan(meta.pan || '');
      setAgentExperience(d.agentExperience != null ? String(d.agentExperience) : '');
      setBusinessType(meta.businessType || '');
      setWebsite(meta.website || '');
      setOfficeStart(meta.officeStart || '');
      setOfficeEnd(meta.officeEnd || '');
      setWorkingDays(meta.workingDays ? meta.workingDays.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      setSpecializations(meta.specializations ? meta.specializations.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      setLanguages(meta.languages ? meta.languages.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      setDocRera(meta.docRera || '');
      setDocGst(meta.docGst || '');
      setDocPan(meta.docPan || '');
      setProfStatus(d.agentProfileStatus || 'none');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateAgentCompany({
        agencyName: agencyName.trim() || undefined,
        phone: phone.trim() || undefined,
        agentLicense: agentLicense.trim() || undefined,
        agentGstNumber: agentGstNumber.trim() || undefined,
        pan: pan.trim() || undefined,
        agentExperience: agentExperience ? Number(agentExperience) : undefined,
        businessType: businessType || undefined,
        website: website.trim() || undefined,
        officeStart: officeStart || undefined,
        officeEnd: officeEnd || undefined,
        workingDays: workingDays.length ? workingDays.join(', ') : undefined,
        specializations: specializations.length ? specializations.join(', ') : undefined,
        languages: languages.length ? languages.join(', ') : undefined,
      });
      await refresh();
      setProfStatus('pending');
      showToast('success', 'Company details saved! Pending admin review.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; cls: string }> = {
    approved: { label: 'Verified', cls: 'bg-green-100 text-green-700' },
    pending:  { label: 'Under Review', cls: 'bg-yellow-100 text-yellow-700' },
    inactive: { label: 'Inactive', cls: 'bg-red-100 text-red-700' },
    none:     { label: 'Not Submitted', cls: 'bg-gray-100 text-gray-500' },
  };
  const sc = statusConfig[profStatus] || statusConfig.none;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Company Details
          </h1>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sc.cls}`}>{sc.label}</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Keep your professional details accurate — verified agents get 3× more leads.
        </p>
      </div>

      {profStatus === 'pending' && (
        <div className="mb-5 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Your details are under admin review. You'll be notified once verified.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Basic info ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" /> Basic Info
          </h2>

          <FieldRow label="Agency / Company Name" icon={Building2}>
            <InputField value={agencyName} onChange={setAgencyName} placeholder="e.g. Sunrise Realty" />
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="Contact Phone" icon={Phone}>
              <InputField value={phone} onChange={setPhone} placeholder="10-digit mobile" type="tel" />
            </FieldRow>
            <FieldRow label="Experience (years)" icon={Star}>
              <InputField value={agentExperience} onChange={setAgentExperience} placeholder="e.g. 5" type="number" />
            </FieldRow>
          </div>

          <FieldRow label="Business Type">
            <div className="relative">
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select type…</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </FieldRow>

          <FieldRow label="Website" icon={Globe}>
            <InputField value={website} onChange={setWebsite} placeholder="https://yoursite.com" type="url" />
          </FieldRow>
        </section>

        {/* ── Registrations ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-blue-500" /> Registrations &amp; KYC
          </h2>

          <FieldRow label="RERA Number" icon={BadgeCheck}>
            <div className="relative">
              <InputField value={agentLicense} onChange={setAgentLicense} placeholder="e.g. MH/A/2022/012345" />
              {agentLicense && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                  RERA
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Agents with RERA get 8× more trust signals on listings</p>
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow label="GST Number">
              <InputField value={agentGstNumber} onChange={setAgentGstNumber} placeholder="27AAPFU0939F1ZV" />
            </FieldRow>
            <FieldRow label="PAN Number">
              <InputField value={pan} onChange={setPan} placeholder="ABCDE1234F" />
            </FieldRow>
          </div>
        </section>

        {/* ── Office hours ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Office Hours
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Opens At">
              <InputField value={officeStart} onChange={setOfficeStart} type="time" />
            </FieldRow>
            <FieldRow label="Closes At">
              <InputField value={officeEnd} onChange={setOfficeEnd} type="time" />
            </FieldRow>
          </div>

          <MultiSelect label="Working Days" options={DAYS} selected={workingDays} onChange={setWorkingDays} />
        </section>

        {/* ── Expertise ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Expertise
          </h2>
          <MultiSelect
            label="Specializations"
            options={SPECIALIZATION_OPTIONS}
            selected={specializations}
            onChange={setSpecializations}
          />
          <MultiSelect
            label="Languages Spoken"
            options={LANGUAGE_OPTIONS}
            selected={languages}
            onChange={setLanguages}
          />
        </section>

        {/* ── Documents ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Documents
          </h2>
          <p className="text-xs text-gray-500">Upload images of your registration certificates for admin verification.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DocUpload label="RERA Certificate" docType="rera" hasDoc={!!docRera} onUploaded={url => setDocRera(url)} />
            <DocUpload label="GST Certificate"  docType="gst"  hasDoc={!!docGst}  onUploaded={url => setDocGst(url)}  />
            <DocUpload label="PAN Card"         docType="pan"  hasDoc={!!docPan}  onUploaded={url => setDocPan(url)}  />
          </div>
        </section>

        {/* ── Save ── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Save Company Details</>}
          </button>
        </div>
      </form>
    </div>
  );
}
