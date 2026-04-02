'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, locationsApi, agencyApi } from '@/lib/api';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';

interface Locality { id: string; name: string; }
interface CoverageLocation {
  id: string;
  coverageType: 'state' | 'city' | 'locality';
  stateName?: string; cityName?: string; localityName?: string;
  cityId?: string; stateId?: string;
  isActive?: boolean;
}
interface AgencyMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  isPrimaryOwner: boolean;
  joinedAt?: string;
  inviteExpiresAt?: string;
}

interface AgentMeta {
  pan?: string;
  businessType?: string;
  specializations?: string;
  languages?: string;
  officeStart?: string;
  officeEnd?: string;
  workingDays?: string;
  website?: string;
  docRera?: string;
  docGst?: string;
  docPan?: string;
  rejectionReason?: string;
  reraNumber?: string;
  gstNumber?: string;
}

function parseMeta(bio: string | undefined): AgentMeta {
  if (!bio?.startsWith('__meta__:')) return {};
  try { return JSON.parse(bio.slice(9)); } catch { return {}; }
}

// Admin-side document upload — uploads via /admin/agents/:id/documents/:docType
// Preview is fetched through authenticated BE endpoint (never exposes raw storage URL)
function AdminDocUpload({
  agentId, label, docType, hasDoc, onUploaded,
}: {
  agentId: string;
  label: string;
  docType: 'rera' | 'gst' | 'pan';
  hasDoc: boolean;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch preview via authenticated BE endpoint
  useEffect(() => {
    if (!hasDoc || !agentId) { setPreviewSrc(''); return; }
    let objectUrl = '';
    setLoadingPreview(true);
    adminApi.previewAgentDocument(agentId, docType)
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setPreviewSrc(objectUrl);
      })
      .catch(() => setPreviewSrc(''))
      .finally(() => setLoadingPreview(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [agentId, docType, hasDoc]); // eslint-disable-line

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const res = await adminApi.uploadAgentDocument(agentId, docType, file);
      const bio: string = res.data?.agentBio ?? '';
      let meta: Record<string, string> = {};
      if (bio.startsWith('__meta__:')) {
        try { meta = JSON.parse(bio.slice(9)); } catch {}
      }
      const key = `doc${docType.charAt(0).toUpperCase()}${docType.slice(1)}`;
      onUploaded(meta[key] || '');
      // Reload preview from BE after upload
      const previewRes = await adminApi.previewAgentDocument(agentId, docType);
      const objectUrl = URL.createObjectURL(previewRes.data);
      setPreviewSrc(prev => { if (prev) URL.revokeObjectURL(prev); return objectUrl; });
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
      <div className="w-full h-28 flex items-center justify-center bg-gray-50">
        {loadingPreview ? (
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        ) : previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt={label} className="w-full h-28 object-cover" />
        ) : (
          <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          {hasDoc && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition-colors w-full justify-center"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? 'Uploading…' : hasDoc ? 'Replace' : 'Upload'}
        </button>
        {uploadError && <p className="text-red-500 text-[11px]">{uploadError}</p>}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

// Defined outside component to keep a stable reference and prevent focus-loss on each keystroke
function Field({
  label, name, form, onChange, type = 'text', placeholder, required,
}: {
  label: string;
  name: string;
  form: Record<string, string>;
  onChange: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name] ?? ''}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

const BADGE_OPTIONS = [
  { value: 'none',     label: 'None',         color: 'bg-gray-100 text-gray-600' },
  { value: 'verified', label: '✓ Verified',    color: 'bg-blue-100 text-blue-700' },
  { value: 'bronze',   label: '◉ Bronze',      color: 'bg-amber-100 text-amber-700' },
  { value: 'silver',   label: '◈ Silver',      color: 'bg-slate-100 text-slate-700' },
  { value: 'gold',     label: '★ Gold',        color: 'bg-yellow-100 text-yellow-700' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  none:     'bg-gray-100 text-gray-600',
};
const MEMBER_ROLE_COLOR: Record<string, string> = {
  owner:   'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  member:  'bg-gray-100 text-gray-600',
};
const MEMBER_STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  invited:  'bg-amber-100 text-amber-700',
  declined: 'bg-red-100 text-red-700',
  removed:  'bg-gray-100 text-gray-500',
};

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState('');

  // Coverage areas
  const [agentProfileId, setAgentProfileId] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [coverageLocations, setCoverageLocations] = useState<CoverageLocation[]>([]);
  const [covLocalities, setCovLocalities]   = useState<Locality[]>([]);
  const [covCitySearch, setCovCitySearch] = useState('');
  const [covCitySuggestions, setCovCitySuggestions] = useState<{ id: string; name: string; stateName?: string; stateId?: string }[]>([]);
  const [showCovCitySug, setShowCovCitySug] = useState(false);
  const covCityTimer = useRef<ReturnType<typeof setTimeout>>();
  const [newCov, setNewCov] = useState<{
    coverageType: 'city' | 'locality';
    stateId: string; stateName: string;
    selectedCities: { id: string; name: string; stateId?: string; stateName?: string }[];
    cityId: string; cityName: string;
    selectedLocalities: { id: string; name: string }[];
  }>({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
  const [addingCov, setAddingCov] = useState(false);
  const [covError, setCovError] = useState('');

  // Trust signals
  const [trustForm, setTrustForm] = useState({ complaintCount: '0', avgResponseHours: '' });
  const [savingTrust, setSavingTrust] = useState(false);
  const [trustSaved, setTrustSaved] = useState(false);

  // Professional status
  const [agentProfileStatus, setAgentProfileStatus] = useState<string>('none');
  const [agentMeta, setAgentMeta] = useState<AgentMeta>({});
  const [rawBio, setRawBio] = useState(''); // non-meta bio

  // KYC document URLs (editable by admin)
  const [docRera, setDocRera] = useState('');
  const [docGst, setDocGst]   = useState('');
  const [docPan, setDocPan]   = useState('');

  // Approve modal
  const [approveModal, setApproveModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string>('verified');
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Agency members
  const [members, setMembers] = useState<AgencyMember[]>([]);

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    phone:           '',
    company:         '',
    stateId:         '',
    state:           '',
    cityId:          '',
    city:            '',
    agentLicense:    '',
    agentBio:        '',
    agentExperience: '',
    agentFreeQuota:  '100',
    agentTick:       'none' as 'none' | 'verified' | 'bronze' | 'silver' | 'gold',
  });

  // Load agent data on mount
  useEffect(() => {
    Promise.all([
      adminApi.getAgent(id),
      agencyApi.adminGetAgentProfileByUser(id).catch(() => ({ data: null })),
    ]).then(([agentRes, profileRes]) => {
      const a = agentRes.data;

      // Parse agentBio
      const bio: string = a.agentBio ?? '';
      const meta = parseMeta(bio);
      setAgentMeta(meta);
      setRawBio(bio.startsWith('__meta__:') ? '' : bio);
      setAgentProfileStatus(a.agentProfileStatus ?? 'none');
      setDocRera(meta.docRera || '');
      setDocGst(meta.docGst   || '');
      setDocPan(meta.docPan   || '');

      setForm({
        name:            a.name            ?? '',
        email:           a.email           ?? '',
        phone:           a.phone           ?? '',
        company:         a.company         ?? '',
        stateId:         a.stateId         ?? '',
        state:           a.state           ?? '',
        cityId:          a.cityId          ?? '',
        city:            a.city            ?? '',
        agentLicense:    a.agentLicense    ?? '',
        agentBio:        bio,
        agentExperience: a.agentExperience != null ? String(a.agentExperience) : '',
        agentFreeQuota:  a.agentFreeQuota  != null ? String(a.agentFreeQuota)  : '100',
        agentTick:       a.agentTick       ?? 'none',
      });

      const profile = profileRes.data;
      if (profile?.id) {
        setAgentProfileId(profile.id);
        const aid = profile.agencyId || profile.agency?.id || null;
        setAgencyId(aid);

        agencyApi.adminListCoverage({ agentProfileId: profile.id })
          .then(r => {
            const coverage: CoverageLocation[] = r.data?.items || r.data || [];
            setCoverageLocations(coverage);
            if (!a.city) {
              const firstCity = coverage.find(
                l => (l.coverageType === 'city' || l.coverageType === 'locality') && l.cityName,
              );
              if (firstCity) {
                setForm(prev => ({
                  ...prev,
                  city:  prev.city  || firstCity.cityName  || '',
                  state: prev.state || firstCity.stateName || '',
                }));
              }
            }
          })
          .catch(() => {});

        setTrustForm({
          complaintCount:   String(profile.complaintCount ?? 0),
          avgResponseHours: profile.avgResponseHours != null ? String(profile.avgResponseHours) : '',
        });

        // Load agency members
        if (aid) {
          agencyApi.adminGetAgencyMembers(aid)
            .then(r => setMembers(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
        }
      }
    }).catch(() => setError('Failed to load agent data'))
      .finally(() => setFetching(false));
  }, [id]);

  // Load coverage localities when coverage cityName changes
  useEffect(() => {
    if (!newCov.cityName) { setCovLocalities([]); return; }
    locationsApi.getLocalities(newCov.cityName)
      .then(r => setCovLocalities(r.data || []))
      .catch(() => {});
    setNewCov(p => ({ ...p, selectedLocalities: [] }));
  }, [newCov.cityName]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCovCitySearch = (value: string) => {
    setCovCitySearch(value);
    setShowCovCitySug(true);
    clearTimeout(covCityTimer.current);
    if (!value.trim()) { setCovCitySuggestions([]); setShowCovCitySug(false); return; }
    covCityTimer.current = setTimeout(async () => {
      try {
        const r = await locationsApi.getCities(value, 20);
        const d = r.data?.data || r.data || [];
        setCovCitySuggestions(Array.isArray(d) ? d : []);
      } catch {}
    }, 300);
  };

  const selectCovCity = (city: { id: string; name: string; stateName?: string; stateId?: string }) => {
    if (newCov.coverageType === 'city') {
      if (!newCov.selectedCities.some(c => c.id === city.id)) {
        setNewCov(p => ({
          ...p,
          selectedCities: [...p.selectedCities, { id: city.id, name: city.name, stateId: city.stateId, stateName: city.stateName }],
        }));
      }
      setCovCitySearch('');
      setCovCitySuggestions([]);
      setShowCovCitySug(false);
    } else {
      setCovCitySearch(city.name);
      setShowCovCitySug(false);
      setCovCitySuggestions([]);
      setNewCov(p => ({
        ...p,
        cityId: city.id,
        cityName: city.name,
        stateId: city.stateId || '',
        stateName: city.stateName || '',
        selectedLocalities: [],
      }));
    }
  };

  function coverageLabel(loc: CoverageLocation) {
    if (loc.coverageType === 'locality') return `${loc.localityName}, ${loc.cityName}, ${loc.stateName}`;
    if (loc.coverageType === 'city') return `${loc.cityName}, ${loc.stateName}`;
    return loc.stateName || 'Unknown';
  }

  async function handleAddCoverage() {
    if (!agentProfileId) return;
    const { coverageType, stateId, stateName, selectedCities, cityId, cityName, selectedLocalities } = newCov;
    if (coverageType === 'city' && selectedCities.length === 0) { setCovError('Select at least one city.'); return; }
    if (coverageType === 'locality' && !cityId) { setCovError('Select a city.'); return; }
    if (coverageType === 'locality' && selectedLocalities.length === 0) { setCovError('Select at least one locality.'); return; }
    setCovError('');
    setAddingCov(true);
    try {
      if (coverageType === 'city') {
        for (const city of selectedCities) {
          await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'city', stateId: city.stateId, stateName: city.stateName, cityId: city.id, cityName: city.name });
        }
      } else {
        for (const loc of selectedLocalities) {
          await agencyApi.adminAddCoverage({ agentProfileId, coverageType: 'locality', stateId, stateName, cityId, cityName, localityId: loc.id, localityName: loc.name });
        }
      }
      const refreshed = await agencyApi.adminListCoverage({ agentProfileId });
      setCoverageLocations(refreshed.data?.items || refreshed.data || []);
      setNewCov({ coverageType: 'city', stateId: '', stateName: '', selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] });
      setCovCitySearch('');
    } catch (e: any) {
      setCovError(e?.response?.data?.message || 'Failed to add coverage area.');
    } finally {
      setAddingCov(false);
    }
  }

  async function handleRemoveCoverage(locationId: string) {
    try {
      await agencyApi.adminRemoveCoverage(locationId);
      setCoverageLocations(prev => prev.filter(l => l.id !== locationId));
    } catch {
      setCovError('Failed to remove coverage area.');
    }
  }

  async function saveTrustSignals() {
    if (!agentProfileId) return;
    setSavingTrust(true);
    try {
      await agencyApi.adminUpdateTrustSignals(agentProfileId, {
        complaintCount:  parseInt(trustForm.complaintCount) || 0,
        avgResponseHours: trustForm.avgResponseHours ? parseInt(trustForm.avgResponseHours) : null,
      });
      setTrustSaved(true);
      setTimeout(() => setTrustSaved(false), 3000);
    } catch { /* ignore */ } finally { setSavingTrust(false); }
  }

  async function handleApprove() {
    setApproving(true);
    try {
      await adminApi.approveProfessionalDetails(id, selectedBadge);
      setAgentProfileStatus('approved');
      setForm(prev => ({ ...prev, agentTick: selectedBadge as any }));
      setApproveModal(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Approval failed');
    } finally { setApproving(false); }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      await adminApi.rejectProfessionalDetails(id, rejectReason);
      setAgentProfileStatus('rejected');
      setRejectModal(false);
      setRejectReason('');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Rejection failed');
    } finally { setRejecting(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.updateAgent(id, {
        ...form,
        agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined,
        agentFreeQuota:  parseInt(form.agentFreeQuota) || 100,
      });
      router.push('/admin/agents');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update agent');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm space-y-3">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasMeta = !!form.agentBio?.startsWith('__meta__:');

  return (
    <div className="p-6 max-w-3xl">
      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Professional Details</h3>
            <p className="text-sm text-gray-600 mb-4">Select a badge to assign upon approval. This will also update the agent's subscription plan.</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {BADGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedBadge(opt.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                    selectedBadge === opt.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent'
                  } ${opt.color}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? 'Approving…' : 'Confirm Approval'}
              </button>
              <button type="button" onClick={() => setApproveModal(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Professional Details</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (shown to agent)</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Documents are unclear, please re-upload..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {rejecting ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button type="button" onClick={() => setRejectModal(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/agents" className="text-gray-400 hover:text-gray-600 text-sm">← Agents</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
        {form.name && <span className="text-gray-400 text-sm">— {form.name}</span>}
        {form.name && (
          <Link
            href={`/agents/${form.name.toLowerCase().replace(/\s+/g, '-')}/${(form.city || 'india').toLowerCase().replace(/\s+/g, '-')}`}
            target="_blank"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            View Profile
          </Link>
        )}
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Account Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Account Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" name="name"  form={form} onChange={set} placeholder="Amit Verma"           required />
            <Field label="Email"     name="email"  form={form} onChange={set} type="email" placeholder="agent@example.com" required />
            <Field label="Phone"     name="phone"  form={form} onChange={set} placeholder="9876543210" />
            <Field label="Company"   name="company" form={form} onChange={set} placeholder="PropElite Realty" />
          </div>
        </div>

        {/* Professional Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Professional Status</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[agentProfileStatus] ?? 'bg-gray-100 text-gray-600'}`}>
              {agentProfileStatus}
            </span>
          </div>
          {agentProfileStatus === 'pending' && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              This agent has submitted professional details for review. Please verify documents below before approving.
            </p>
          )}
          {agentProfileStatus === 'rejected' && agentMeta.rejectionReason && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              <strong>Rejection reason:</strong> {agentMeta.rejectionReason}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setApproveModal(true)}
              disabled={agentProfileStatus === 'approved'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Approve + Badge
            </button>
            <button
              type="button"
              onClick={() => setRejectModal(true)}
              disabled={agentProfileStatus === 'rejected'}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Professional Info</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="RERA License"       name="agentLicense"    form={form} onChange={set} placeholder="MH-RERA-A12345" />
            <Field label="Experience (years)" name="agentExperience" form={form} onChange={set} type="number" placeholder="5" />

            {/* Agent Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Badge</label>
              <select
                value={form.agentTick}
                onChange={e => set('agentTick', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="verified">✓ Verified</option>
                <option value="bronze">◉ Bronze</option>
                <option value="silver">◈ Silver</option>
                <option value="gold">★ Gold</option>
              </select>
            </div>
          </div>

          {/* Bio: show either parsed meta or plain textarea */}
          {hasMeta ? (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-500 italic">
              Bio is stored as structured company data — see "Company Details" section below.
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.agentBio}
                onChange={e => set('agentBio', e.target.value)}
                placeholder="Short professional bio..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Company Details (parsed from __meta__) + KYC Documents */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Company Details &amp; KYC</h2>
            <span className="text-xs text-gray-400">Documents upload via backend</span>
          </div>

          {hasMeta ? (
            <div className="grid grid-cols-2 gap-4 mb-5">
              <MetaField label="Business Type"   value={agentMeta.businessType} />
              <MetaField label="Website"         value={agentMeta.website} />
              <MetaField label="RERA Number"     value={agentMeta.reraNumber} />
              <MetaField label="GST Number"      value={agentMeta.gstNumber} />
              <MetaField label="PAN"             value={agentMeta.pan} />
              <MetaField label="Specializations" value={agentMeta.specializations} />
              <MetaField label="Languages"       value={agentMeta.languages} />
              <MetaField label="Office Hours"
                value={agentMeta.officeStart && agentMeta.officeEnd
                  ? `${agentMeta.officeStart} – ${agentMeta.officeEnd}`
                  : undefined}
              />
              <MetaField label="Working Days" value={agentMeta.workingDays?.replace(/,/g, ', ')} />
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-5">Agent has not submitted company details yet.</p>
          )}

          {/* KYC Documents — admin can upload/replace regardless of meta state */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">KYC Documents</p>
          <div className="grid grid-cols-3 gap-4">
            <AdminDocUpload agentId={id} label="RERA Certificate" docType="rera" hasDoc={!!docRera} onUploaded={url => { setDocRera(url); setAgentMeta(prev => ({ ...prev, docRera: url })); }} />
            <AdminDocUpload agentId={id} label="GST Certificate"  docType="gst"  hasDoc={!!docGst}  onUploaded={url => { setDocGst(url);  setAgentMeta(prev => ({ ...prev, docGst:  url })); }} />
            <AdminDocUpload agentId={id} label="PAN Card"         docType="pan"  hasDoc={!!docPan}  onUploaded={url => { setDocPan(url);  setAgentMeta(prev => ({ ...prev, docPan:  url })); }} />
          </div>
        </div>

        {/* Agency Members */}
        {members.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Agency Members
              <span className="ml-2 text-xs font-normal text-gray-400">({members.length})</span>
            </h2>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${MEMBER_ROLE_COLOR[m.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {m.role}{m.isPrimaryOwner ? ' (owner)' : ''}
                    </span>
                    <span className="text-sm text-gray-700 font-mono text-xs">{m.userId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.joinedAt && (
                      <span className="text-xs text-gray-400">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${MEMBER_STATUS_COLOR[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Areas */}
        {agentProfileId && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">Coverage Areas</h2>
            <p className="text-xs text-gray-500 mb-4 mt-2">Manage the cities and localities this agent covers. Select a primary city to show on the agent card.</p>

            {/* Add coverage form */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 mb-4 space-y-3">
              {/* Coverage type */}
              <div className="flex gap-2">
                {(['city', 'locality'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setNewCov(p => ({ ...p, coverageType: t, selectedCities: [], cityId: '', cityName: '', selectedLocalities: [] }));
                      setCovCitySearch('');
                      setCovCitySuggestions([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                      newCov.coverageType === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {/* City search autocomplete */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {newCov.coverageType === 'city' ? 'Search & add cities' : 'Search city'}
                  </label>
                  <input
                    type="text"
                    value={covCitySearch}
                    onChange={e => handleCovCitySearch(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCovCitySug(false), 150)}
                    onFocus={() => covCitySearch && setShowCovCitySug(true)}
                    placeholder="Type city name…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {showCovCitySug && covCitySuggestions.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {covCitySuggestions.map(c => (
                        <li
                          key={c.id}
                          onMouseDown={() => selectCovCity(c)}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
                        >
                          {c.name}{c.stateName ? ` — ${c.stateName}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Selected cities chips (city type) */}
                {newCov.coverageType === 'city' && newCov.selectedCities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newCov.selectedCities.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {c.name}{c.stateName ? `, ${c.stateName}` : ''}
                        <button type="button" onClick={() => setNewCov(p => ({ ...p, selectedCities: p.selectedCities.filter(s => s.id !== c.id) }))} className="hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Localities for locality type */}
                {newCov.coverageType === 'locality' && newCov.cityId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Localities <span className="text-gray-400">(select one or more)</span></label>
                    {covLocalities.length === 0 ? (
                      <p className="text-xs text-gray-400">No localities available</p>
                    ) : (
                      <>
                        <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white">
                          {covLocalities.map(l => {
                            const checked = newCov.selectedLocalities.some(s => s.id === l.id);
                            return (
                              <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => setNewCov(p => ({
                                    ...p,
                                    selectedLocalities: checked
                                      ? p.selectedLocalities.filter(s => s.id !== l.id)
                                      : [...p.selectedLocalities, { id: l.id, name: l.name }],
                                  }))}
                                  className="accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">{l.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        {newCov.selectedLocalities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {newCov.selectedLocalities.map(loc => (
                              <span key={loc.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                {loc.name}
                                <button type="button" onClick={() => setNewCov(p => ({ ...p, selectedLocalities: p.selectedLocalities.filter(s => s.id !== loc.id) }))} className="hover:text-green-900">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {covError && <p className="text-xs text-red-600">{covError}</p>}
              <button
                type="button"
                onClick={handleAddCoverage}
                disabled={addingCov}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addingCov ? 'Adding...' : '+ Add Coverage'}
              </button>
            </div>

            {/* Existing coverage list */}
            {coverageLocations.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No coverage areas added yet.</p>
            ) : (
              <>
                {(() => {
                  const cityEntries = coverageLocations.filter(l => l.coverageType === 'city' || l.coverageType === 'locality');
                  const uniqueCities = Array.from(new Map(cityEntries.filter(l => l.cityName).map(l => [l.cityName, l])).values());
                  if (uniqueCities.length > 1) {
                    return (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <p className="text-xs font-medium text-amber-800 mb-2">Primary city (shown on agent card)</p>
                        <div className="flex flex-wrap gap-3">
                          {uniqueCities.map(loc => (
                            <label key={loc.cityName} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="primaryCity"
                                checked={form.city === loc.cityName}
                                onChange={() => {
                                  setForm(prev => ({ ...prev, city: loc.cityName || '', cityId: loc.cityId || prev.cityId }));
                                }}
                                className="accent-amber-600"
                              />
                              <span className="text-sm text-gray-700">{loc.cityName}</span>
                              {form.city === loc.cityName && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-200 text-amber-800">Primary</span>
                              )}
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-amber-600 mt-1.5">Click "Save Changes" to persist the primary city selection.</p>
                      </div>
                    );
                  }
                  return null;
                })()}
                <ul className="space-y-2">
                  {coverageLocations.map((loc) => (
                    <li key={loc.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          loc.coverageType === 'city' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>{loc.coverageType}</span>
                        <span className="text-sm text-gray-800">{coverageLabel(loc)}</span>
                        {loc.cityName && form.city === loc.cityName && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Primary</span>
                        )}
                        {loc.isActive === false && (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">Pending</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoverage(loc.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Listing Quota */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-1">Listing Quota</h2>
          <p className="text-sm text-gray-500 mb-4">
            Free listings this agent can post. Change this to grant or restrict capacity.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              value={form.agentFreeQuota}
              onChange={e => set('agentFreeQuota', e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">free listings</span>
          </div>
        </div>

        {/* Trust Signals */}
        {agentProfileId && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-1">Broker Transparency Signals</h2>
            <p className="text-sm text-gray-500 mb-4">
              These signals appear on the agent's public trust profile. Complaints are always shown — do not suppress.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complaint Count</label>
                <input
                  type="number"
                  min={0}
                  value={trustForm.complaintCount}
                  onChange={e => setTrustForm(f => ({ ...f, complaintCount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Verified complaints. Shown publicly. Cannot hide if &gt; 0.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Avg Response Time (hours)</label>
                <input
                  type="number"
                  min={0}
                  value={trustForm.avgResponseHours}
                  onChange={e => setTrustForm(f => ({ ...f, avgResponseHours: e.target.value }))}
                  placeholder="e.g. 2"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank if unknown.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={saveTrustSignals}
                disabled={savingTrust}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {savingTrust ? 'Saving…' : 'Save Trust Signals'}
              </button>
              {trustSaved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin/agents"
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
