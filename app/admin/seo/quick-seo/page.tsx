'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Zap, Search, Eye, CheckCircle2, AlertCircle, X, ChevronDown,
  MapPin, Building2, Tag, Globe, FileText, RefreshCw, Info,
  Plus, RotateCcw, Copy, Link2, Pencil, Trash2,
  Save, ChevronRight, Clock, Play,
} from 'lucide-react';
import { seoApi, locationsApi } from '@/lib/api';
import { FOOTER_CATEGORIES } from '@/components/layout/FooterSeoLinks';

// ── Types ─────────────────────────────────────────────────────────────────────

interface City { id: string; name: string; slug: string }
interface LocalityOption { id: string; locality: string; city: string }
interface PreviewItem {
  type: 'city' | 'locality';
  cityName: string;
  localityName: string;
  citySlug: string;
  localitySlug: string;
  slug: string;
  exists: boolean;
  previewMetaTitle: string | null;
  previewH1: string | null;
}

interface QuickSeoTemplate {
  id: string;
  name: string;
  categorySlug: string;
  slugPattern: string;
  citySlugPattern: string;
  includeCityPage: boolean;
  showInFooter: boolean;
  h1Title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  introContent: string | null;
  bottomContent: string | null;
  faqJson: { question: string; answer: string }[];
  robots: string;
  appliedCount: number;
  lastAppliedAt: string | null;
  createdAt: string;
}

const CATEGORY_SLUG_DEFAULTS: Record<string, string> = {
  buy:             'property-for-sale-in-{city}-{locality}',
  rent:            'property-for-rent-in-{city}-{locality}',
  pg:              'pg-in-{city}-{locality}',
  commercial:      'commercial-property-in-{city}-{locality}',
  industrial:      'industrial-property-in-{city}-{locality}',
  builder_project: 'new-projects-in-{city}-{locality}',
  investment:      'investment-property-in-{city}-{locality}',
  // legacy / footer-category slugs
  flats:           'flats-for-sale-in-{city}-{locality}',
  'flats-rent':    'flats-for-rent-in-{city}-{locality}',
  villas:          'villas-for-sale-in-{city}-{locality}',
  office:          'office-space-in-{city}-{locality}',
  'new-projects':  'new-projects-in-{city}-{locality}',
};

const CITY_SLUG_DEFAULTS: Record<string, string> = {
  buy:             'property-for-sale-in-{city}',
  rent:            'property-for-rent-in-{city}',
  pg:              'pg-in-{city}',
  commercial:      'commercial-property-in-{city}',
  industrial:      'industrial-property-in-{city}',
  builder_project: 'new-projects-in-{city}',
  investment:      'investment-property-in-{city}',
  flats:           'flats-for-sale-in-{city}',
  'flats-rent':    'flats-for-rent-in-{city}',
  villas:          'villas-for-sale-in-{city}',
  office:          'office-space-in-{city}',
  'new-projects':  'new-projects-in-{city}',
};

const DEFAULT_PATTERN = '{category}-in-{city}-{locality}';

const PLACEHOLDER_HINT = 'Placeholders: {city}, {locality}, {category}';

// ── Small helpers ─────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'yellow' | 'blue' | 'gray' }) {
  const cls = {
    green:  'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-500',
  }[color];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>;
}

// ── City selector dropdown ────────────────────────────────────────────────────

function CitySelector({ cities, value, onChange, placeholder = 'All cities', disabled = false }: {
  cities: City[];
  value: string;
  onChange: (slug: string, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = cities.find(c => c.slug === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = cities.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 60);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => !disabled && setOpen(!open)} disabled={disabled}
        className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-sm transition-colors bg-white ${disabled ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60' : 'border-gray-200 hover:border-blue-300'}`}>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className={selected && !disabled ? 'text-gray-900 font-medium' : 'text-gray-400'}>{selected && !disabled ? selected.name : placeholder}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button type="button" onClick={() => { onChange('', ''); setOpen(false); setSearch(''); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50">— {placeholder}</button>
            {filtered.map(c => (
              <button key={c.id} type="button" onClick={() => { onChange(c.slug, c.name); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${value === c.slug ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-800'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Locality selector ─────────────────────────────────────────────────────────

function LocalitySelector({ cityName, value, onChange, disabled = false, placeholder }: {
  cityName: string;
  value: string;
  onChange: (localitySlug: string, localityName: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<LocalityOption[]>([]);
  const [search, setSearch]   = useState('');
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityName || disabled) { setOptions([]); return; }
    setLoading(true);
    locationsApi.getLocalities(cityName, undefined, search || undefined)
      .then(r => setOptions((r.data || []).slice(0, 100)))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [cityName, search, disabled]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toSlug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

  const select = (opt: LocalityOption) => {
    setSearch(opt.locality);
    onChange(toSlug(opt.locality), opt.locality);
    setOpen(false);
  };

  const derivedPlaceholder = placeholder ?? (cityName ? `All localities in ${cityName}` : 'Select city first');

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={disabled ? '' : search}
          onChange={e => { if (disabled) return; setSearch(e.target.value); setOpen(true); if (!e.target.value) onChange('', ''); }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          placeholder={derivedPlaceholder}
          disabled={disabled || !cityName}
          className={`w-full border rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${disabled ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60' : 'border-gray-200 disabled:bg-gray-50 disabled:text-gray-400'}`}
        />
        {search && (
          <button type="button" onClick={() => { setSearch(''); onChange('', ''); }}
            className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
        )}
      </div>
      {open && cityName && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          <button type="button" onClick={() => { setSearch(''); onChange('', ''); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 border-b border-gray-100">
            — All localities (bulk apply)
          </button>
          {loading ? <div className="p-3 text-xs text-gray-400 text-center">Loading...</div>
            : options.length === 0 ? <div className="p-3 text-xs text-gray-400 text-center">No localities found</div>
            : options.map((opt, i) => (
              <button key={i} type="button" onClick={() => select(opt)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors">{opt.locality}</button>
            ))}
        </div>
      )}
    </div>
  );
}

// ── FAQ Editor ────────────────────────────────────────────────────────────────

function FaqEditor({ faqs, onChange }: {
  faqs: { question: string; answer: string }[];
  onChange: (v: { question: string; answer: string }[]) => void;
}) {
  const add    = () => onChange([...faqs, { question: '', answer: '' }]);
  const remove = (i: number) => onChange(faqs.filter((_, idx) => idx !== i));
  const update = (i: number, key: 'question' | 'answer', val: string) => {
    const next = [...faqs]; next[i] = { ...next[i], [key]: val }; onChange(next);
  };
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-600 rounded"><X className="w-3.5 h-3.5" /></button>
          </div>
          <input value={faq.question} onChange={e => update(i, 'question', e.target.value)} placeholder="Question (supports {city}, {locality})"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          <textarea value={faq.answer} onChange={e => update(i, 'answer', e.target.value)} placeholder="Answer (supports {city}, {locality})" rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EMPTY_TEMPLATE = {
  h1Title: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  introContent: '',
  bottomContent: '',
  faqJson: [] as { question: string; answer: string }[],
  robots: 'index,follow',
};

export default function QuickSeoPage() {
  const [cities, setCities]             = useState<City[]>([]);
  const [categories, setCategories]     = useState<{ value: string; label: string; short: string }[]>([]);

  // Selection
  const [categorySlug, setCategorySlug] = useState('');
  const [citySlug, setCitySlug]         = useState('');
  const [cityName, setCityName]         = useState('');
  const [localitySlug, setLocalitySlug] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [slugPattern, setSlugPattern]   = useState(DEFAULT_PATTERN);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [allCities, setAllCities]                   = useState(false);
  const [allLocalities, setAllLocalities]           = useState(false);
  const [showInFooter, setShowInFooter]             = useState(true);
  const [includeCityPage, setIncludeCityPage]       = useState(false);
  const [citySlugPattern, setCitySlugPattern]       = useState('{category}-in-{city}');

  // Template
  const [template, setTemplate] = useState({ ...EMPTY_TEMPLATE });

  // Preview
  const [previewing, setPreviewing]       = useState(false);
  const [previewData, setPreviewData]     = useState<{ total: number; items: PreviewItem[] } | null>(null);
  const [previewError, setPreviewError]   = useState('');

  // Apply
  const [showConfirm, setShowConfirm]     = useState(false);
  const [applying, setApplying]           = useState(false);
  const [applyResult, setApplyResult]     = useState<{ created: number; updated: number; skipped: number; failed: number; total: number } | null>(null);

  // Tab
  const [tab, setTab] = useState<'template' | 'preview'>('template');

  // Templates
  const [templates, setTemplates]             = useState<QuickSeoTemplate[]>([]);
  const [templatesOpen, setTemplatesOpen]     = useState(true);
  const [savingTpl, setSavingTpl]             = useState(false);
  const [saveNameInput, setSaveNameInput]     = useState('');
  const [showSaveInput, setShowSaveInput]     = useState(false);
  const [applyingTplId, setApplyingTplId]     = useState<string | null>(null);
  const [deletingTplId, setDeletingTplId]     = useState<string | null>(null);

  // Apply-template modal (city picker)
  const [tplApplyModal, setTplApplyModal] = useState<{ tpl: QuickSeoTemplate } | null>(null);
  const [tplApplyCity, setTplApplyCity]   = useState('');
  const [tplApplyCityName, setTplApplyCityName] = useState('');
  const [tplApplyOverwrite, setTplApplyOverwrite] = useState(false);

  const loadTemplates = useCallback(() => {
    seoApi.adminListTemplates()
      .then(r => setTemplates(r.data || []))
      .catch(() => {});
  }, []);

  // Load cities & categories on mount
  useEffect(() => {
    const toSlug = (s: string) =>
      s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

    locationsApi.getCities(undefined, 300)
      .then(r => {
        const mapped = (r.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || toSlug(c.name),
        }));
        setCities(mapped);
      })
      .catch(() => {});
    seoApi.adminGetFooterCategories()
      .then(r => {
        const dbCats = r.data || [];
        const cats = dbCats.length > 0
          ? dbCats.map((c: any) => ({ value: c.value, label: c.label, short: c.short }))
          : FOOTER_CATEGORIES.map(c => ({ value: c.value, label: c.label, short: c.short }));
        setCategories(cats);
      })
      .catch(() => setCategories(FOOTER_CATEGORIES.map(c => ({ value: c.value, label: c.label, short: c.short }))));
    loadTemplates();
  }, []);

  // Auto-set slug patterns when category changes
  useEffect(() => {
    if (categorySlug && CATEGORY_SLUG_DEFAULTS[categorySlug]) {
      setSlugPattern(CATEGORY_SLUG_DEFAULTS[categorySlug]);
    } else if (categorySlug) {
      setSlugPattern(`${categorySlug}-in-{city}-{locality}`);
    } else {
      setSlugPattern(DEFAULT_PATTERN);
    }
    if (categorySlug && CITY_SLUG_DEFAULTS[categorySlug]) {
      setCitySlugPattern(CITY_SLUG_DEFAULTS[categorySlug]);
    } else if (categorySlug) {
      setCitySlugPattern(`${categorySlug}-in-{city}`);
    } else {
      setCitySlugPattern('{category}-in-{city}');
    }
  }, [categorySlug]);

  const tF = (key: keyof typeof EMPTY_TEMPLATE, val: any) => setTemplate(t => ({ ...t, [key]: val }));

  const catShort = categories.find(c => c.value === categorySlug)?.short ?? categorySlug;
  const scopeLabel = !categorySlug
    ? 'Select a category to start'
    : allCities
    ? `All cities, all localities — ${catShort}`
    : !citySlug
    ? `All cities — ${catShort}`
    : allLocalities
    ? `All localities in ${cityName} — ${catShort}`
    : !localitySlug
    ? `All localities in ${cityName} — ${catShort}`
    : `${localityName}, ${cityName} — ${catShort}`;

  const canPreview = !!categorySlug;

  const doPreview = useCallback(async () => {
    if (!canPreview) return;
    setPreviewing(true);
    setPreviewError('');
    setPreviewData(null);
    try {
      const r = await seoApi.adminQuickSeoPreview({
        categorySlug,
        citySlug: citySlug || undefined,
        localitySlug: localitySlug || undefined,
        slugPattern,
        citySlugPattern,
        includeCityPage,
        template,
      });
      setPreviewData(r.data);
      setTab('preview');
    } catch (e: any) {
      setPreviewError(e?.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  }, [canPreview, categorySlug, citySlug, localitySlug, slugPattern, citySlugPattern, includeCityPage, template]);

  const doApply = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      const r = await seoApi.adminQuickSeoApply({
        categorySlug,
        citySlug: citySlug || undefined,
        localitySlug: localitySlug || undefined,
        slugPattern,
        citySlugPattern,
        includeCityPage,
        showInFooter,
        overwriteExisting,
        template,
      });
      setApplyResult(r.data);
      setShowConfirm(false);
      setPreviewData(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const resetAll = () => {
    setCategorySlug(''); setCitySlug(''); setCityName(''); setLocalitySlug(''); setLocalityName('');
    setAllCities(false); setAllLocalities(false);
    setSlugPattern(DEFAULT_PATTERN);
    setCitySlugPattern('{category}-in-{city}');
    setIncludeCityPage(false);
    setShowInFooter(true);
    setTemplate({ ...EMPTY_TEMPLATE });
    setPreviewData(null);
    setApplyResult(null);
    setTab('template');
  };

  // ── Template helpers ───────────────────────────────────────────────────────

  const loadTemplate = (t: QuickSeoTemplate) => {
    setCategorySlug(t.categorySlug);
    setSlugPattern(t.slugPattern || DEFAULT_PATTERN);
    setCitySlugPattern(t.citySlugPattern || '{category}-in-{city}');
    setIncludeCityPage(t.includeCityPage);
    setShowInFooter(t.showInFooter);
    setTemplate({
      h1Title:         t.h1Title         || '',
      metaTitle:       t.metaTitle       || '',
      metaDescription: t.metaDescription || '',
      metaKeywords:    t.metaKeywords    || '',
      canonicalUrl:    t.canonicalUrl    || '',
      introContent:    t.introContent    || '',
      bottomContent:   t.bottomContent   || '',
      faqJson:         t.faqJson         || [],
      robots:          t.robots          || 'index,follow',
    });
    setPreviewData(null);
    setTab('template');
  };

  const saveTemplate = async () => {
    if (!saveNameInput.trim() || !categorySlug) return;
    setSavingTpl(true);
    try {
      await seoApi.adminSaveTemplate({
        name:            saveNameInput.trim(),
        categorySlug,
        slugPattern,
        citySlugPattern,
        includeCityPage,
        showInFooter,
        ...template,
      });
      setSaveNameInput('');
      setShowSaveInput(false);
      loadTemplates();
    } catch {
      alert('Failed to save template');
    } finally {
      setSavingTpl(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setDeletingTplId(id);
    try {
      await seoApi.adminDeleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('Failed to delete template');
    } finally {
      setDeletingTplId(null);
    }
  };

  const openTplApplyModal = (t: QuickSeoTemplate) => {
    setTplApplyModal({ tpl: t });
    setTplApplyCity('');
    setTplApplyCityName('');
    setTplApplyOverwrite(false);
  };

  const confirmTplApply = async () => {
    if (!tplApplyModal) return;
    const t = tplApplyModal.tpl;
    setApplyingTplId(t.id);
    try {
      const r = await seoApi.adminApplyTemplate(t.id, {
        citySlug:         tplApplyCity || undefined,
        overwriteExisting: tplApplyOverwrite,
      });
      setApplyResult(r.data);
      setTplApplyModal(null);
      loadTemplates();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Apply failed');
    } finally {
      setApplyingTplId(null);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400';
  const textareaCls = `${inputCls} resize-y`;

  return (
    <div className="p-6 max-w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SEO Templates</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">
            Bulk-apply SEO content with dynamic placeholders across cities, categories &amp; localities.
          </p>
        </div>
        <button onClick={resetAll}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* ── Result banner ──────────────────────────────────────────────────── */}
      {applyResult && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">SEO Template applied successfully!</p>
            <div className="flex gap-4 mt-1.5 text-xs text-green-700">
              <span>Created: <strong>{applyResult.created}</strong></span>
              <span>Updated: <strong>{applyResult.updated}</strong></span>
              <span>Skipped: <strong>{applyResult.skipped}</strong></span>
              {applyResult.failed > 0 && <span className="text-red-600">Failed: <strong>{applyResult.failed}</strong></span>}
              <span className="text-green-500">Total: {applyResult.total}</span>
            </div>
          </div>
          <button onClick={() => setApplyResult(null)} className="p-1 text-green-500 hover:text-green-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Saved Templates panel ──────────────────────────────────────────── */}
      <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setTemplatesOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-gray-800">Saved Templates</span>
            {templates.length > 0 && (
              <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{templates.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {categorySlug && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowSaveInput(s => !s); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save current as template
              </button>
            )}
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${templatesOpen ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Save name input */}
        {showSaveInput && categorySlug && (
          <div className="px-5 pb-3 pt-1 border-t border-gray-100 flex items-center gap-2">
            <input
              autoFocus
              value={saveNameInput}
              onChange={e => setSaveNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTemplate(); if (e.key === 'Escape') setShowSaveInput(false); }}
              placeholder={`e.g. Flats for Sale — ${categories.find(c => c.value === categorySlug)?.short ?? categorySlug} template`}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button onClick={saveTemplate} disabled={savingTpl || !saveNameInput.trim()}
              className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
              {savingTpl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
            <button onClick={() => setShowSaveInput(false)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {templatesOpen && (
          <div className="border-t border-gray-100">
            {templates.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">
                No templates saved yet. Fill in the SEO template below and click <strong>Save current as template</strong>.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {templates.map(t => {
                  const cat = categories.find(c => c.value === t.categorySlug);
                  const isApplying = applyingTplId === t.id;
                  const isDeleting = deletingTplId === t.id;
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 truncate">{t.name}</span>
                          {cat && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                              {cat.short}
                            </span>
                          )}
                          {t.showInFooter && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <Link2 className="w-3 h-3" /> Footer
                            </span>
                          )}
                          {t.includeCityPage && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3" /> +City
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          <span className="font-mono truncate max-w-[200px]">{t.slugPattern}</span>
                          {t.appliedCount > 0 && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Applied {t.appliedCount}×</span>
                          )}
                          {t.lastAppliedAt && (
                            <span>{new Date(t.lastAppliedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => loadTemplate(t)} title="Load into form"
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Load
                        </button>
                        <button onClick={() => openTplApplyModal(t)} disabled={isApplying} title="Apply to a city (creates pages for all localities)"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
                          {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          {isApplying ? 'Applying…' : 'Apply to City'}
                        </button>
                        <button onClick={() => deleteTemplate(t.id)} disabled={isDeleting} title="Delete template"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                          {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: Selection controls ──────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">

          {/* Scope card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-500" /> Scope Selection
            </h2>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select value={categorySlug} onChange={e => { setCategorySlug(e.target.value); setPreviewData(null); }}
                className={inputCls}>
                <option value="">— Select category —</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.short} — {c.label}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">City</label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allCities}
                    onChange={e => {
                      setAllCities(e.target.checked);
                      if (e.target.checked) { setCitySlug(''); setCityName(''); setLocalitySlug(''); setLocalityName(''); setAllLocalities(true); }
                      setPreviewData(null);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-blue-600">All cities</span>
                </label>
              </div>
              <CitySelector
                cities={cities}
                value={citySlug}
                placeholder={allCities ? '— All cities selected —' : 'All cities'}
                onChange={(slug, name) => { setCitySlug(slug); setCityName(name); setLocalitySlug(''); setLocalityName(''); setAllLocalities(false); setPreviewData(null); }}
                disabled={allCities}
              />
              {allCities && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pages will be created for <strong>all {cities.length} cities</strong>
                </p>
              )}
            </div>

            {/* Locality */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Locality</label>
                <label className={`flex items-center gap-1.5 cursor-pointer select-none ${!categorySlug ? 'opacity-40 pointer-events-none' : ''}`}>
                  <input
                    type="checkbox"
                    checked={allLocalities}
                    onChange={e => {
                      setAllLocalities(e.target.checked);
                      if (e.target.checked) { setLocalitySlug(''); setLocalityName(''); }
                      setPreviewData(null);
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    disabled={!categorySlug}
                  />
                  <span className="text-xs font-medium text-green-600">All localities</span>
                </label>
              </div>
              <LocalitySelector
                cityName={allLocalities ? '' : cityName}
                value={localitySlug}
                onChange={(slug, name) => { setLocalitySlug(slug); setLocalityName(name); setPreviewData(null); }}
                disabled={allLocalities}
                placeholder={allLocalities ? (cityName ? `All localities in ${cityName}` : 'All localities') : undefined}
              />
              {allLocalities && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {cityName
                    ? <>Pages will be created for <strong>all localities in {cityName}</strong></>
                    : <>Pages will be created for <strong>all localities across all cities</strong></>}
                </p>
              )}
            </div>

            {/* Scope summary */}
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${categorySlug ? 'bg-violet-50 text-violet-700' : 'bg-gray-50 text-gray-400'}`}>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{scopeLabel}</span>
            </div>
          </div>

          {/* Slug pattern */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> URL Slug Pattern
            </h2>
            <div>
              <input value={slugPattern} onChange={e => setSlugPattern(e.target.value)}
                placeholder="e.g. property-for-sale-in-{city}-{locality}"
                className={`${inputCls} font-mono text-xs`} />
              <p className="text-xs text-gray-400 mt-1">Placeholders: <code className="bg-gray-100 px-1 rounded">{'{city}'}</code> <code className="bg-gray-100 px-1 rounded">{'{locality}'}</code> <code className="bg-gray-100 px-1 rounded">{'{category}'}</code></p>
            </div>
            {slugPattern && (
              <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 font-mono break-all">
                {slugPattern
                  .replace('{category}', categorySlug || '{category}')
                  .replace('{city}', citySlug || '{city}')
                  .replace('{locality}', localitySlug || '{locality}')}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-700">Options</h2>

            {/* Show in footer */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={showInFooter} onChange={e => setShowInFooter(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              <div>
                <div className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-sm font-medium text-gray-700">Show in footer SEO links</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Generated links will appear in the public site footer under their category tab.</p>
              </div>
            </label>

            {/* Include city-level pages */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={includeCityPage} onChange={e => { setIncludeCityPage(e.target.checked); setPreviewData(null); }}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Include city-level pages</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Also create one footer link per city (without locality), e.g. <em>properties-in-gurgaon</em>.</p>
              </div>
            </label>

            {/* City slug pattern (shown when includeCityPage is on) */}
            {includeCityPage && (
              <div className="pl-7 space-y-1">
                <label className="block text-xs font-semibold text-gray-600">City URL Slug Pattern</label>
                <input value={citySlugPattern} onChange={e => setCitySlugPattern(e.target.value)}
                  placeholder="e.g. property-for-sale-in-{city}"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-400" />
                <p className="text-xs text-gray-400">Placeholders: <code className="bg-gray-100 px-1 rounded">{'{city}'}</code> <code className="bg-gray-100 px-1 rounded">{'{category}'}</code></p>
                {citySlugPattern && (
                  <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-700 font-mono break-all">
                    {citySlugPattern
                      .replace('{category}', categorySlug || '{category}')
                      .replace('{city}', citySlug || '{city}')}
                  </div>
                )}
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Overwrite existing */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={overwriteExisting} onChange={e => setOverwriteExisting(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              <div>
                <span className="text-sm font-medium text-gray-700">Overwrite existing pages</span>
                <p className="text-xs text-gray-400 mt-0.5">If disabled, existing footer SEO link entries will be skipped.</p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button onClick={doPreview} disabled={!canPreview || previewing}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
              {previewing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {previewing ? 'Generating preview…' : 'Preview'}
            </button>
            <button onClick={() => setShowConfirm(true)} disabled={!canPreview || !previewData || applying}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm">
              <Zap className="w-4 h-4" />
              Apply SEO Template {previewData ? `(${previewData.total} pages)` : ''}
            </button>
          </div>
        </div>

        {/* ── Right: Template + Preview ─────────────────────────────────────── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">

          {/* Tabs */}
          <div className="px-5 pt-4 pb-0 border-b border-gray-100 flex items-center gap-1">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(['template', 'preview'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'template' ? <><FileText className="w-3.5 h-3.5" /> SEO Template</>
                    : <><Eye className="w-3.5 h-3.5" /> Preview
                        {previewData && <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{previewData.total}</span>}
                      </>
                  }
                </button>
              ))}
            </div>
            <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <Info className="w-3 h-3" /> {PLACEHOLDER_HINT}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* ── Template tab ──────────────────────────────────────────────── */}
            {tab === 'template' && (
              <div className="space-y-5">

                {/* Meta section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-800">Meta Tags</h3>
                    <span className="text-xs text-gray-400">(shown in Google)</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        H1 Title <span className="text-gray-400 font-normal ml-1">(page heading)</span>
                      </label>
                      <input value={template.h1Title} onChange={e => tF('h1Title', e.target.value)}
                        placeholder="e.g. Properties for Sale in {locality}, {city}"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Meta Title <span className="text-gray-400 font-normal ml-1">(60 chars)</span>
                      </label>
                      <input value={template.metaTitle} onChange={e => tF('metaTitle', e.target.value)}
                        placeholder="e.g. {locality} Properties for Sale | {city} Real Estate"
                        className={inputCls} />
                      {template.metaTitle && (
                        <p className="text-xs text-gray-400 mt-0.5">{template.metaTitle.length} chars</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Meta Description <span className="text-gray-400 font-normal ml-1">(160 chars)</span>
                      </label>
                      <textarea value={template.metaDescription} onChange={e => tF('metaDescription', e.target.value)}
                        placeholder="e.g. Find the best properties for sale in {locality}, {city}. Browse verified listings..."
                        rows={3} className={textareaCls} />
                      {template.metaDescription && (
                        <p className={`text-xs mt-0.5 ${template.metaDescription.length > 160 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {template.metaDescription.length} chars
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Keywords</label>
                      <input value={template.metaKeywords} onChange={e => tF('metaKeywords', e.target.value)}
                        placeholder="e.g. properties {locality}, buy property {city}, {locality} real estate"
                        className={inputCls} />
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Technical SEO */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-800">Technical SEO</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Canonical URL</label>
                      <input value={template.canonicalUrl} onChange={e => tF('canonicalUrl', e.target.value)}
                        placeholder="Leave empty for auto" className={`${inputCls} font-mono text-xs`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Robots</label>
                      <select value={template.robots} onChange={e => tF('robots', e.target.value)} className={inputCls}>
                        <option value="index,follow">index, follow</option>
                        <option value="noindex,follow">noindex, follow</option>
                        <option value="index,nofollow">index, nofollow</option>
                        <option value="noindex,nofollow">noindex, nofollow</option>
                      </select>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Page content */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-bold text-gray-800">Page Content</h3>
                    <span className="text-xs text-gray-400">(supports HTML &amp; placeholders)</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Intro Content <span className="text-gray-400 font-normal">(above listings)</span></label>
                      <textarea value={template.introContent} onChange={e => tF('introContent', e.target.value)}
                        placeholder="<p>Looking for properties in {locality}, {city}? Browse...</p>"
                        rows={5} className={textareaCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Bottom Content <span className="text-gray-400 font-normal">(below listings)</span></label>
                      <textarea value={template.bottomContent} onChange={e => tF('bottomContent', e.target.value)}
                        placeholder="<h2>About {locality}</h2><p>...</p>"
                        rows={6} className={textareaCls} />
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* FAQs */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-bold text-gray-800">FAQs</h3>
                    <span className="text-xs text-gray-400">(generates FAQ schema markup)</span>
                  </div>
                  <FaqEditor faqs={template.faqJson} onChange={v => tF('faqJson', v)} />
                </section>

              </div>
            )}

            {/* ── Preview tab ────────────────────────────────────────────────── */}
            {tab === 'preview' && (
              <div>
                {previewing && (
                  <div className="flex items-center justify-center py-20 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Generating preview…
                  </div>
                )}
                {previewError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {previewError}
                  </div>
                )}
                {!previewing && !previewError && !previewData && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Eye className="w-10 h-10 mb-3 text-gray-200" />
                    <p className="text-sm">Click &ldquo;Preview&rdquo; to see pages that will be generated.</p>
                  </div>
                )}
                {previewData && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">{previewData.total} pages</span>
                      <Badge color="green">{previewData.items.filter(i => !i.exists).length} new</Badge>
                      <Badge color="yellow">{previewData.items.filter(i => i.exists).length} existing</Badge>
                      {includeCityPage && <Badge color="blue">{previewData.items.filter(i => i.type === 'city').length} city</Badge>}
                      <Badge color="gray">{previewData.items.filter(i => i.type === 'locality').length} locality</Badge>
                      {showInFooter
                        ? <span className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full font-medium"><Link2 className="w-3 h-3" /> Visible in footer</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Hidden from footer</span>}
                    </div>

                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            {['Type', 'Location', 'City', 'URL Slug', 'Meta Title Preview', 'Footer Status'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {previewData.items.map((item, i) => (
                            <tr key={i} className={`hover:bg-gray-50/60 ${item.exists ? 'bg-yellow-50/30' : ''}`}>
                              <td className="px-5 py-2.5">
                                {item.type === 'city'
                                  ? <Badge color="blue">City</Badge>
                                  : <Badge color="gray">Locality</Badge>}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[120px]">
                                <span className="block truncate">{item.type === 'city' ? item.cityName : item.localityName || '—'}</span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-600 text-xs">{item.cityName}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs font-mono max-w-[180px]">
                                <div className="flex items-center gap-1">
                                  <span className="truncate">{item.slug}</span>
                                  <button onClick={() => navigator.clipboard?.writeText(item.slug)}
                                    className="flex-shrink-0 p-0.5 text-gray-300 hover:text-gray-500">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[200px]">
                                <span className="block truncate">{item.previewMetaTitle || <span className="italic text-gray-300">—</span>}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                {item.exists
                                  ? <Badge color="yellow">Will update</Badge>
                                  : <Badge color="green">New</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm modal ──────────────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-violet-100 rounded-xl">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Apply SEO Template?</h3>
                <p className="text-xs text-gray-500 mt-0.5">{scopeLabel}</p>
              </div>
            </div>

            {previewData && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total pages</span>
                  <span className="font-semibold">{previewData.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">New pages</span>
                  <span className="font-semibold text-green-700">{previewData.items.filter(i => !i.exists).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Existing pages</span>
                  <span className="font-semibold text-yellow-700">{previewData.items.filter(i => i.exists).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Show in footer</span>
                  <span className={`font-semibold ${showInFooter ? 'text-violet-600' : 'text-gray-500'}`}>
                    {showInFooter ? 'Yes (visible)' : 'No (hidden)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City-level pages</span>
                  <span className={`font-semibold ${includeCityPage ? 'text-blue-600' : 'text-gray-500'}`}>
                    {includeCityPage ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="text-gray-600">Overwrite existing</span>
                  <span className={`font-semibold ${overwriteExisting ? 'text-orange-600' : 'text-gray-500'}`}>
                    {overwriteExisting ? 'Yes' : 'No (skip)'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={doApply} disabled={applying}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {applying ? <><RefreshCw className="w-4 h-4 animate-spin" /> Applying…</> : <><Zap className="w-4 h-4" /> Apply Now</>}
              </button>
              <button onClick={() => setShowConfirm(false)} disabled={applying}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply-template city picker modal ──────────────────────────────────── */}
      {tplApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-violet-100 rounded-xl">
                <Play className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Apply Template to City</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{tplApplyModal.tpl.name}</p>
              </div>
              <button onClick={() => setTplApplyModal(null)} className="ml-auto p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  City <span className="text-gray-400 font-normal">(leave blank to apply to all cities)</span>
                </label>
                <CitySelector
                  cities={cities}
                  value={tplApplyCity}
                  placeholder="All cities"
                  onChange={(slug, name) => { setTplApplyCity(slug); setTplApplyCityName(name); }}
                />
                {tplApplyCity && (
                  <p className="text-xs text-violet-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Will create pages for <strong>all localities in {tplApplyCityName}</strong>
                  </p>
                )}
                {!tplApplyCity && (
                  <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    No city selected — will run for all cities and all their localities
                  </p>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Slug pattern</span>
                  <span className="font-mono text-gray-700 truncate max-w-[200px]">{tplApplyModal.tpl.slugPattern}</span>
                </div>
                {tplApplyModal.tpl.includeCityPage && (
                  <div className="flex justify-between">
                    <span>City pages</span>
                    <span className="text-blue-600 font-medium">Included</span>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={tplApplyOverwrite} onChange={e => setTplApplyOverwrite(e.target.checked)}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm text-gray-700">Overwrite existing pages</span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={confirmTplApply}
                disabled={!!applyingTplId}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {applyingTplId ? <><RefreshCw className="w-4 h-4 animate-spin" /> Applying…</> : <><Zap className="w-4 h-4" /> Apply Now</>}
              </button>
              <button onClick={() => setTplApplyModal(null)} disabled={!!applyingTplId}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
