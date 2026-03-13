'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminLocationsApi, adminApi, api } from '@/lib/api';
import OptimizedImage, { resolveImageSrc } from '@/components/common/OptimizedImage';
import { Plus, Trash2 } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  seoSlug?: string;
}

interface State {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  imageUrl?: string;
  countryId?: string;
  country?: Country;
  slug?: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  seoContent?: string;
}

interface City {
  id: string;
  name: string;
  stateId: string;
  state?: { id: string; name: string };
  isFeatured: boolean;
  isActive: boolean;
  imageUrl?: string;
  slug?: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  introContent?: string;
  seoContent?: string;
  faqs?: { question: string; answer: string }[];
}

type Tab = 'states' | 'cities' | 'countries';
type ModalTab = 'basic' | 'seo';

const EMPTY_STATE = { name: '', code: '', imageUrl: '', countryId: '', slug: '', h1: '', metaTitle: '', metaDescription: '', metaKeywords: '', seoContent: '' };
const EMPTY_CITY = { name: '', stateId: '', isFeatured: false, slug: '', h1: '', metaTitle: '', metaDescription: '', metaKeywords: '', introContent: '', seoContent: '', faqs: [] as { question: string; answer: string }[] };

const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const r = await api.post('/admin/locations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return r.data.url;
};

function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── SEO Tab for City modal ──────────────────────────────────────────────────

function CitySeoTab({ form, setForm }: { form: any; setForm: (fn: (f: any) => any) => void }) {
  const addFaq = () => setForm(f => ({ ...f, faqs: [...(f.faqs || []), { question: '', answer: '' }] }));
  const removeFaq = (i: number) => setForm(f => ({ ...f, faqs: f.faqs.filter((_: any, idx: number) => idx !== i) }));
  const updateFaq = (i: number, field: 'question' | 'answer', val: string) =>
    setForm(f => ({ ...f, faqs: f.faqs.map((faq: any, idx: number) => idx === i ? { ...faq, [field]: val } : faq) }));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          City Slug <span className="font-normal text-gray-400">(URL-safe, e.g. mumbai)</span>
        </label>
        <div className="flex gap-2 items-center">
          <input
            value={form.slug || ''}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
            placeholder="mumbai"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.name && !form.slug && (
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, slug: toSlug(f.name) }))}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 whitespace-nowrap"
            >
              Auto-fill
            </button>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">H1 Heading</label>
        <input value={form.h1 || ''} onChange={e => setForm(f => ({ ...f, h1: e.target.value }))}
          placeholder="Properties in Mumbai" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
        <input value={form.metaTitle || ''} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} maxLength={200}
          placeholder="Buy & Rent Property in Mumbai - Think4BuySale"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-right text-xs text-gray-400 mt-0.5">{(form.metaTitle || '').length}/200</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
        <textarea value={form.metaDescription || ''} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} maxLength={500} rows={2}
          placeholder="Find the best properties in Mumbai..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        <p className="text-right text-xs text-gray-400 mt-0.5">{(form.metaDescription || '').length}/500</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Keywords</label>
        <input value={form.metaKeywords || ''} onChange={e => setForm(f => ({ ...f, metaKeywords: e.target.value }))}
          placeholder="buy property mumbai, flats in mumbai, mumbai real estate"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Intro Content <span className="font-normal text-gray-400">(top of page)</span></label>
        <textarea value={form.introContent || ''} onChange={e => setForm(f => ({ ...f, introContent: e.target.value }))} rows={3}
          placeholder="Mumbai is India's financial capital..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">SEO Content <span className="font-normal text-gray-400">(bottom of page)</span></label>
        <textarea value={form.seoContent || ''} onChange={e => setForm(f => ({ ...f, seoContent: e.target.value }))} rows={4}
          placeholder="Detailed SEO article about real estate in Mumbai..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      {/* FAQs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">FAQs</label>
          <button type="button" onClick={addFaq} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
            <Plus className="w-3 h-3" /> Add FAQ
          </button>
        </div>
        <div className="space-y-2">
          {(form.faqs || []).map((faq: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">FAQ #{i + 1}</span>
                <button type="button" onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <input value={faq.question} onChange={e => updateFaq(i, 'question', e.target.value)}
                placeholder="Question..." className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
              <textarea value={faq.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} rows={2}
                placeholder="Answer..." className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SEO Tab for State modal ──────────────────────────────────────────────────

function StateSeoTab({ form, setForm }: { form: any; setForm: (fn: (f: any) => any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">State Slug <span className="font-normal text-gray-400">(URL-safe)</span></label>
        <div className="flex gap-2 items-center">
          <input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
            placeholder="maharashtra" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
          {form.name && !form.slug && (
            <button type="button" onClick={() => setForm(f => ({ ...f, slug: toSlug(f.name) }))}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 whitespace-nowrap">Auto-fill</button>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">H1 Heading</label>
        <input value={form.h1 || ''} onChange={e => setForm(f => ({ ...f, h1: e.target.value }))}
          placeholder="Properties in Maharashtra" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
        <input value={form.metaTitle || ''} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} maxLength={200}
          placeholder="Buy & Rent Property in Maharashtra - Think4BuySale"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-right text-xs text-gray-400 mt-0.5">{(form.metaTitle || '').length}/200</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
        <textarea value={form.metaDescription || ''} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} maxLength={500} rows={2}
          placeholder="Explore properties across Maharashtra..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        <p className="text-right text-xs text-gray-400 mt-0.5">{(form.metaDescription || '').length}/500</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Keywords</label>
        <input value={form.metaKeywords || ''} onChange={e => setForm(f => ({ ...f, metaKeywords: e.target.value }))}
          placeholder="buy property maharashtra, maharashtra real estate"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">SEO Content</label>
        <textarea value={form.seoContent || ''} onChange={e => setForm(f => ({ ...f, seoContent: e.target.value }))} rows={4}
          placeholder="Maharashtra is home to India's largest real estate market..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </div>
  );
}

// ── Country SEO tab ──────────────────────────────────────────────────────────

function CountrySeoTab({ form, setForm }: { form: any; setForm: (fn: (f: any) => any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">SEO Slug</label>
        <input value={form.seoSlug || ''} onChange={e => setForm(f => ({ ...f, seoSlug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
          placeholder="india" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
        <input value={form.metaTitle || ''} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} maxLength={200}
          placeholder="India Real Estate - Think4BuySale"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Description</label>
        <textarea value={form.metaDescription || ''} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} maxLength={500} rows={2}
          placeholder="Explore real estate across India..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Keywords</label>
        <input value={form.metaKeywords || ''} onChange={e => setForm(f => ({ ...f, metaKeywords: e.target.value }))}
          placeholder="india real estate, buy property india, rent property india"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
    </div>
  );
}

// ── Modal Tab bar ────────────────────────────────────────────────────────────

function ModalTabBar({ active, onChange }: { active: ModalTab; onChange: (t: ModalTab) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
      {(['basic', 'seo'] as ModalTab[]).map(t => (
        <button key={t} type="button" onClick={() => onChange(t)}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${active === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          {t === 'seo' ? 'SEO & Meta' : 'Basic Info'}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLocationsPage() {
  const [tab, setTab] = useState<Tab>('states');

  // Countries
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countryModal, setCountryModal] = useState<{ open: boolean; editing: Country | null }>({ open: false, editing: null });
  const [countryForm, setCountryForm] = useState<any>({ name: '', code: '', dialCode: '', flag: '', seoSlug: '', metaTitle: '', metaDescription: '', metaKeywords: '' });
  const [countryModalTab, setCountryModalTab] = useState<ModalTab>('basic');

  // States
  const [states, setStates] = useState<State[]>([]);
  const [statesLoading, setStatesLoading] = useState(true);

  // Cities
  const [cities, setCities] = useState<City[]>([]);
  const [citiesTotal, setCitiesTotal] = useState(0);
  const [citiesPage, setCitiesPage] = useState(1);
  const [citiesSearch, setCitiesSearch] = useState('');
  const [filterStateId, setFilterStateId] = useState('');
  const [citiesLoading, setCitiesLoading] = useState(true);

  // Modals
  const [stateModal, setStateModal] = useState<{ open: boolean; editing: State | null }>({ open: false, editing: null });
  const [stateForm, setStateForm] = useState<any>(EMPTY_STATE);
  const [stateModalTab, setStateModalTab] = useState<ModalTab>('basic');
  const [stateImageUploading, setStateImageUploading] = useState(false);

  const [cityModal, setCityModal] = useState<{ open: boolean; editing: City | null }>({ open: false, editing: null });
  const [cityForm, setCityForm] = useState<any>(EMPTY_CITY);
  const [cityModalTab, setCityModalTab] = useState<ModalTab>('basic');
  const [cityImageUrl, setCityImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'state' | 'city' | 'country'; id: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadCountries = useCallback(async () => {
    setCountriesLoading(true);
    try {
      const r = await adminApi.getCountries();
      const data = r.data;
      setCountries(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCountriesLoading(false); }
  }, []);

  const loadStates = useCallback(async () => {
    setStatesLoading(true);
    try {
      const r = await adminLocationsApi.getStates();
      const data = r.data;
      setStates(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setStatesLoading(false); }
  }, []);

  const loadCities = useCallback(async () => {
    setCitiesLoading(true);
    try {
      const params: any = { page: citiesPage, limit: 15 };
      if (citiesSearch) params.search = citiesSearch;
      if (filterStateId) params.stateId = filterStateId;
      const r = await adminLocationsApi.getCities(params);
      const data = r.data;
      const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data?.cities) ? data.cities : Array.isArray(data) ? data : [];
      setCities(arr);
      setCitiesTotal(data?.total ?? arr.length);
    } catch (e) { console.error(e); }
    finally { setCitiesLoading(false); }
  }, [citiesPage, citiesSearch, filterStateId]);

  useEffect(() => { loadStates(); loadCountries(); }, [loadStates, loadCountries]);
  useEffect(() => { if (tab === 'cities') loadCities(); }, [tab, loadCities]);

  // ── Country actions ──────────────────────────────────────────────────────────

  function openAddCountry() {
    setCountryForm({ name: '', code: '', dialCode: '', flag: '', seoSlug: '', metaTitle: '', metaDescription: '', metaKeywords: '' });
    setCountryModalTab('basic');
    setError('');
    setCountryModal({ open: true, editing: null });
  }
  function openEditCountry(c: Country) {
    setCountryForm({ name: c.name, code: c.code, seoSlug: c.seoSlug || '', metaTitle: c.metaTitle || '', metaDescription: c.metaDescription || '', metaKeywords: c.metaKeywords || '' });
    setCountryModalTab('basic');
    setError('');
    setCountryModal({ open: true, editing: c });
  }
  async function saveCountry() {
    if (!countryForm.name.trim() || !countryForm.code.trim()) { setError('Name and Code are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { name: countryForm.name.trim(), code: countryForm.code.trim().toUpperCase() };
      if (countryForm.dialCode) payload.dialCode = countryForm.dialCode;
      if (countryForm.flag) payload.flag = countryForm.flag;
      if (countryForm.seoSlug !== undefined) payload.seoSlug = countryForm.seoSlug || null;
      if (countryForm.metaTitle !== undefined) payload.metaTitle = countryForm.metaTitle || null;
      if (countryForm.metaDescription !== undefined) payload.metaDescription = countryForm.metaDescription || null;
      if (countryForm.metaKeywords !== undefined) payload.metaKeywords = countryForm.metaKeywords || null;
      if (countryModal.editing) {
        await adminApi.updateCountry(countryModal.editing.id, payload);
      } else {
        await adminApi.createCountry(payload);
      }
      setCountryModal({ open: false, editing: null });
      loadCountries();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save country.');
    } finally { setSaving(false); }
  }
  async function deleteCountry(id: string) {
    setActionLoading(id);
    try {
      await adminApi.deleteCountry(id);
      setDeleteConfirm(null);
      loadCountries();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete country.');
    } finally { setActionLoading(null); }
  }

  // ── State actions ────────────────────────────────────────────────────────────

  function openAddState() {
    setStateForm(EMPTY_STATE);
    setStateModalTab('basic');
    setError('');
    setStateModal({ open: true, editing: null });
  }
  function openEditState(s: State) {
    setStateForm({
      name: s.name, code: s.code, imageUrl: s.imageUrl || '', countryId: s.countryId || '',
      slug: s.slug || '', h1: s.h1 || '', metaTitle: s.metaTitle || '',
      metaDescription: s.metaDescription || '', metaKeywords: s.metaKeywords || '', seoContent: s.seoContent || '',
    });
    setStateModalTab('basic');
    setError('');
    setStateModal({ open: true, editing: s });
  }
  async function saveState() {
    if (!stateForm.name.trim() || !stateForm.code.trim()) { setError('Name and Code are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = {
        name: stateForm.name.trim(), code: stateForm.code.trim().toUpperCase(),
        imageUrl: stateForm.imageUrl || null, countryId: stateForm.countryId || undefined,
        slug: stateForm.slug || null, h1: stateForm.h1 || null,
        metaTitle: stateForm.metaTitle || null, metaDescription: stateForm.metaDescription || null,
        metaKeywords: stateForm.metaKeywords || null, seoContent: stateForm.seoContent || null,
      };
      if (stateModal.editing) {
        await adminLocationsApi.updateState(stateModal.editing.id, payload);
      } else {
        await adminLocationsApi.createState(payload);
      }
      setStateModal({ open: false, editing: null });
      loadStates();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save state.');
    } finally { setSaving(false); }
  }
  async function toggleStateActive(s: State) {
    setActionLoading(s.id);
    try { await adminLocationsApi.updateState(s.id, { isActive: !s.isActive }); loadStates(); }
    finally { setActionLoading(null); }
  }
  async function deleteState(id: string) {
    setActionLoading(id);
    try { await adminLocationsApi.deleteState(id); setDeleteConfirm(null); loadStates(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete state.'); }
    finally { setActionLoading(null); }
  }

  // ── City actions ─────────────────────────────────────────────────────────────

  function openAddCity() {
    setCityForm(EMPTY_CITY);
    setCityImageUrl('');
    setCityModalTab('basic');
    setError('');
    setCityModal({ open: true, editing: null });
  }
  function openEditCity(c: City) {
    setCityForm({
      name: c.name, stateId: c.stateId || c.state?.id || '', isFeatured: c.isFeatured,
      slug: c.slug || '', h1: c.h1 || '', metaTitle: c.metaTitle || '',
      metaDescription: c.metaDescription || '', metaKeywords: c.metaKeywords || '',
      introContent: c.introContent || '', seoContent: c.seoContent || '',
      faqs: c.faqs || [],
    });
    setCityImageUrl(c.imageUrl || '');
    setCityModalTab('basic');
    setError('');
    setCityModal({ open: true, editing: c });
  }
  async function saveCity() {
    if (!cityForm.name.trim() || !cityForm.stateId) { setError('Name and State are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: cityForm.name.trim(), stateId: cityForm.stateId, isFeatured: cityForm.isFeatured,
        imageUrl: cityImageUrl || undefined,
        slug: cityForm.slug || null, h1: cityForm.h1 || null,
        metaTitle: cityForm.metaTitle || null, metaDescription: cityForm.metaDescription || null,
        metaKeywords: cityForm.metaKeywords || null, introContent: cityForm.introContent || null,
        seoContent: cityForm.seoContent || null, faqs: cityForm.faqs?.length ? cityForm.faqs : null,
      };
      if (cityModal.editing) {
        await adminLocationsApi.updateCity(cityModal.editing.id, payload);
      } else {
        await adminLocationsApi.createCity(payload);
      }
      setCityModal({ open: false, editing: null });
      setCityImageUrl('');
      loadCities();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save city.');
    } finally { setSaving(false); }
  }
  async function toggleCityActive(c: City) {
    setActionLoading(c.id);
    try { await adminLocationsApi.updateCity(c.id, { isActive: !c.isActive }); loadCities(); }
    finally { setActionLoading(null); }
  }
  async function deleteCity(id: string) {
    setActionLoading(id);
    try { await adminLocationsApi.deleteCity(id); setDeleteConfirm(null); loadCities(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete city.'); }
    finally { setActionLoading(null); }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage countries, states and cities with SEO</p>
        </div>
        {tab === 'states' && (
          <button onClick={openAddState} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add State</button>
        )}
        {tab === 'cities' && (
          <button onClick={openAddCity} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add City</button>
        )}
        {tab === 'countries' && (
          <button onClick={openAddCountry} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Country</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
        {(['states', 'cities', 'countries'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── STATES TAB ── */}
      {tab === 'states' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {statesLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : states.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No states found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Image', 'Name', 'Code', 'Country', 'Slug', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {states.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {s.imageUrl ? (
                        <div className="relative w-12 h-8 rounded-md overflow-hidden">
                          <OptimizedImage src={s.imageUrl} alt={s.name} fill className="object-cover" sizes="48px" />
                        </div>
                      ) : <div className="w-12 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 text-xs">—</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">{s.code}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {s.country ? <span className="flex items-center gap-1">{s.country.flag && <span>{s.country.flag}</span>}{s.country.name}</span>
                        : s.countryId ? <span className="text-gray-400 text-xs">{countries.find(c => c.id === s.countryId)?.name || '—'}</span>
                        : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{s.slug || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditState(s)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">Edit</button>
                        <button onClick={() => toggleStateActive(s)} disabled={actionLoading === s.id}
                          className={`px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 ${s.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleteConfirm({ type: 'state', id: s.id })} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CITIES TAB ── */}
      {tab === 'cities' && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
            <input type="text" placeholder="Search cities..." value={citiesSearch}
              onChange={e => { setCitiesSearch(e.target.value); setCitiesPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={filterStateId} onChange={e => { setFilterStateId(e.target.value); setCitiesPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All States</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {citiesLoading ? (
              <div className="p-8 text-center text-gray-400">Loading...</div>
            ) : cities.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No cities found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Image', 'Name', 'State', 'Slug', 'Featured', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cities.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {c.imageUrl ? (
                          <div className="relative w-12 h-8 rounded-md overflow-hidden">
                            <OptimizedImage src={c.imageUrl} alt={c.name} fill className="object-cover" sizes="48px" />
                          </div>
                        ) : <div className="w-12 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 text-xs">—</div>}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.state?.name || states.find(s => s.id === c.stateId)?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{c.slug || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        {c.isFeatured ? <span className="inline-flex px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Featured</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEditCity(c)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">Edit</button>
                          <button onClick={() => toggleCityActive(c)} disabled={actionLoading === c.id}
                            className={`px-3 py-1 rounded-md text-xs font-medium disabled:opacity-50 ${c.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setDeleteConfirm({ type: 'city', id: c.id })} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {citiesTotal > 15 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Showing {(citiesPage - 1) * 15 + 1}–{Math.min(citiesPage * 15, citiesTotal)} of {citiesTotal}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCitiesPage(p => Math.max(1, p - 1))} disabled={citiesPage === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
                  <button onClick={() => setCitiesPage(p => p + 1)} disabled={citiesPage * 15 >= citiesTotal} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── COUNTRIES TAB ── */}
      {tab === 'countries' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {countriesLoading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : countries.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No countries found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Flag', 'Name', 'Code', 'Dial Code', 'SEO Slug', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {countries.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-2xl">{c.flag || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">{c.code}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{(c as any).dialCode || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{c.seoSlug || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditCountry(c)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200">Edit</button>
                        <button onClick={() => setDeleteConfirm({ type: 'country', id: c.id })} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── STATE MODAL ── */}
      {stateModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">{stateModal.editing ? 'Edit State' : 'Add State'}</h3>
              <button onClick={() => setStateModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
            </div>
            <ModalTabBar active={stateModalTab} onChange={setStateModalTab} />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="overflow-y-auto flex-1">
              {stateModalTab === 'basic' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State Name *</label>
                    <input type="text" value={stateForm.name} onChange={e => setStateForm((f: any) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Maharashtra" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State Code *</label>
                    <input type="text" value={stateForm.code} onChange={e => setStateForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g. MH" maxLength={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Parent Country</label>
                    <select value={stateForm.countryId} onChange={e => setStateForm((f: any) => ({ ...f, countryId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Country</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.flag && `${c.flag} `}{c.name} ({c.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State Image</label>
                    {stateForm.imageUrl && (
                      <div className="mb-2 relative w-full h-28 rounded-lg overflow-hidden bg-gray-100">
                        <OptimizedImage src={stateForm.imageUrl} alt="State" fill className="object-cover" sizes="100vw" />
                        <button onClick={() => setStateForm((f: any) => ({ ...f, imageUrl: '' }))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                      </div>
                    )}
                    <label className={`cursor-pointer flex items-center gap-2 border-2 border-dashed rounded-lg p-3 text-sm transition-colors ${stateImageUploading ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600'}`}>
                      <input type="file" accept="image/*" className="hidden" disabled={stateImageUploading}
                        onChange={async e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setStateImageUploading(true);
                          try { const url = await uploadImage(file); setStateForm((f: any) => ({ ...f, imageUrl: url })); }
                          catch { alert('Image upload failed'); }
                          finally { setStateImageUploading(false); e.target.value = ''; }
                        }} />
                      {stateImageUploading ? <><span className="animate-spin">⏳</span> Uploading...</> : <>📷 Upload State Image</>}
                    </label>
                  </div>
                </div>
              ) : (
                <StateSeoTab form={stateForm} setForm={setStateForm} />
              )}
            </div>
            <div className="flex gap-3 mt-5 flex-shrink-0">
              <button onClick={saveState} disabled={saving || stateImageUploading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : stateModal.editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setStateModal({ open: false, editing: null })} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CITY MODAL ── */}
      {cityModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">{cityModal.editing ? 'Edit City' : 'Add City'}</h3>
              <button onClick={() => { setCityModal({ open: false, editing: null }); setCityImageUrl(''); }} className="text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
            </div>
            <ModalTabBar active={cityModalTab} onChange={setCityModalTab} />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="overflow-y-auto flex-1">
              {cityModalTab === 'basic' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City Name *</label>
                    <input type="text" value={cityForm.name} onChange={e => setCityForm((f: any) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Mumbai" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <select value={cityForm.stateId} onChange={e => setCityForm((f: any) => ({ ...f, stateId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select State</option>
                      {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City Image</label>
                    {cityImageUrl && (
                      <div className="mb-2 relative w-full h-28 rounded-lg overflow-hidden bg-gray-100">
                        <OptimizedImage src={cityImageUrl} alt="City" fill className="object-cover" sizes="100vw" />
                        <button onClick={() => setCityImageUrl('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors">×</button>
                      </div>
                    )}
                    <label className={`cursor-pointer flex items-center gap-2 border-2 border-dashed rounded-lg p-3 text-sm transition-colors ${imageUploading ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:border-primary-400 text-gray-500 hover:text-primary-600'}`}>
                      <input type="file" accept="image/*" className="hidden" disabled={imageUploading}
                        onChange={async e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setImageUploading(true);
                          try { const url = await uploadImage(file); setCityImageUrl(url); }
                          catch { alert('Image upload failed'); }
                          finally { setImageUploading(false); e.target.value = ''; }
                        }} />
                      {imageUploading ? <><span className="animate-spin text-base">⏳</span> Uploading...</> : <>📷 Upload City Image (JPG, PNG, WebP — max 5MB)</>}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isFeatured" checked={cityForm.isFeatured} onChange={e => setCityForm((f: any) => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                    <label htmlFor="isFeatured" className="text-sm text-gray-700">Mark as Featured City</label>
                  </div>
                </div>
              ) : (
                <CitySeoTab form={cityForm} setForm={setCityForm} />
              )}
            </div>
            <div className="flex gap-3 mt-5 flex-shrink-0">
              <button onClick={saveCity} disabled={saving || imageUploading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : cityModal.editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setCityModal({ open: false, editing: null }); setCityImageUrl(''); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── COUNTRY MODAL ── */}
      {countryModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">{countryModal.editing ? 'Edit Country' : 'Add Country'}</h3>
              <button onClick={() => setCountryModal({ open: false, editing: null })} className="text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
            </div>
            <ModalTabBar active={countryModalTab} onChange={setCountryModalTab} />
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="overflow-y-auto flex-1">
              {countryModalTab === 'basic' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Country Name *</label>
                    <input value={countryForm.name} onChange={e => setCountryForm((f: any) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. India" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Code * <span className="font-normal text-gray-400">(ISO, e.g. IN)</span></label>
                    <input value={countryForm.code} onChange={e => setCountryForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="IN" maxLength={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dial Code</label>
                    <input value={countryForm.dialCode || ''} onChange={e => setCountryForm((f: any) => ({ ...f, dialCode: e.target.value }))}
                      placeholder="+91" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Flag Emoji</label>
                    <input value={countryForm.flag || ''} onChange={e => setCountryForm((f: any) => ({ ...f, flag: e.target.value }))}
                      placeholder="🇮🇳" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              ) : (
                <CountrySeoTab form={countryForm} setForm={setCountryForm} />
              )}
            </div>
            <div className="flex gap-3 mt-5 flex-shrink-0">
              <button onClick={saveCountry} disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : countryModal.editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setCountryModal({ open: false, editing: null })} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-5">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'state') deleteState(deleteConfirm.id);
                  else if (deleteConfirm.type === 'city') deleteCity(deleteConfirm.id);
                  else if (deleteConfirm.type === 'country') deleteCountry(deleteConfirm.id);
                }}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
