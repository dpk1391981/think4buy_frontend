'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2, ArrowLeft, ArrowRight, ImagePlus,
  MapPin, Loader2, Building2, Home, Factory,
  Zap, Info, Camera, Eye, ChevronRight, Save, Clock,
  X, Plus,
} from 'lucide-react';
import { propertiesApi, locationsApi, propertyConfigApi, authApi, agencyApi } from '@/lib/api';
import { resolveImageUrl } from '@/lib/imageUtils';
import AuthGuard from '@/components/auth/AuthGuard';
import { detectLocation } from '@/lib/geolocation';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  updateForm, nextStep, prevStep, setStep, resetForm,
  setConfigCategories, setConfigTypes, setConfigAmenities, setConfigFields, setConfigLoading,
  toggleAmenity, setDynamicField,
  setDraftId, setAutoSaveStatus, setLastSaved,
} from '@/lib/store/slices/postPropertySlice';
import type { PropConfigField } from '@/lib/store/slices/postPropertySlice';
import {
  LISTING_TYPES, BHK_OPTIONS, FURNISHING_OPTIONS, POSSESSION_OPTIONS,
  BROKERAGE_RENT_OPTIONS, BROKERAGE_SALE_OPTIONS,
  DESCRIPTION_HINTS, generatePropertyTitle,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MediaFile { file: File; preview: string; type: 'image' | 'video'; }

// ─── Leaflet CDN loader (same pattern as MapPropertySearch) ───────────────────
function loadLeafletCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    if ((window as any).L && (window as any).L.map) return resolve((window as any).L);
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L) return reject(new Error('Leaflet failed to load'));
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      resolve(L);
    };
    script.onerror = () => reject(new Error('Failed to load Leaflet CDN'));
    document.head.appendChild(script);
  });
}

const IMPLICIT_LISTING: Record<string, 'rent' | 'buy'> = {
  buy: 'buy', rent: 'rent', pg: 'rent',
};

const STEP_META = [
  { label: 'Category',    desc: 'Type of listing'      },
  { label: 'Purpose',     desc: 'Rent or sale'         },
  { label: 'Property',    desc: 'Property type'        },
  { label: 'Location',    desc: 'Where is it?'         },
  { label: 'Title',       desc: 'Auto-generated title' },
  { label: 'Details',     desc: 'Specifications'       },
  { label: 'Amenities',   desc: "What's included"      },
  { label: 'Description', desc: 'Tell the story'       },
  { label: 'Price',       desc: 'Set your price'       },
  { label: 'Photos',      desc: 'Attract buyers'       },
];

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function SelectTile({ label, icon, selected, onClick, sub, wide = false }: {
  label: string; icon?: React.ReactNode; selected: boolean;
  onClick: () => void; sub?: string; wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-4 rounded-2xl border-2 transition-all cursor-pointer select-none text-left',
        wide ? 'p-4 w-full' : 'flex-col items-center text-center p-3.5 sm:p-5 justify-center',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50 hover:shadow-sm',
      )}
    >
      {icon && (
        <span className={cn(
          'flex-shrink-0 flex items-center justify-center rounded-xl',
          wide ? 'w-11 h-11 text-xl' : 'w-14 h-14 text-3xl',
          selected ? 'bg-primary-100' : 'bg-gray-100',
        )}>{icon}</span>
      )}
      <div className="min-w-0">
        <p className={cn('font-semibold', selected ? 'text-primary-700' : 'text-gray-800',
          wide ? 'text-sm' : 'text-sm mt-1')}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 leading-tight line-clamp-2">{sub}</p>}
      </div>
      {wide && selected && <ChevronRight className="w-4 h-4 text-primary-500 ml-auto flex-shrink-0" />}
    </button>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', maxLength, className = '' }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(
        'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
        'placeholder:text-gray-400 transition-colors',
        className
      )}
    />
  );
}

function Select({ value, onChange, children, className = '' }: any) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
        'transition-colors',
        className
      )}
    >
      {children}
    </select>
  );
}

function ChoiceButton({ label, selected, onClick, icon }: {
  label: string; selected: boolean; onClick: () => void; icon?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'px-4 py-2.5 min-h-[44px] rounded-xl border text-sm font-medium transition-all',
        selected
          ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50',
      )}>
      {icon && <span className="mr-1.5">{icon}</span>}{label}
    </button>
  );
}

function SectionCard({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-gray-50 border border-gray-200 rounded-2xl p-5', className)}>
      {title && <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{title}</p>}
      {children}
    </div>
  );
}

// ─── Dependent Rows Field (label-select + number + unit-select, repeatable) ───

interface DependentRow { label: string; value: string; unit: string; }

// ─── Parse area from carpet_area dynamic field ────────────────────────────────
// Handles both DEPENDENT [{label, value, unit}] and plain NUMBER "2000" formats
function parseAreaFromDynamic(dynamicFields: Record<string, string>): { area: number | undefined; areaUnit: string } {
  const raw = dynamicFields?.carpet_area;
  if (!raw) return { area: undefined, areaUnit: 'Sq.ft.' };
  try {
    const rows = JSON.parse(raw);
    // DEPENDENT field: [{label, value, unit}]
    if (Array.isArray(rows) && rows.length > 0 && rows[0].value) {
      return { area: Number(rows[0].value), areaUnit: rows[0].unit || 'Sq.ft.' };
    }
    // JSON.parse of "2000" returns number 2000
    if (typeof rows === 'number' && rows > 0) {
      return { area: rows, areaUnit: 'Sq.ft.' };
    }
  } catch {}
  // Plain number string (F.NUMBER field type): "2000"
  const num = Number(raw);
  if (!isNaN(num) && num > 0) return { area: num, areaUnit: 'Sq.ft.' };
  return { area: undefined, areaUnit: 'Sq.ft.' };
}

function parseDependentValue(v: string): DependentRow[] {
  if (!v) return [{ label: '', value: '', unit: '' }];
  try {
    const p = JSON.parse(v);
    if (Array.isArray(p) && p.length > 0) {
      // Migrate old rows that don't have unit key
      return p.map((r: any) => ({ label: r.label || '', value: r.value || '', unit: r.unit || '' }));
    }
  } catch {}
  return [{ label: '', value: '', unit: '' }];
}

function DependentRowsField({ labelOptions, unitOptions, value, onChange, required }: {
  labelOptions: string[];
  unitOptions: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [rows, setRows] = useState<DependentRow[]>(() => parseDependentValue(value));
  const lastExternalValue = useRef(value);

  // Sync when external value changes (edit mode pre-fill or reset)
  if (lastExternalValue.current !== value) {
    lastExternalValue.current = value;
    const parsed = parseDependentValue(value);
    const current = JSON.stringify(rows.map(r => ({ label: r.label, value: r.value, unit: r.unit })));
    const incoming = JSON.stringify(parsed.map(r => ({ label: r.label, value: r.value, unit: r.unit })));
    if (current !== incoming) setRows(parsed);
  }

  const commit = (newRows: DependentRow[]) => {
    setRows(newRows);
    const filtered = newRows.filter(r => r.label || r.value);
    onChange(filtered.length > 0 ? JSON.stringify(filtered) : '');
  };

  const updateRow = (idx: number, key: keyof DependentRow, val: string) =>
    commit(rows.map((r, i) => i === idx ? { ...r, [key]: val } : r));

  const addRow = () => commit([...rows, { label: '', value: '', unit: '' }]);

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    commit(next.length > 0 ? next : [{ label: '', value: '', unit: '' }]);
  };

  const hasUnits = unitOptions.length > 0;

  return (
    <div className="space-y-2.5">
      {rows.map((row, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          {/* Label select */}
          <select
            value={row.label}
            onChange={e => updateRow(idx, 'label', e.target.value)}
            required={required}
            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            <option value="">Select type…</option>
            {labelOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {/* Number value */}
          <input
            type="number"
            value={row.value}
            onChange={e => updateRow(idx, 'value', e.target.value)}
            placeholder="Value"
            required={required}
            className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          {/* Unit select (only if units are configured) */}
          {hasUnits && (
            <select
              value={row.unit}
              onChange={e => updateRow(idx, 'unit', e.target.value)}
              className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
            >
              <option value="">Unit…</option>
              {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
          {/* Remove row */}
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold px-1 py-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add More
      </button>
    </div>
  );
}

// ─── Dynamic Field Renderer ───────────────────────────────────────────────────

function DynamicField({ field, value, onChange }: {
  field: PropConfigField; value: string; onChange: (v: string) => void;
}) {
  const options: string[] = field.optionsJson
    ? (Array.isArray(field.optionsJson) ? field.optionsJson : JSON.parse(field.optionsJson as any))
    : [];

  return (
    <div>
      <FieldLabel required={field.isRequired}>{field.fieldLabel}</FieldLabel>
      {field.fieldType === 'text' && (
        <Input value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={field.placeholder || ''} />
      )}
      {field.fieldType === 'number' && (
        <Input type="number" value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={field.placeholder || ''} />
      )}
      {field.fieldType === 'textarea' && (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          placeholder={field.placeholder || ''}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
      )}
      {field.fieldType === 'dropdown' && (
        <Select value={value} onChange={(e: any) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      )}
      {field.fieldType === 'radio' && (
        <div className="flex flex-wrap gap-2">
          {options.map(o => (
            <ChoiceButton key={o} label={o} selected={value === o} onClick={() => onChange(o)} />
          ))}
        </div>
      )}
      {field.fieldType === 'checkbox' && options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map(o => {
            const selected = value ? value.split(',').map(s => s.trim()).includes(o) : false;
            return (
              <button key={o} type="button"
                onClick={() => {
                  const current = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
                  const next = selected ? current.filter(s => s !== o) : [...current, o];
                  onChange(next.join(','));
                }}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${selected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'}`}>
                {o}
              </button>
            );
          })}
        </div>
      )}
      {field.fieldType === 'checkbox' && options.length === 0 && (
        <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <input type="checkbox" checked={value === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-400" />
          <span className="text-sm text-gray-700">{field.placeholder || field.fieldLabel}</span>
        </label>
      )}
      {field.fieldType === 'dependent' && (
        <DependentRowsField
          labelOptions={options}
          unitOptions={field.placeholder ? field.placeholder.split('|').map(u => u.trim()).filter(Boolean) : []}
          value={value}
          onChange={onChange}
          required={field.isRequired}
        />
      )}
    </div>
  );
}

// ─── Buyer Role Selection Screen ──────────────────────────────────────────────

function BuyerRoleSelectionScreen({
  onRoleSelected,
}: {
  onRoleSelected: (role: 'owner' | 'agent', agencyData?: { agencyName: string; contactPhone?: string; address?: string }) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'agent' | null>(null);
  const [agencyName, setAgencyName] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyAddress, setAgencyAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canProceed =
    selectedRole === 'owner' ||
    (selectedRole === 'agent' && agencyName.trim().length > 0);

  async function handleConfirm() {
    if (!selectedRole || loading) return;
    setLoading(true);
    setError('');
    try {
      await onRoleSelected(
        selectedRole,
        selectedRole === 'agent'
          ? { agencyName: agencyName.trim(), contactPhone: agencyPhone.trim() || undefined, address: agencyAddress.trim() || undefined }
          : undefined,
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 flex items-start sm:items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 max-w-lg w-full p-6 sm:p-8 lg:p-10 my-4 sm:my-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">How would you like to post this property?</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            To list a property, you must be registered as an Owner or Agent.
          </p>
        </div>

        {/* Role options */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('owner')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
              selectedRole === 'owner'
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-gray-50',
            )}
          >
            <span className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
              selectedRole === 'owner' ? 'bg-primary-100' : 'bg-gray-100',
            )}>🏠</span>
            <div>
              <p className={cn('font-bold text-sm', selectedRole === 'owner' ? 'text-primary-700' : 'text-gray-800')}>
                Post as Property Owner
              </p>
              <p className="text-xs text-gray-500 mt-0.5">I own this property and want to list it directly</p>
            </div>
            {selectedRole === 'owner' && (
              <CheckCircle2 className="w-5 h-5 text-primary-500 ml-auto flex-shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('agent')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
              selectedRole === 'agent'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50',
            )}
          >
            <span className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
              selectedRole === 'agent' ? 'bg-blue-100' : 'bg-gray-100',
            )}>🏢</span>
            <div>
              <p className={cn('font-bold text-sm', selectedRole === 'agent' ? 'text-blue-700' : 'text-gray-800')}>
                Post as Real Estate Agent
              </p>
              <p className="text-xs text-gray-500 mt-0.5">I am a licensed agent listing on behalf of a client</p>
            </div>
            {selectedRole === 'agent' && (
              <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Agent: Agency details */}
        {selectedRole === 'agent' && (
          <div className="space-y-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Agency Details</p>

            <div>
              <FieldLabel required>Agency Name</FieldLabel>
              <Input
                value={agencyName}
                onChange={(e: any) => setAgencyName(e.target.value)}
                placeholder="e.g., Prestige Realty Group"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                If this agency already exists, you'll be mapped to it. Otherwise a new agency will be created pending admin approval.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Agency Phone</FieldLabel>
                <Input
                  value={agencyPhone}
                  onChange={(e: any) => setAgencyPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <FieldLabel>Agency Address</FieldLabel>
                <Input
                  value={agencyAddress}
                  onChange={(e: any) => setAgencyAddress(e.target.value)}
                  placeholder="City / Area"
                />
              </div>
            </div>
          </div>
        )}

        {/* Owner confirmation */}
        {selectedRole === 'owner' && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-semibold text-green-800 text-sm">Your role will be updated to Property Owner</p>
              <p className="text-green-700 text-xs mt-0.5">You'll be able to post unlimited owner listings. This change is saved to your account.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canProceed || loading}
          className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Setting up your account…</>
          ) : (
            'Continue to Post Property →'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar Progress (left — steps + preview) ───────────────────────────────

function SidebarProgress({ currentStep, form }: { currentStep: number; form: any }) {
  const total = STEP_META.length;
  const hasPreview = !!(form.mainCategory || form.propertyType || form.city || form.price);

  const fmt = (val: string) => {
    const n = Number(val);
    if (!n) return '';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <aside className="hidden lg:flex flex-col w-52 xl:w-60 flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        {/* Brand header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs">Post Your Property</p>
              <p className="text-primary-200 text-[10px]">Think4BuySale</p>
            </div>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / total) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-primary-200 mt-1.5">Step {currentStep + 1} of {total}</p>
        </div>

        {/* Steps list */}
        <nav className="space-y-0.5">
          {STEP_META.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            if (i === 1 && form.mainCategory && IMPLICIT_LISTING[form.mainCategory]) return null;
            return (
              <div key={i} className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all',
                isActive ? 'bg-primary-50' : isDone ? 'opacity-100' : 'opacity-40'
              )}>
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all',
                  isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isActive ? 'text-primary-700' : isDone ? 'text-gray-700' : 'text-gray-400')}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Live Preview card */}
        {hasPreview && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Card header */}
            <div className="bg-gray-50 border-b border-gray-100 px-3.5 py-2.5 flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Live Preview</p>
            </div>
            <div className="p-3.5 space-y-2">
              {/* Category + type badges */}
              {(form.mainCategory || form.propertyType) && (
                <div className="flex flex-wrap gap-1">
                  {form.mainCategory && (
                    <span className="text-[10px] font-semibold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                      {form.mainCategory.replace(/_/g, ' ')}
                    </span>
                  )}
                  {form.listingType && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                      {form.listingType}
                    </span>
                  )}
                  {form.propertyType && (
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {form.propertyType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              {form.autoTitle && (
                <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">{form.autoTitle}</p>
              )}

              {/* Location */}
              {form.city && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-gray-500 leading-tight">
                    {[form.locality, form.city, form.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Specs row */}
              {(form.bedrooms || parseAreaFromDynamic(form.dynamicFields).area || form.furnishingStatus) && (
                <div className="flex flex-wrap gap-1">
                  {form.bedrooms && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{form.bedrooms} BHK</span>
                  )}
                  {parseAreaFromDynamic(form.dynamicFields).area && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{parseAreaFromDynamic(form.dynamicFields).area} {parseAreaFromDynamic(form.dynamicFields).areaUnit}</span>
                  )}
                  {form.furnishingStatus && form.furnishingStatus !== 'unfurnished' && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium capitalize">
                      {form.furnishingStatus.replace(/_/g, ' ')}
                    </span>
                  )}
                  {form.floor && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Floor {form.floor}</span>
                  )}
                </div>
              )}

              {/* Amenities count */}
              {form.amenityIds?.length > 0 && (
                <p className="text-[10px] text-primary-600 font-semibold">
                  ✓ {form.amenityIds.length} amenit{form.amenityIds.length === 1 ? 'y' : 'ies'} selected
                </p>
              )}

              {/* Price */}
              {form.price && (
                <div className="pt-1.5 border-t border-gray-100">
                  <p className="text-base font-black text-primary-600">
                    {fmt(form.price)}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      {(form.listingType === 'rent' || form.mainCategory === 'rent' || form.mainCategory === 'pg') ? '/mo' : ''}
                    </span>
                  </p>
                  {form.userType === 'agent' && form.brokerage && form.brokerage !== 'none' && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Brokerage: {form.brokerage}</p>
                  )}
                </div>
              )}

              {/* Listed by */}
              {form.userType && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-sm">{form.userType === 'agent' ? '🏢' : '🏠'}</span>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {form.userType === 'agent' ? (form.agencyName || 'Agent') : 'Direct from Owner'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Right Panel (drafts + pending + save draft) ──────────────────────────────

function RightPanel({
  onSaveDraft,
  savingDraft,
  canSaveDraft,
  autoSaveStatus,
  lastSaved,
  userDrafts,
  userPending,
  activeDraftId,
  isEditMode,
  editingProperty,
}: {
  onSaveDraft: () => void;
  savingDraft: boolean;
  canSaveDraft: boolean;
  autoSaveStatus: string;
  lastSaved: number | null;
  userDrafts: any[];
  userPending: any[];
  activeDraftId: string | null;
  isEditMode: boolean;
  editingProperty?: { title?: string; city?: string; locality?: string; approvalStatus?: string } | null;
}) {
  const sinceLastSave = lastSaved ? Math.round((Date.now() - lastSaved) / 60000) : null;

  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0">
      <div className="sticky top-24 space-y-4">

        {/* Edit mode: currently editing banner */}
        {isEditMode && editingProperty && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">Currently Editing</p>
              <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                {editingProperty.title || 'Property'}
              </p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {editingProperty.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">
                    {[editingProperty.locality, editingProperty.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  editingProperty.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                  editingProperty.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {editingProperty.approvalStatus === 'approved' ? '✓ Approved' :
                   editingProperty.approvalStatus === 'pending' ? '⏳ Pending Review' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Save Draft CTA (new property, steps ≥ 6 covered) */}
        {!isEditMode && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={savingDraft || !canSaveDraft}
              title={!canSaveDraft ? 'Complete at least 6 steps to save a draft' : undefined}
              className={cn(
                'w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all text-sm',
                canSaveDraft
                  ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                savingDraft && 'opacity-60 cursor-not-allowed'
              )}
            >
              {savingDraft ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving draft…</>
              ) : (
                <><Save className="w-4 h-4" /> Save Draft & Exit</>
              )}
            </button>
            {!canSaveDraft && (
              <p className="mt-2 text-center text-[10px] text-gray-400">Complete 6 steps to enable drafts</p>
            )}
            {/* Auto-save indicator */}
            {canSaveDraft && (
              <div className="mt-2.5 flex items-center justify-center gap-1.5 min-h-[16px]">
                {autoSaveStatus === 'saved' && sinceLastSave !== null && (
                  <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-saved {sinceLastSave < 1 ? 'just now' : `${sinceLastSave}m ago`}
                  </span>
                )}
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving…
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-[11px] text-red-400">Auto-save failed</span>
                )}
                {autoSaveStatus === 'idle' && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" /> Auto-saves every 30s
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Drafted Properties */}
        {userDrafts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Save className="w-3 h-3" /> Drafts
              </p>
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{userDrafts.length}</span>
            </div>
            <div className="space-y-2">
              {userDrafts.slice(0, 5).map((draft: any) => {
                const isActive = draft.id === activeDraftId;
                return (
                  <a key={draft.id} href={`/post-property?edit=${draft.id}`}
                    className={cn(
                      'flex items-start gap-2.5 p-2.5 rounded-xl border transition-all',
                      isActive
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-100 hover:border-amber-200 hover:bg-amber-50/40'
                    )}>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm',
                      isActive ? 'bg-amber-100' : 'bg-gray-100')}>
                      ✏️
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                        {draft.title || 'Untitled Draft'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {[draft.city, draft.locality].filter(Boolean).join(' · ') || 'No location set'}
                      </p>
                    </div>
                    {isActive && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full flex-shrink-0 self-center">
                        Current
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
            {userDrafts.length > 5 && (
              <a href="/my-listings" className="block text-center text-xs text-gray-400 hover:text-amber-600 mt-2 pt-2 border-t border-gray-100 font-medium transition-colors">
                +{userDrafts.length - 5} more drafts →
              </a>
            )}
          </div>
        )}

        {/* Pending Review */}
        {userPending.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Pending Review
              </p>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{userPending.length}</span>
            </div>
            <div className="space-y-2">
              {userPending.slice(0, 5).map((prop: any) => (
                <div key={prop.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-blue-100 bg-blue-50/40">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm">
                    🕒
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{prop.title}</p>
                    <p className="text-[10px] text-blue-600 mt-0.5 font-medium">Awaiting admin approval</p>
                  </div>
                </div>
              ))}
            </div>
            {userPending.length > 5 && (
              <a href="/my-listings" className="block text-center text-xs text-gray-400 hover:text-blue-600 mt-2 pt-2 border-t border-gray-100 font-medium transition-colors">
                View all →
              </a>
            )}
          </div>
        )}

        {/* Empty state */}
        {userDrafts.length === 0 && userPending.length === 0 && !isEditMode && (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2.5">
              <Building2 className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-400">No listings yet</p>
            <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">Your drafts & pending properties will appear here</p>
          </div>
        )}

      </div>
    </aside>
  );
}

// ─── Mobile Progress Bar ──────────────────────────────────────────────────────

function MobileProgress({ currentStep }: { currentStep: number }) {
  const total = STEP_META.length;
  const step = STEP_META[currentStep] || STEP_META[0];
  return (
    <div className="lg:hidden bg-white border-b border-gray-100 px-4 pt-3 pb-2.5 sticky top-14 md:top-16 z-20">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">{step.label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{step.desc}</p>
        </div>
        <span className="ml-3 flex-shrink-0 text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
          {currentStep + 1} / {total}
        </span>
      </div>
      {/* Step dots */}
      <div className="flex items-center gap-0.5">
        {STEP_META.map((_, i) => (
          <div key={i} className={cn(
            'h-1 rounded-full transition-all duration-300',
            i < currentStep
              ? 'bg-green-400 flex-1'
              : i === currentStep
              ? 'bg-primary-600 flex-[2]'
              : 'bg-gray-200 flex-1'
          )} />
        ))}
      </div>
    </div>
  );
}

// ─── Step: User Type ─────────────────────────────────────────────────────────

function Step0UserType({ form, dispatch }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">How are you listing?</h2>
        <p className="text-gray-500 text-sm mt-1">This helps buyers know who to contact directly</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectTile label="Owner" icon="🏠" sub="Listing my own property directly"
          selected={form.userType === 'owner'}
          onClick={() => dispatch(updateForm({ userType: 'owner', agencyName: '' }))} />
        <SelectTile label="Agent / Broker" icon="🏢" sub="Listing on behalf of a client"
          selected={form.userType === 'agent'}
          onClick={() => dispatch(updateForm({ userType: 'agent' }))} />
      </div>

      {form.userType === 'owner' && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Listing as Property Owner</p>
            <p className="text-green-700 text-xs mt-0.5">Your listing will show <strong>Direct from Owner</strong>. Buyers can contact you with zero brokerage.</p>
          </div>
        </div>
      )}

      {form.userType === 'agent' && (
        <div className="space-y-4">
          <div>
            <FieldLabel required>Agency / Company Name</FieldLabel>
            <Input value={form.agencyName || ''} onChange={(e: any) => dispatch(updateForm({ agencyName: e.target.value }))}
              placeholder="e.g., Rahul Properties, Century Real Estate" />
            <p className="text-xs text-gray-400 mt-1.5">Shown on your listing as the listing agency</p>
          </div>
          {form.agencyName?.trim() && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <span className="text-2xl">🏢</span>
              <div>
                <p className="font-semibold text-blue-800 text-sm">Listing via {form.agencyName.trim()}</p>
                <p className="text-blue-700 text-xs mt-0.5">Buyers will see your agency name and contact you directly.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step: Main Category ─────────────────────────────────────────────────────

function Step1MainCategory({ form, dispatch, config }: any) {
  const { categories, loadingCategories } = config;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Category</h2>
        <p className="text-gray-500 text-sm mt-1">What are you listing?</p>
      </div>
      {loadingCategories ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No categories configured. Please contact admin.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
          {categories.map((cat: any) => (
            <SelectTile key={cat.id} label={cat.name} icon={cat.icon || '🏠'} sub={cat.description || ''}
              selected={form.categoryId === cat.id}
              onClick={() => dispatch(updateForm({
                categoryId: cat.id, mainCategory: cat.slug,
                propertyType: '', typeId: '', amenityIds: [], dynamicFields: {},
              }))} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step: Listing Type ──────────────────────────────────────────────────────

function Step2ListingType({ form, dispatch }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Listing Purpose</h2>
        <p className="text-gray-500 text-sm mt-1">Are you selling or renting this property?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LISTING_TYPES.map((lt) => (
          <SelectTile key={lt.value} label={lt.label} icon={lt.icon} sub={lt.desc}
            selected={form.listingType === lt.value}
            onClick={() => dispatch(updateForm({ listingType: lt.value as any }))} />
        ))}
      </div>
    </div>
  );
}

// ─── Step: Property Type ─────────────────────────────────────────────────────

function Step3PropertyType({ form, dispatch, config }: any) {
  const { types, loadingTypes } = config;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Property Type</h2>
        <p className="text-gray-500 text-sm mt-1">Select the specific type of property you are listing</p>
      </div>
      {loadingTypes ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : types.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No property types configured for this category.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {types.map((t: any) => (
            <SelectTile key={t.id} label={t.name} icon={t.icon || '🏢'}
              selected={form.typeId === t.id}
              onClick={() => dispatch(updateForm({
                typeId: t.id, propertyType: t.slug,
                bedrooms: '', amenityIds: [], dynamicFields: {},
              }))} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step: Location ──────────────────────────────────────────────────────────

function Step4Location({ form, dispatch }: any) {
  const [cities, setCities] = useState<any[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [localities, setLocalities] = useState<any[]>([]);
  const [localitiesLoading, setLocalitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState(form.city || '');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [localitySearch, setLocalitySearch] = useState(form.locality || '');
  const [showLocalityList, setShowLocalityList] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'found' | 'denied' | 'error'>('idle');
  const isAgent = form.userType === 'agent';
  const isOwner = !isAgent; // owner / seller
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const formRef = useRef(form);
  const cityRef = useRef<HTMLDivElement>(null);
  const localityRef = useRef<HTMLDivElement>(null);
  const cityDebounceRef = useRef<NodeJS.Timeout>();
  const localityDebounceRef = useRef<NodeJS.Timeout>();

  // Keep formRef current so async callbacks always read the latest values
  formRef.current = form;

  // ── Async city search — debounced ─────────────────────────────────────────
  const fetchCities = (search: string) => {
    setCitiesLoading(true);
    locationsApi.getCities(search || undefined, 50).then(r => {
      const d = r.data;
      setCities(Array.isArray(d) ? d : d?.items || []);
    }).catch(() => setCities([])).finally(() => setCitiesLoading(false));
  };

  // Load top cities on mount
  useEffect(() => { fetchCities(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load localities when city changes ─────────────────────────────────────
  useEffect(() => {
    if (!form.city) { setLocalities([]); setLocalitySearch(''); setShowLocalityList(false); return; }
    setLocalitiesLoading(true);
    // In edit mode (form.localityId already set), preserve the locality text until we know
    // whether it exists in the fetched list. Only clear for a fresh city pick.
    if (!form.localityId) setLocalitySearch('');
    locationsApi.getLocalities(form.city).then(r => {
      const d = r.data;
      const locs = Array.isArray(d) ? d : [];
      setLocalities(locs);
      if (form.localityId) {
        const found = locs.find((l: any) => l.id === form.localityId);
        if (found) {
          // Locality confirmed in DB — show its name in the input
          setLocalitySearch(found.locality || found.city || form.locality || '');
        } else {
          // Not in initial batch (pagination) — preserve the pre-filled locality data
          setLocalitySearch(form.locality || '');
        }
      }
    }).catch(() => setLocalities([])).finally(() => setLocalitiesLoading(false));
  }, [form.city]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── Close city & locality dropdowns on outside click ─────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityDropdown(false);
      if (localityRef.current && !localityRef.current.contains(e.target as Node)) setShowLocalityList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Initialize Leaflet map (owner only) ────────────────────────────────────
  useEffect(() => {
    if (!isOwner) return; // agents don't see map
    let destroyed = false;
    let sizeTimer: ReturnType<typeof setTimeout>;

    loadLeafletCDN().then((L) => {
      if (destroyed || !mapContainerRef.current || mapInstanceRef.current) return;

      // Use formRef.current to get the latest coords — avoids stale closure
      // (the promise may resolve after the Redux state has been populated with edit data)
      const lat = formRef.current.latitude || 20.5937;
      const lng = formRef.current.longitude || 78.9629;
      const zoom = formRef.current.latitude ? 15 : 5;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([lat, lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on('dragend', (e: any) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        dispatch(updateForm({ latitude: parseFloat(newLat.toFixed(6)), longitude: parseFloat(newLng.toFixed(6)) }));
      });

      map.on('click', (e: any) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        marker.setLatLng([cLat, cLng]);
        dispatch(updateForm({ latitude: parseFloat(cLat.toFixed(6)), longitude: parseFloat(cLng.toFixed(6)) }));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force tile re-render after the container is fully painted in the DOM
      // Also re-sync position in case coords arrived after effect setup
      sizeTimer = setTimeout(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.invalidateSize();
        const curLat = formRef.current.latitude;
        const curLng = formRef.current.longitude;
        if (curLat && curLng) {
          markerRef.current?.setLatLng([curLat, curLng]);
          mapInstanceRef.current.setView([curLat, curLng], 15);
        }
      }, 300);
    }).catch(() => {});

    return () => {
      destroyed = true;
      clearTimeout(sizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync marker when lat/lng changes ──────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (form.latitude && form.longitude) {
      markerRef.current.setLatLng([form.latitude, form.longitude]);
      mapInstanceRef.current.setView([form.latitude, form.longitude], 14, { animate: true });
    }
  }, [form.latitude, form.longitude]);

  // ── Auto-detect GPS (fills city + locality) ───────────────────────────────
  const handleDetect = async () => {
    setGeoStatus('detecting');
    try {
      const loc = await detectLocation();
      if (isOwner) dispatch(updateForm({ latitude: loc.lat, longitude: loc.lng }));
      if (loc.city && cities.length > 0) {
        const normalize = (s: string) => (s || '').toLowerCase().trim();
        let cm = cities.find((c: any) => c.name && normalize(c.name) === normalize(loc.city));
        if (!cm) cm = cities.find((c: any) => c.name && (normalize(loc.city).includes(normalize(c.name)) || normalize(c.name).includes(normalize(loc.city))));
        if (cm) {
          setCitySearch(cm.name);
          dispatch(updateForm({ cityId: cm.id, city: cm.name, stateId: cm.stateId || '', state: cm.stateName || '', localityId: '', locality: '', pincode: '' }));
        } else if (loc.city) {
          setCitySearch(loc.city);
          dispatch(updateForm({ city: loc.city, cityId: '', localityId: '', locality: '' }));
        }
      }
      if (loc.locality && !form.locality) {
        dispatch(updateForm({ locality: loc.locality }));
        setLocalitySearch(loc.locality);
      }
      setGeoStatus('found');
    } catch (err: any) {
      setGeoStatus(err?.code === 1 ? 'denied' : 'error');
    }
  };

  // ── City async search with debounce ──────────────────────────────────────
  const handleCityInputChange = (val: string) => {
    setCitySearch(val);
    setShowCityDropdown(true);
    if (!val) dispatch(updateForm({ city: '', cityId: '', localityId: '', locality: '', pincode: '' }));
    clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => fetchCities(val), 300);
  };

  // Filtered locality list (client-side first, server-side fallback via effect above)
  const filteredLocalities = localitySearch
    ? localities.filter(l => (l.locality || l.city || '').toLowerCase().includes(localitySearch.toLowerCase()))
    : localities;

  const handleCityPick = (c: any) => {
    setCitySearch(c.name);
    setShowCityDropdown(false);
    setLocalitySearch('');
    setShowLocalityList(false);
    dispatch(updateForm({ cityId: c.id, city: c.name, stateId: c.stateId || '', state: c.stateName || '', localityId: '', locality: '', pincode: '', latitude: null, longitude: null }));
  };

  // ── When a DB locality is selected ───────────────────────────────────────
  const handleLocalitySelect = (locId: string) => {
    if (!locId) {
      setLocalitySearch('');
      setShowLocalityList(false);
      dispatch(updateForm({ localityId: '', locality: '', pincode: '', latitude: null, longitude: null }));
      return;
    }
    const loc = localities.find((l: any) => l.id === locId);
    if (!loc) return;
    const name = loc.locality || loc.city;
    setLocalitySearch(name);
    setShowLocalityList(false);
    dispatch(updateForm({
      localityId: loc.id,
      locality: name,
      pincode: loc.pincode || form.pincode,
      latitude: loc.latitude ? parseFloat(loc.latitude) : form.latitude,
      longitude: loc.longitude ? parseFloat(loc.longitude) : form.longitude,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Property Location</h2>
        <p className="text-gray-500 text-sm mt-1">
          {isAgent
            ? 'Select city and locality — exact address is not required for agents.'
            : 'Help buyers find your property with city, locality and address.'}
        </p>
      </div>

      {/* Auto-detect button */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={handleDetect} disabled={geoStatus === 'detecting'}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
            geoStatus === 'detecting' ? 'bg-blue-100 text-blue-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          )}>
          {geoStatus === 'detecting' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Detecting…</> : <><MapPin className="w-3.5 h-3.5" />Auto-detect location</>}
        </button>
        {geoStatus === 'found' && <span className="text-xs text-green-600 font-medium">✓ Location detected</span>}
        {geoStatus === 'denied' && <span className="text-xs text-orange-500">Location permission denied — select manually.</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* City — searchable autocomplete */}
        <div ref={cityRef} className="relative sm:col-span-2 sm:max-w-sm">
          <FieldLabel required>City</FieldLabel>
          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Search city (e.g., Delhi, Mumbai…)"
              className={cn(
                'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
                'placeholder:text-gray-400 transition-colors'
              )}
            />
            {form.cityId && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-semibold">✓</span>
            )}
          </div>
          {showCityDropdown && (cities.length > 0 || citiesLoading) && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {citiesLoading && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching cities…
                </div>
              )}
              {!citiesLoading && cities.length === 0 && citySearch && (
                <div className="px-3 py-2.5 text-xs text-gray-400">No cities found for "{citySearch}"</div>
              )}
              {cities.map((c: any) => (
                <button key={c.id} type="button"
                  onClick={() => handleCityPick(c)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary-50 text-left transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {c.name}
                  {c.stateName && <span className="text-xs text-gray-400 ml-auto">{c.stateName}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locality — searchable dropdown (like city) */}
        <div ref={localityRef} className="sm:col-span-2 sm:max-w-sm relative">
          <FieldLabel required>Area / Locality</FieldLabel>
          <div className="relative">
            <input
              type="text"
              value={localitySearch}
              onChange={(e) => {
                const v = e.target.value;
                setLocalitySearch(v);
                setShowLocalityList(true);
                if (!v) dispatch(updateForm({ localityId: '', locality: '', pincode: '' }));
                clearTimeout(localityDebounceRef.current);
                if (v && form.city) {
                  const matched = localities.filter(l =>
                    (l.locality || l.city || '').toLowerCase().includes(v.toLowerCase())
                  );
                  if (matched.length === 0) {
                    localityDebounceRef.current = setTimeout(() => {
                      locationsApi.getLocalities(form.city, undefined, v).then(r => {
                        const d = r.data;
                        if (Array.isArray(d) && d.length > 0) setLocalities(d);
                      }).catch(() => {});
                    }, 300);
                  }
                }
              }}
              onFocus={() => { if (form.city) setShowLocalityList(true); }}
              placeholder={
                !form.city ? 'Select city first' :
                localitiesLoading ? 'Loading localities…' :
                `Search area in ${form.city}…`
              }
              disabled={!form.city}
              className={cn(
                'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
                'placeholder:text-gray-400 disabled:opacity-50 transition-colors'
              )}
            />
            {localitiesLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
            {!localitiesLoading && form.localityId && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-semibold">✓</span>
            )}
            {!localitiesLoading && localitySearch && !form.localityId && (
              <button type="button"
                onClick={() => { setLocalitySearch(''); setShowLocalityList(false); dispatch(updateForm({ localityId: '', locality: '', pincode: '' })); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {showLocalityList && (localities.length > 0 || localitiesLoading) && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {localitiesLoading && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading localities…
                </div>
              )}
              {!localitiesLoading && filteredLocalities.length === 0 && (
                <div className="px-3 py-2.5 text-xs text-gray-400">
                  {localitySearch ? `No localities found for "${localitySearch}"` : 'No localities available'}
                </div>
              )}
              {filteredLocalities.map((l: any) => (
                <button key={l.id} type="button"
                  onClick={() => handleLocalitySelect(l.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:bg-primary-50',
                    form.localityId === l.id ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                  )}>
                  <span>{l.locality || l.city}</span>
                </button>
              ))}
            </div>
          )}

          {form.localityId && form.pincode && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <span>✓</span>
              <span>Auto-filled from location data{form.pincode ? ` — Pincode: ${form.pincode}` : ''}</span>
            </p>
          )}
        </div>

        {/* Pincode */}
        <div>
          <FieldLabel>Pincode</FieldLabel>
          <Input value={form.pincode}
            onChange={(e: any) => dispatch(updateForm({ pincode: e.target.value.replace(/\D/g, '') }))}
            placeholder="110001" maxLength={6} />
        </div>

        {/* Society — always visible */}
        <div>
          <FieldLabel>{isAgent ? 'Society / Complex (optional)' : 'Society / Building'}</FieldLabel>
          <Input value={form.society || ''}
            onChange={(e: any) => dispatch(updateForm({ society: e.target.value }))}
            placeholder="e.g., Prestige Shantiniketan" />
        </div>

        {/* Full Address — Owner only */}
        {isOwner && (
          <div className="sm:col-span-2">
            <FieldLabel required>Full Address</FieldLabel>
            <Input value={form.address || ''}
              onChange={(e: any) => dispatch(updateForm({ address: e.target.value }))}
              placeholder="House / Flat no., Street, Area, City" />
            <p className="text-xs text-gray-400 mt-1">Exact address is shown to serious buyers after inquiry.</p>
          </div>
        )}
      </div>

      {/* GPS Map Picker — Owner only */}
      {isOwner && (
        <SectionCard title="Pin Location on Map">
          <p className="text-xs text-gray-500 mb-3">
            {form.localityId
              ? 'Map auto-positioned from selected locality. Click or drag to fine-tune.'
              : 'Click on the map or drag the pin to set the exact property location.'}
          </p>
          <div ref={mapContainerRef} className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 320, zIndex: 0 }} />
          {(form.latitude || form.longitude) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>
                {form.localityId ? '✓ From locality — ' : geoStatus === 'found' ? '✓ Detected — ' : 'Pinned at '}
                <span className="font-mono text-gray-700">{parseFloat(String(form.latitude)).toFixed(6)}, {parseFloat(String(form.longitude)).toFixed(6)}</span>
              </span>
            </div>
          )}
        </SectionCard>
      )}

      {/* Agent note */}
      {isAgent && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>As an agent, only city and locality are required. Exact address and map pin are not needed — buyers will contact you directly.</span>
        </div>
      )}
    </div>
  );
}

// ─── Step: Auto Title ────────────────────────────────────────────────────────

function Step5AutoTitle({ form, dispatch }: any) {
  const autoTitle = generatePropertyTitle({
    category: form.mainCategory,
    listingType: form.listingType || (form.mainCategory === 'pg' || form.mainCategory === 'rent' ? 'rent' : 'buy'),
    propertyType: form.propertyType, bedrooms: form.bedrooms,
    city: form.city, locality: form.locality,
  });

  useEffect(() => { dispatch(updateForm({ autoTitle })); }, [autoTitle]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Auto-Generated Title</h2>
        <p className="text-gray-500 text-sm mt-1">Crafted for SEO — customize if needed</p>
      </div>
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Generated Title</p>
            <p className="text-xl font-bold text-primary-900 leading-snug">{form.autoTitle || autoTitle}</p>
            <p className="text-xs text-primary-500 mt-2">
              URL: /{(form.autoTitle || autoTitle).toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-')}-{Date.now().toString(36)}
            </p>
          </div>
        </div>
      </div>
      <div>
        <FieldLabel>Customize Title (optional)</FieldLabel>
        <Input value={form.autoTitle || autoTitle}
          onChange={(e: any) => dispatch(updateForm({ autoTitle: e.target.value }))}
          placeholder={autoTitle} maxLength={200} />
        <p className="text-xs text-gray-400 mt-1.5">Leave blank to use the auto-generated title above</p>
      </div>
    </div>
  );
}

// ─── Step: Details ───────────────────────────────────────────────────────────

function Step6Details({ form, dispatch, config }: any) {
  const { fields, loadingFields } = config;
  const cat = form.mainCategory;
  const isResidential = ['buy', 'rent', 'pg', 'builder_project'].includes(cat);
  const isIndustrial = cat === 'industrial';
  const showBedrooms = isResidential && !['plot', 'land', 'pg', 'co_living', 'farm_house'].includes(form.propertyType);

  // Split dynamic fields: dependent/units fields first (TOP), rest below industrial
  const dependentFields = fields.filter((f: PropConfigField) => f.fieldType === 'dependent');
  const regularFields   = fields.filter((f: PropConfigField) => f.fieldType !== 'dependent');

  const renderField = (field: PropConfigField) => (
    <div
      key={field.id}
      className={['textarea', 'radio', 'checkbox', 'dependent'].includes(field.fieldType) ? 'sm:col-span-2' : ''}
    >
      <DynamicField
        field={field}
        value={form.dynamicFields[field.fieldName] || ''}
        onChange={(v) => dispatch(setDynamicField({ key: field.fieldName, value: v }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
        <p className="text-gray-500 text-sm mt-1">Specific measurements and specifications</p>
      </div>

      {/* ① Dynamic dependent fields — ALWAYS AT TOP (units, carpet area, etc.)
           Required when parent field is required */}
      {loadingFields ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading additional fields…
        </div>
      ) : dependentFields.length > 0 && (
        <div className="border border-primary-100 bg-primary-50/30 rounded-2xl p-5">
          <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4">Unit / Area Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {dependentFields.map(renderField)}
          </div>
        </div>
      )}

      {/* ② BHK */}
      {showBedrooms && (
        <div>
          <FieldLabel required>BHK Configuration</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {BHK_OPTIONS.map(opt => (
              <ChoiceButton key={opt.value} label={opt.label} selected={form.bedrooms === opt.value}
                onClick={() => dispatch(updateForm({ bedrooms: opt.value }))} />
            ))}
          </div>
        </div>
      )}

      {/* ③ Industrial specifics — MIDDLE (after units, before residential extras) */}
      {isIndustrial && (
        <SectionCard title="Industrial Specifications">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Ceiling Height (ft)</FieldLabel>
              <Input type="number" value={form.industrialHeight}
                onChange={(e: any) => dispatch(updateForm({ industrialHeight: e.target.value }))}
                placeholder="25" />
            </div>
            <div>
              <FieldLabel>Power Load (KW/KVA)</FieldLabel>
              <Input value={form.industrialPowerLoad}
                onChange={(e: any) => dispatch(updateForm({ industrialPowerLoad: e.target.value }))}
                placeholder="100KW" />
            </div>
          </div>
          <div className="flex gap-6">
            {[{ key: 'hasDock', label: 'Loading Dock' }, { key: 'hasRamp', label: 'Truck Ramp' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form[key]}
                  onChange={(e) => dispatch(updateForm({ [key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ④ Residential extras */}
      {isResidential && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <FieldLabel>Bathrooms</FieldLabel>
            <Select value={form.bathrooms} onChange={(e: any) => dispatch(updateForm({ bathrooms: e.target.value }))}>
              <option value="">Select</option>
              {['1','2','3','4','5'].map(n => <option key={n} value={n}>{n} Bath</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel>Floor Number</FieldLabel>
            <Input type="number" value={form.floor}
              onChange={(e: any) => dispatch(updateForm({ floor: e.target.value }))} placeholder="3" />
          </div>

          {!['plot', 'land'].includes(form.propertyType) && (
            <div className="sm:col-span-2">
              <FieldLabel>Furnishing Status</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {FURNISHING_OPTIONS.map(opt => (
                  <ChoiceButton key={opt.value} label={opt.label} icon={opt.icon}
                    selected={form.furnishingStatus === opt.value}
                    onClick={() => dispatch(updateForm({ furnishingStatus: opt.value }))} />
                ))}
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <FieldLabel>Possession Status</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {POSSESSION_OPTIONS.map(opt => (
                <ChoiceButton key={opt.value} label={opt.label}
                  selected={form.possessionStatus === opt.value}
                  onClick={() => dispatch(updateForm({ possessionStatus: opt.value }))} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ⑤ Other dynamic fields (non-dependent) */}
      {!loadingFields && regularFields.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Additional Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {regularFields.map(renderField)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step: Amenities ─────────────────────────────────────────────────────────

function Step7Amenities({ form, dispatch, config }: any) {
  const { amenities, loadingAmenities } = config;
  const selected: string[] = form.amenityIds;

  if (loadingAmenities) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Amenities</h2>
          <p className="text-gray-500 text-sm mt-1">Select available amenities</p>
        </div>
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      </div>
    );
  }

  if (amenities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Amenities</h2>
          <p className="text-gray-500 text-sm mt-1">No amenities configured for this property type — you can skip this step.</p>
        </div>
        <div className="text-center py-10 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400 text-sm">
          No amenities to select. Click Continue to proceed.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Amenities</h2>
          <p className="text-gray-500 text-sm mt-1">Select all amenities available in your property</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
          {selected.length > 0 && (
            <button type="button" onClick={() => dispatch(updateForm({ amenityIds: [] }))}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {amenities.map((amenity: any) => {
          const isOn = selected.includes(amenity.id);
          return (
            <button key={amenity.id} type="button"
              onClick={() => dispatch(toggleAmenity(amenity.id))}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                isOn
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50',
              )}>
              <div className={cn('w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all',
                isOn ? 'bg-primary-500' : 'bg-gray-200')}>
                {isOn && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="leading-tight line-clamp-2">
                {amenity.icon && <span className="mr-1">{amenity.icon}</span>}
                {amenity.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step: Description ───────────────────────────────────────────────────────

function Step8Description({ form, dispatch }: any) {
  const hints = form.mainCategory === 'industrial' ? DESCRIPTION_HINTS.industrial
    : form.mainCategory === 'commercial' ? DESCRIPTION_HINTS.commercial
    : form.mainCategory === 'pg' ? DESCRIPTION_HINTS.pg
    : DESCRIPTION_HINTS.residential;

  const autoSuggest = () => {
    const title = form.autoTitle || generatePropertyTitle({
      category: form.mainCategory, listingType: form.listingType || 'rent',
      propertyType: form.propertyType, bedrooms: form.bedrooms, city: form.city, locality: form.locality,
    });
    const { area: dynArea, areaUnit: dynAreaUnit } = parseAreaFromDynamic(form.dynamicFields);
    const locationStr = form.locality && form.city
      ? `${form.locality}, ${form.city}`
      : form.locality || form.city || '';
    const listingWord = form.listingType === 'rent' ? 'rent' : 'sale';
    const sentences: string[] = [];
    sentences.push(`${title} is available for ${listingWord}${locationStr ? ` in ${locationStr}` : ''}.`);
    if (dynArea) {
      sentences.push(`The property spans ${dynArea} ${dynAreaUnit}${form.bedrooms ? ` with ${form.bedrooms} bedrooms` : ''}.`);
    } else if (form.bedrooms) {
      sentences.push(`This ${form.bedrooms} BHK property offers comfortable living spaces.`);
    }
    if (form.city) {
      sentences.push(`Located in ${form.city}${form.locality ? ` (${form.locality})` : ''}, it provides excellent connectivity to major hubs and local amenities.`);
    }
    sentences.push('Contact us today to schedule a site visit and get more details.');
    dispatch(updateForm({ description: sentences.join(' ') }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Property Description</h2>
        <p className="text-gray-500 text-sm mt-1">A great description attracts more serious buyers</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" /> Writing Tips
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {(hints || []).map((hint: string, i: number) => (
            <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">→</span>{hint}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>Description</FieldLabel>
          <button type="button" onClick={autoSuggest}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Auto-generate
          </button>
        </div>
        <textarea value={form.description}
          onChange={(e) => dispatch(updateForm({ description: e.target.value }))}
          rows={7}
          placeholder="Describe your property — location advantages, nearby landmarks, connectivity, unique features, amenities…"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none leading-relaxed"
          maxLength={2000} />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>Min 50 characters recommended</span>
          <span className={cn((form.description || '').length > 1800 ? 'text-orange-500' : '')}>
            {(form.description || '').length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Step: Price ─────────────────────────────────────────────────────────────

function Step9Price({ form, dispatch }: any) {
  const isRent = form.listingType === 'rent' || form.mainCategory === 'pg' || form.mainCategory === 'rent';
  const isAgent = form.userType === 'agent';
  const brokerageOpts = isRent ? BROKERAGE_RENT_OPTIONS : BROKERAGE_SALE_OPTIONS;

  const fmt = (val: string) => {
    const n = Number(val);
    if (!n) return '';
    if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n/100000).toFixed(1)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{isRent ? 'Rent Amount' : 'Selling Price'}</h2>
        <p className="text-gray-500 text-sm mt-1">{isRent ? 'Set your monthly rent' : 'Set your asking price'}</p>
      </div>

      <div>
        <FieldLabel required>{isRent ? 'Monthly Rent (₹)' : 'Selling Price (₹)'}</FieldLabel>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
          <input type="number" value={form.price}
            onChange={(e) => dispatch(updateForm({ price: e.target.value }))}
            placeholder={isRent ? '25000' : '5000000'}
            className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-4 text-xl font-bold focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" />
        </div>
        {form.price && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600">{fmt(form.price)}</span>
            {isRent && <span className="text-gray-400 text-sm">/month</span>}
          </div>
        )}
      </div>

      {['commercial', 'industrial'].includes(form.mainCategory) && (
        <div>
          <FieldLabel>Price Per</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {['total', 'per sqft', 'per month'].map(u => (
              <ChoiceButton key={u} label={u} selected={form.priceUnit === u}
                onClick={() => dispatch(updateForm({ priceUnit: u }))} />
            ))}
          </div>
        </div>
      )}

      {isAgent && (
        <SectionCard title="Brokerage Terms (Required)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {brokerageOpts.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => dispatch(updateForm({ brokerage: opt.value }))}
                className={cn('py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center',
                  form.brokerage === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50',
                )}>{opt.label}</button>
            ))}
          </div>
          {form.brokerage === 'custom' && (
            <div className="mt-3">
              <Input value={form.brokerageCustom}
                onChange={(e: any) => dispatch(updateForm({ brokerageCustom: e.target.value }))}
                placeholder="e.g., 45 days rent" />
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ─── Step: Photos ────────────────────────────────────────────────────────────

function Step10Photos({ form, dispatch, mediaFiles, setMediaFiles, existingImages, onRemoveExisting, onSubmit, onSaveDraft, loading, savingDraft, error, isEditMode, brochureFile, setBrochureFile, removeBrochure, setRemoveBrochure }: any) {
  const imageRef = useRef<HTMLInputElement>(null);
  const brochureRef = useRef<HTMLInputElement>(null);
  const isBuilderProject = form.mainCategory === 'builder_project';
  const imgCount = mediaFiles.filter((m: MediaFile) => m.type === 'image').length;
  const totalCount = imgCount + (existingImages?.length || 0);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev: MediaFile[]) => [
      ...prev,
      ...files.slice(0, 11 - totalCount).map(f => ({ file: f, preview: URL.createObjectURL(f), type: 'image' as const })),
    ]);
    e.target.value = '';
  };

  const remove = (idx: number) => {
    setMediaFiles((prev: MediaFile[]) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_: any, i: number) => i !== idx);
    });
  };

  const title = form.autoTitle || generatePropertyTitle({
    category: form.mainCategory, listingType: form.listingType || 'rent',
    propertyType: form.propertyType, bedrooms: form.bedrooms, city: form.city, locality: form.locality,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Photos</h2>
        <p className="text-gray-500 text-sm mt-1">Add at least 3 photos — listings with more photos get 5× more inquiries</p>
      </div>

      <input type="file" ref={imageRef} multiple accept="image/*" className="hidden" onChange={handleImages} />

      {/* Photo grid */}
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3">
          {/* Existing images (edit mode) */}
          {(existingImages || []).map((img: any, i: number) => (
            <div key={`existing-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              <img src={resolveImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
              {i === 0 && imgCount === 0 && (
                <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded font-bold">
                  Cover
                </span>
              )}
              <button onClick={() => onRemoveExisting(img.id)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100">
                ×
              </button>
            </div>
          ))}
          {/* New uploads */}
          {mediaFiles.map((m: MediaFile, i: number) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              <img src={m.preview} alt="" className="w-full h-full object-cover" />
              {(existingImages?.length || 0) === 0 && i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded font-bold">
                  Cover
                </span>
              )}
              <button onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100">
                ×
              </button>
            </div>
          ))}
          {totalCount < 11 && (
            <button type="button" onClick={() => imageRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 transition-all">
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-semibold">Add Photo</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className={cn('flex items-center gap-1.5 text-sm font-medium', totalCount >= 3 ? 'text-green-600' : 'text-gray-400')}>
            {totalCount >= 3 ? <CheckCircle2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {totalCount}/3 minimum
          </div>
          {totalCount < 3 && <span className="text-sm text-orange-500">Need {3 - totalCount} more photo{3 - totalCount > 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Brochure upload — builder_project only */}
      {isBuilderProject && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
            📄 Project Brochure <span className="text-xs font-normal text-gray-500">(PDF, max 10 MB)</span>
          </h3>
          <p className="text-sm text-gray-500 mb-4">Upload your project brochure so buyers can download it directly from the listing.</p>

          <input
            type="file"
            ref={brochureRef}
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setBrochureFile(f);
              setRemoveBrochure(false);
              e.target.value = '';
            }}
          />

          {/* Show existing brochure in edit mode */}
          {isEditMode && form.existingBrochureUrl && !removeBrochure && !brochureFile && (
            <div className="flex items-center gap-3 p-3 bg-white border border-amber-300 rounded-xl mb-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">Brochure uploaded</p>
                <a href={form.existingBrochureUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline">View current brochure</a>
              </div>
              <button type="button" onClick={() => setRemoveBrochure(true)}
                className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                Remove
              </button>
            </div>
          )}

          {/* Show newly selected brochure file */}
          {brochureFile && (
            <div className="flex items-center gap-3 p-3 bg-white border border-green-300 rounded-xl mb-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{brochureFile.name}</p>
                <p className="text-xs text-gray-500">{(brochureFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => setBrochureFile(null)}
                className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                Remove
              </button>
            </div>
          )}

          {/* Removed indicator */}
          {removeBrochure && !brochureFile && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
              <X className="w-4 h-4 flex-shrink-0" /> Brochure will be removed on save.
              <button type="button" onClick={() => setRemoveBrochure(false)} className="ml-auto text-xs underline">Undo</button>
            </div>
          )}

          <button type="button" onClick={() => brochureRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-amber-400 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 hover:border-amber-500 transition-all">
            <Plus className="w-4 h-4" />
            {brochureFile || (isEditMode && form.existingBrochureUrl && !removeBrochure) ? 'Replace Brochure' : 'Upload Brochure'}
          </button>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" /> Listing Preview
        </p>
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{title}</h3>
        <p className="text-gray-500 text-xs flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3" /> {[form.locality, form.city, form.state].filter(Boolean).join(', ')}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          {form.bedrooms && <span className="bg-gray-100 px-2.5 py-1 rounded-full">{form.bedrooms} BHK</span>}
          {(() => { const { area: da, areaUnit: dau } = parseAreaFromDynamic(form.dynamicFields); return da ? <span className="bg-gray-100 px-2.5 py-1 rounded-full">{da} {dau}</span> : null; })()}
          {form.furnishingStatus && <span className="bg-gray-100 px-2.5 py-1 rounded-full capitalize">{form.furnishingStatus.replace('_',' ')}</span>}
          {form.amenityIds?.length > 0 && <span className="bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{form.amenityIds.length} amenities</span>}
        </div>
        {form.price && (
          <p className="text-2xl font-black text-primary-600">
            ₹{Number(form.price).toLocaleString('en-IN')}
            <span className="text-sm font-normal text-gray-400 ml-1">
              {(form.listingType === 'rent' || form.mainCategory === 'rent' || form.mainCategory === 'pg') ? '/mo' : ''}
            </span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="flex flex-col gap-3">
        <button type="button" onClick={onSubmit} disabled={loading || totalCount < 3}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-xl shadow-primary-600/30">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</> : isEditMode ? '✏️ Update Property' : '🎉 Publish Property'}
        </button>
        {!isEditMode && (
          <button type="button" onClick={onSaveDraft} disabled={savingDraft || loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-all text-sm">
            {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft & Exit
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PostPropertyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const { user, loading: authLoading, login, refresh: refreshAuth } = useAuth();
  const dispatch = useAppDispatch();
  const { currentStep, form, config, draftId, autoSaveStatus, lastSaved } = useAppSelector(s => s.postProperty);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; isPrimary: boolean }[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [removeBrochure, setRemoveBrochure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [roleUpgrading, setRoleUpgrading] = useState(false);
  const [agentAgencyInfo, setAgentAgencyInfo] = useState<{ agencyId: string; agentProfileId: string } | null>(null);
  // Keep server + client initial render identical (both show loader when editId present)
  // by deferring the false state to after mount.
  const [editLoading, setEditLoading] = useState(true);
  const [editAccessDenied, setEditAccessDenied] = useState(false);
  const [error, setError] = useState('');
  const [userDrafts, setUserDrafts] = useState<any[]>([]);
  const [userPending, setUserPending] = useState<any[]>([]);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  // Refs so auto-save interval always reads the latest values
  const latestRef = useRef({ form, draftId, agentAgencyInfo, isEditMode: false, currentStep: 0 });

  const TOTAL_STEPS = 10;
  const isAgent = user?.role === 'agent' || user?.role === 'seller';
  const agentProfStatus = (user as any)?.agentProfileStatus;
  const showProfPendingBanner = isAgent && agentProfStatus === 'pending';
  const showProfInactiveBanner = isAgent && (agentProfStatus === 'inactive' || user?.isActive === false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/post-property/guest');
  }, [user, authLoading, router]);

  // Auto-derive listing identity from user role — no step needed
  useEffect(() => {
    if (!user) return;
    if (isAgent) {
      dispatch(updateForm({ userType: 'agent', agencyName: user.company || user.name || '' }));
    } else {
      dispatch(updateForm({ userType: 'owner' }));
    }
  }, [user?.id]);

  // Fetch categories once
  useEffect(() => {
    dispatch(setConfigLoading({ key: 'categories', value: true }));
    propertyConfigApi.getCategories()
      .then(r => dispatch(setConfigCategories(r.data)))
      .catch(() => dispatch(setConfigLoading({ key: 'categories', value: false })));
  }, []);

  // Fetch types when category changes
  useEffect(() => {
    if (!form.categoryId) { dispatch(setConfigTypes([])); return; }
    dispatch(setConfigLoading({ key: 'types', value: true }));
    propertyConfigApi.getTypes(form.categoryId)
      .then(r => dispatch(setConfigTypes(r.data)))
      .catch(() => dispatch(setConfigLoading({ key: 'types', value: false })));
  }, [form.categoryId]);

  // Fetch amenities + fields when type changes
  useEffect(() => {
    if (!form.typeId) { dispatch(setConfigAmenities([])); dispatch(setConfigFields([])); return; }
    dispatch(setConfigLoading({ key: 'amenities', value: true }));
    dispatch(setConfigLoading({ key: 'fields', value: true }));
    Promise.all([
      propertyConfigApi.getAmenities(form.typeId),
      propertyConfigApi.getFields(form.typeId),
    ]).then(([ar, fr]) => {
      const amenities = (ar.data || []).map((item: any) => item.amenity ?? item);
      dispatch(setConfigAmenities(amenities));
      dispatch(setConfigFields(fr.data || []));
    }).catch(() => {
      dispatch(setConfigLoading({ key: 'amenities', value: false }));
      dispatch(setConfigLoading({ key: 'fields', value: false }));
    });
  }, [form.typeId]);

  // Load user's existing drafts + pending listings for right panel display
  useEffect(() => {
    if (!user) return;
    propertiesApi.getMyListings({ limit: 20 })
      .then(res => {
        const items = res.data?.items ?? res.data?.data ?? [];
        setUserDrafts(items.filter((p: any) => p.isDraft));
        setUserPending(items.filter((p: any) => !p.isDraft && p.approvalStatus === 'pending'));
      })
      .catch(() => {});
  }, [user?.id]);

  // Keep latest-values ref in sync for the auto-save interval
  useEffect(() => {
    latestRef.current = { form, draftId, agentAgencyInfo, isEditMode, currentStep };
  });

  // Build payload from form data (with fallback values for required fields)
  const buildDraftPayload = (formData: typeof form, info: typeof agentAgencyInfo) => {
    const effectiveTitle = formData.autoTitle || generatePropertyTitle({
      category: formData.mainCategory,
      listingType: formData.listingType || (formData.mainCategory === 'pg' || formData.mainCategory === 'rent' ? 'rent' : 'buy'),
      propertyType: formData.propertyType, bedrooms: formData.bedrooms, city: formData.city, locality: formData.locality,
    }) || 'Draft Property';
    const extraDetails: Record<string, any> = {};
    if (formData.mainCategory === 'industrial') {
      extraDetails.height = formData.industrialHeight;
      extraDetails.powerLoad = formData.industrialPowerLoad;
      extraDetails.hasDock = formData.hasDock;
      extraDetails.hasRamp = formData.hasRamp;
    }
    Object.entries(formData.dynamicFields).forEach(([k, v]) => {
      if (v === '') return;
      if (v.startsWith('[') || v.startsWith('{')) {
        try { extraDetails[k] = JSON.parse(v); return; } catch {}
      }
      extraDetails[k] = v;
    });
    return {
      title: effectiveTitle,
      description: formData.description || effectiveTitle,
      category: formData.mainCategory || 'buy',
      listingType: formData.listingType || undefined,
      type: formData.propertyType || 'apartment',
      city: formData.city || 'Delhi',
      cityId: formData.cityId || undefined,
      state: formData.state || undefined,
      stateId: formData.stateId || undefined,
      locality: formData.locality || formData.city || 'Delhi',
      localityId: formData.localityId || undefined,
      address: formData.address || undefined,
      pincode: formData.pincode || undefined,
      latitude: formData.latitude ?? undefined,
      longitude: formData.longitude ?? undefined,
      price: Number(formData.price) || 0,
      priceUnit: formData.priceUnit,
      area: parseAreaFromDynamic(formData.dynamicFields).area,
      areaUnit: parseAreaFromDynamic(formData.dynamicFields).areaUnit,
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      floorNumber: formData.floor ? Number(formData.floor) : undefined,
      furnishingStatus: formData.furnishingStatus || undefined,
      possessionStatus: formData.possessionStatus,
      listedBy: formData.userType === 'agent' ? 'agent' : 'owner',
      builderName: formData.userType === 'agent' ? (formData.agencyName?.trim() || undefined) : undefined,
      brokerage: formData.brokerage === 'custom' ? formData.brokerageCustom : formData.brokerage || undefined,
      amenityIds: formData.amenityIds.length > 0 ? formData.amenityIds : undefined,
      extraDetails: Object.keys(extraDetails).length > 0 ? extraDetails : undefined,
      isDraft: true,
      ...(info && formData.userType === 'agent' ? {
        agentProfileId: info.agentProfileId,
        agencyId: info.agencyId,
      } : {}),
    };
  };

  // Save current form state as a draft
  const saveDraft = async (silent = false) => {
    const { form: f, draftId: did, agentAgencyInfo: info } = latestRef.current;
    if (!f.mainCategory) return; // Nothing meaningful to save yet
    if (!silent) setSavingDraft(true);
    dispatch(setAutoSaveStatus('saving'));
    try {
      const payload = buildDraftPayload(f, info);
      if (did) {
        await propertiesApi.update(did, payload);
      } else {
        const { data } = await propertiesApi.create(payload);
        dispatch(setDraftId(data.id));
        if (typeof window !== 'undefined') localStorage.setItem('t4bs_draft_id', data.id);
      }
      dispatch(setLastSaved(Date.now()));
      dispatch(setAutoSaveStatus('saved'));
    } catch {
      dispatch(setAutoSaveStatus('error'));
    } finally {
      if (!silent) setSavingDraft(false);
    }
  };

  // Auto-save every 30 seconds — only when not editing and at least 6 steps covered
  useEffect(() => {
    if (isEditMode) return;
    const interval = setInterval(() => {
      const { isEditMode: em, form: f, currentStep: cs } = latestRef.current;
      if (em || !f.mainCategory || cs < 5) return;
      saveDraft(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveDraftAndExit = async () => {
    await saveDraft(false);
    // Redirect to edit the saved draft so user can resume later
    const savedId = latestRef.current.draftId;
    if (savedId) {
      router.push(`/post-property?edit=${savedId}`);
    } else {
      router.push('/my-listings');
    }
  };

  // Load existing property data for edit mode (or immediately clear loader for new-property mode)
  useEffect(() => {
    if (!editId) { setEditLoading(false); return; }
    if (!user) return;
    setEditLoading(true);
    dispatch(resetForm());
    (async () => {
      try {
        const { data: property } = await propertiesApi.getById(editId);

        // Unauthorised: user doesn't own this property
        if (user.role !== 'admin' && property.ownerId && property.ownerId !== user.id) {
          setEditAccessDenied(true);
          setEditLoading(false);
          return;
        }

        // Fetch categories, then types, then amenities sequentially to get IDs
        const { data: categories } = await propertyConfigApi.getCategories();
        dispatch(setConfigCategories(categories));
        const category = (Array.isArray(categories) ? categories : categories?.items || [])
          .find((c: any) => c.slug === property.category);

        let typeId = '';
        let amenityIds: string[] = [];
        if (category) {
          const { data: types } = await propertyConfigApi.getTypes(category.id);
          dispatch(setConfigTypes(types));
          const type = (types || []).find((t: any) =>
            t.slug === property.type || t.name?.toLowerCase().replace(/\s+/g, '_') === property.type
          );
          if (type) {
            typeId = type.id;
            const [ar, fr] = await Promise.all([
              propertyConfigApi.getAmenities(type.id),
              propertyConfigApi.getFields(type.id),
            ]);
            const amenities = (ar.data || []).map((item: any) => item.amenity ?? item);
            dispatch(setConfigAmenities(amenities));
            dispatch(setConfigFields(fr.data || []));
            amenityIds = (property.amenities || []).map((a: any) => a.id);
          }
        }

        // Populate form
        dispatch(updateForm({
          mainCategory: property.category || '',
          categoryId: category?.id || '',
          listingType: property.listingType || IMPLICIT_LISTING[property.category] || 'buy',
          propertyType: property.type || '',
          typeId,
          city: property.city || '',
          cityId: property.cityId || '',
          state: property.state || '',
          stateId: property.stateId || '',
          locality: property.locality || '',
          localityId: property.localityId || '',
          address: property.address || '',
          pincode: property.pincode || '',
          latitude: property.latitude ?? null,
          longitude: property.longitude ?? null,
          autoTitle: property.title || '',
          bedrooms: property.bedrooms ? String(property.bedrooms) : '',
          bathrooms: property.bathrooms ? String(property.bathrooms) : '',
          floor: property.floorNumber ? String(property.floorNumber) : '',
          furnishingStatus: property.furnishingStatus || 'unfurnished',
          possessionStatus: property.possessionStatus || 'ready_to_move',
          price: property.price ? String(property.price) : '',
          priceUnit: property.priceUnit || 'total',
          brokerage: property.brokerage || '',
          description: property.description || '',
          amenityIds,
          dynamicFields: (() => {
            const df: Record<string, string> = {};
            Object.entries(property.extraDetails || {}).forEach(([k, v]) => {
              df[k] = typeof v === 'string' ? v : JSON.stringify(v);
            });
            // Reconstruct carpet_area from legacy area/areaUnit fields if not present
            if (property.area && !df.carpet_area) {
              df.carpet_area = JSON.stringify([{ value: String(property.area), unit: property.areaUnit || 'Sq.ft.' }]);
            }
            return df;
          })(),
          userType: property.listedBy === 'agent' ? 'agent' : 'owner',
          agencyName: property.builderName || '',
        }));

        setExistingImages(
          (property.images || []).sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
        );
        if (property.brochureUrl) {
          dispatch(updateForm({ existingBrochureUrl: property.brochureUrl }));
        }
        setEditingProperty({
          title: property.title,
          city: property.city,
          locality: property.locality,
          approvalStatus: property.isDraft ? 'draft' : (property.approvalStatus || 'pending'),
        });
        dispatch(setStep(0));
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 403 || status === 404) {
          setEditAccessDenied(true);
        } else {
          setError('Failed to load property for editing. Please try again.');
        }
      } finally {
        setEditLoading(false);
      }
    })();
  }, [editId, user?.id]);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!form.categoryId;
      case 1: return !!form.listingType;
      case 2: return !!form.typeId;
      case 3: return !!form.city && !!form.locality && (isAgent || !!form.address);
      case 4: return true;
      case 5: {
        // Validate all required dynamic config fields
        const requiredDynamic = (config.fields || []).filter((f: PropConfigField) => f.isRequired);
        for (const f of requiredDynamic) {
          const val = (form.dynamicFields[f.fieldName] || '').trim();
          if (!val) return false;
        }
        return true;
      }
      case 6: return true;
      case 7: return true;
      case 8: return !!form.price;
      case 9: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) { setError('Please complete the required fields.'); return; }
    setError('');
    // Skip Purpose step for categories with an implicit listing type (buy/rent/pg)
    if (currentStep === 0) {
      const implicit = IMPLICIT_LISTING[form.mainCategory];
      if (implicit) { dispatch(updateForm({ listingType: implicit })); dispatch(setStep(2)); return; }
    }
    dispatch(nextStep());
  };

  const handleBack = () => {
    // When going back to Category from Property Type, skip Purpose if it was auto-set
    if (currentStep === 2 && IMPLICIT_LISTING[form.mainCategory]) { dispatch(setStep(0)); return; }
    dispatch(prevStep());
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const effectiveTitle = form.autoTitle || generatePropertyTitle({
        category: form.mainCategory,
        listingType: form.listingType || (form.mainCategory === 'pg' || form.mainCategory === 'rent' ? 'rent' : 'buy'),
        propertyType: form.propertyType, bedrooms: form.bedrooms, city: form.city, locality: form.locality,
      });

      const extraDetails: Record<string, any> = {};
      if (form.mainCategory === 'industrial') {
        extraDetails.height = form.industrialHeight;
        extraDetails.powerLoad = form.industrialPowerLoad;
        extraDetails.hasDock = form.hasDock;
        extraDetails.hasRamp = form.hasRamp;
      }
      Object.entries(form.dynamicFields).forEach(([k, v]) => {
        if (v === '') return;
        if (v.startsWith('[') || v.startsWith('{')) {
          try { extraDetails[k] = JSON.parse(v); return; } catch {}
        }
        extraDetails[k] = v;
      });

      const payload: any = {
        title: effectiveTitle,
        description: form.description || effectiveTitle + '. Contact for details.',
        category: form.mainCategory,
        listingType: form.listingType || undefined,
        type: form.propertyType,
        city: form.city, cityId: form.cityId || undefined,
        state: form.state, stateId: form.stateId || undefined,
        locality: form.locality || form.city,
        localityId: form.localityId || undefined,
        address: form.address || undefined,
        pincode: form.pincode || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        price: Number(form.price),
        priceUnit: form.priceUnit,
        area: parseAreaFromDynamic(form.dynamicFields).area,
        areaUnit: parseAreaFromDynamic(form.dynamicFields).areaUnit,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        floorNumber: form.floor ? Number(form.floor) : undefined,
        furnishingStatus: form.furnishingStatus || undefined,
        possessionStatus: form.possessionStatus,
        listedBy: form.userType === 'agent' ? 'agent' : 'owner',
        builderName: form.userType === 'agent' ? (form.agencyName?.trim() || user?.company || undefined) : undefined,
        brokerage: form.brokerage === 'custom' ? form.brokerageCustom : form.brokerage || undefined,
        amenityIds: form.amenityIds.length > 0 ? form.amenityIds : undefined,
        extraDetails: Object.keys(extraDetails).length > 0 ? extraDetails : undefined,
        // Pass agent/agency mapping if available (for agent listings)
        ...(agentAgencyInfo && form.userType === 'agent' ? {
          agentProfileId: agentAgencyInfo.agentProfileId,
          agencyId: agentAgencyInfo.agencyId,
        } : {}),
      };

      let propertyId: string;
      let propertySlug: string;

      if (isEditMode && editId) {
        // Delete removed images first
        await Promise.all(removedImageIds.map(imgId => propertiesApi.deleteImage(editId, imgId)));
        const { data: updated } = await propertiesApi.update(editId, payload);
        propertyId = updated.id;
        propertySlug = updated.slug;
      } else if (draftId) {
        // Publish an existing draft: update with final data then submit for approval
        await propertiesApi.update(draftId, payload);
        const { data: published } = await propertiesApi.publishDraft(draftId);
        propertyId = published.id;
        propertySlug = published.slug;
        if (typeof window !== 'undefined') localStorage.removeItem('t4bs_draft_id');
      } else {
        const { data: property } = await propertiesApi.create(payload);
        propertyId = property.id;
        propertySlug = property.slug;
      }

      // Upload new images
      const images = mediaFiles.filter(m => m.type === 'image');
      if (images.length > 0) {
        const fd = new FormData();
        images.forEach(m => fd.append('images', m.file));
        await propertiesApi.uploadImages(propertyId, fd);
      }

      // Handle brochure (builder_project only)
      if (form.mainCategory === 'builder_project') {
        if (removeBrochure && form.existingBrochureUrl) {
          await propertiesApi.deleteBrochure(propertyId);
        }
        if (brochureFile) {
          const bfd = new FormData();
          bfd.append('brochure', brochureFile);
          await propertiesApi.uploadBrochure(propertyId, bfd);
        }
      }

      dispatch(resetForm());
      router.push(isEditMode ? `/properties/${propertySlug}?updated=1` : `/properties/${propertySlug}?posted=1`);
    } catch (err: any) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update property.' : 'Failed to post property. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = (imageId: string) => {
    setRemovedImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Handle buyer role upgrade + optional agency registration
  const handleBuyerRoleSelected = async (
    role: 'owner' | 'agent',
    agencyData?: { agencyName: string; contactPhone?: string; address?: string },
  ) => {
    setRoleUpgrading(true);
    try {
      const { data } = await authApi.upgradeRole(role);
      login(data.token || data.accessToken, data.user);

      if (role === 'agent' && agencyData?.agencyName) {
        const { data: agencyResult } = await agencyApi.selfRegisterOrJoin({
          agencyName: agencyData.agencyName,
          contactPhone: agencyData.contactPhone,
          address: agencyData.address,
        });
        if (agencyResult?.agency?.id && agencyResult?.agentProfile?.id) {
          setAgentAgencyInfo({
            agencyId: agencyResult.agency.id,
            agentProfileId: agencyResult.agentProfile.id,
          });
        }
      }

      await refreshAuth();
    } finally {
      setRoleUpgrading(false);
    }
  };

  if (authLoading || editLoading || roleUpgrading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm text-gray-500">{roleUpgrading ? 'Updating your account…' : isEditMode ? 'Loading property data…' : 'Loading…'}</p>
      </div>
    );
  }

  // Show role selection screen for buyers before showing the property form
  if (user?.role === 'buyer') {
    return (
      <BuyerRoleSelectionScreen onRoleSelected={handleBuyerRoleSelected} />
    );
  }

  if (editAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            You don't have permission to edit this property. Only the owner or an admin can make changes.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.back()}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              ← Go Back
            </button>
            <a
              href="/my-listings"
              className="w-full py-3 rounded-2xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-colors text-center"
            >
              My Listings
            </a>
          </div>
        </div>
      </div>
    );
  }

  const stepProps = { form, dispatch, config };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step1MainCategory {...stepProps} />;
      case 1: return <Step2ListingType {...stepProps} />;
      case 2: return <Step3PropertyType {...stepProps} />;
      case 3: return <Step4Location {...stepProps} />;
      case 4: return <Step5AutoTitle {...stepProps} />;
      case 5: return <Step6Details {...stepProps} />;
      case 6: return <Step7Amenities {...stepProps} />;
      case 7: return <Step8Description {...stepProps} />;
      case 8: return <Step9Price {...stepProps} />;
      case 9: return <Step10Photos {...stepProps} mediaFiles={mediaFiles} setMediaFiles={setMediaFiles} existingImages={existingImages} onRemoveExisting={handleRemoveExistingImage} onSubmit={handleSubmit} onSaveDraft={handleSaveDraftAndExit} savingDraft={savingDraft} loading={loading} error={error} isEditMode={isEditMode} brochureFile={brochureFile} setBrochureFile={setBrochureFile} removeBrochure={removeBrochure} setRemoveBrochure={setRemoveBrochure} />;
      default: return null;
    }
  };

  const mobileSaveLabel = autoSaveStatus === 'saving'
    ? 'Saving…'
    : autoSaveStatus === 'saved' && lastSaved && Math.round((Date.now() - lastSaved) / 60000) < 1
    ? 'Saved just now'
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-14 md:pt-16">
      {/* Mobile sticky progress bar */}
      <MobileProgress currentStep={currentStep} />

      <div className="max-w-screen-xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        <div className="flex gap-6 xl:gap-8">

          {/* Left — steps/status + preview (desktop only) */}
          <SidebarProgress currentStep={currentStep} form={form} />

          {/* Middle — form */}
          <main className="flex-1 min-w-0">
            {/* Page header — desktop only */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-black text-gray-900">{isEditMode ? 'Edit Property' : 'Post Your Property'}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {isAgent ? (
                  <>
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">🏢 Agent Listing</span>
                    {user?.company && <span className="text-sm text-gray-500">{user.company}</span>}
                  </>
                ) : (
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">🏠 Owner Listing</span>
                )}
              </div>
            </div>

            {/* Mobile page title */}
            <div className="lg:hidden px-4 pt-2 pb-3">
              <h1 className="text-lg font-black text-gray-900">{isEditMode ? 'Edit Property' : 'Post Your Property'}</h1>
              <span className={cn(
                'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1',
                isAgent ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              )}>
                {isAgent ? '🏢 Agent Listing' : '🏠 Owner Listing'}
              </span>
            </div>

            {/* Agent profile status banners */}
            {showProfInactiveBanner && (
              <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <span className="text-lg leading-none mt-0.5">🚫</span>
                <div>
                  <p className="font-semibold">Professional profile inactive</p>
                  <p className="text-xs mt-0.5">Your professional profile has been deactivated. To post properties, please contact admin: <strong>@think4buysale</strong></p>
                </div>
              </div>
            )}
            {!showProfInactiveBanner && showProfPendingBanner && (
              <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                <span className="text-lg leading-none mt-0.5">⏳</span>
                <div>
                  <p className="font-semibold">Professional profile under review</p>
                  <p className="text-xs mt-0.5">Your professional details are pending admin approval. You can still post properties in the meantime.</p>
                </div>
              </div>
            )}

            {/* Form card — full bleed on mobile, rounded on sm+ */}
            <div className="bg-white rounded-none sm:rounded-3xl shadow-none sm:shadow-sm border-y sm:border border-gray-100 p-5 sm:p-8 lg:p-10 mb-4 sm:mb-6">
              {error && currentStep < 9 && (
                <div className="mb-5 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}
              {renderStep()}
            </div>

            {/* Desktop navigation (steps 0–8) */}
            {currentStep < 9 && (
              <div className="hidden lg:block space-y-3">
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button type="button" onClick={handleBack}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  <button type="button" onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-primary-600/25 text-base">
                    {currentStep === 8 ? 'Next: Add Photos' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Desktop back link (step 9) */}
            {currentStep === 9 && (
              <div className="hidden lg:flex justify-center">
                <button type="button" onClick={handleBack}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Go back to edit
                </button>
              </div>
            )}

            {/* Mobile back link (step 9) + spacer for sticky nav */}
            {currentStep === 9 && (
              <div className="lg:hidden flex justify-center mt-4 mb-28">
                <button type="button" onClick={handleBack}
                  className="flex items-center gap-2 text-gray-500 text-sm font-semibold py-3 px-5 rounded-2xl border border-gray-200 bg-white">
                  <ArrowLeft className="w-4 h-4" /> Go back to edit
                </button>
              </div>
            )}

            {/* Mobile spacer — prevents content hiding behind sticky nav */}
            {currentStep < 9 && <div className="h-36 lg:hidden" />}
          </main>

          {/* Right — drafts + pending + save draft (desktop only) */}
          <RightPanel
            onSaveDraft={handleSaveDraftAndExit}
            savingDraft={savingDraft}
            canSaveDraft={currentStep >= 5}
            autoSaveStatus={autoSaveStatus}
            lastSaved={lastSaved}
            userDrafts={userDrafts}
            userPending={userPending}
            activeDraftId={draftId}
            isEditMode={isEditMode}
            editingProperty={editingProperty}
          />
        </div>
      </div>

      {/* ── Mobile sticky bottom navigation ─────────────────────────────── */}
      {currentStep < 9 && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] lg:hidden bg-white border-t border-gray-200"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.10)', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        >
          <div className="px-4 pt-3 pb-1">
            {/* Main nav row */}
            <div className="flex items-center gap-3 mb-2.5">
              {currentStep > 0 ? (
                <button type="button" onClick={handleBack}
                  className="flex items-center justify-center gap-1.5 h-12 w-12 rounded-2xl border-2 border-gray-200 text-gray-600 active:bg-gray-100 transition-colors flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : null}
              <button type="button" onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 active:bg-primary-700 text-white font-bold h-12 rounded-2xl shadow-md shadow-primary-600/25 text-[15px] transition-colors">
                {currentStep === 8 ? 'Add Photos' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Save draft + auto-save status row */}
            {!isEditMode && (
              <div className="flex items-center justify-between h-8">
                {currentStep >= 5 ? (
                  <button type="button" onClick={handleSaveDraftAndExit} disabled={savingDraft}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold disabled:opacity-50 active:bg-amber-100 transition-colors">
                    {savingDraft
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Save className="w-3.5 h-3.5" />}
                    Save Draft
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-xs font-medium">
                    <Save className="w-3.5 h-3.5" />
                    Save Draft
                    <span className="text-[10px] bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded-full ml-0.5">
                      step {5 - currentStep + 1} more
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {autoSaveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && mobileSaveLabel && (
                    <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                      <CheckCircle2 className="w-3 h-3" />{mobileSaveLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostPropertyPage() {
  return (
    <AuthGuard allowedRoles={['buyer', 'owner', 'agent', 'seller', 'admin']} loginRedirect="/post-property/guest">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      }>
        <PostPropertyPageInner />
      </Suspense>
    </AuthGuard>
  );
}
