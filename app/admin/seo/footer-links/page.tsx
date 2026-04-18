'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Link2, X, Search, Globe, FileText,
  MapPin, ChevronDown, Building2, ArrowLeftRight, FolderInput, Tag,
} from 'lucide-react';
import { seoApi, locationsApi } from '@/lib/api';
import { FOOTER_CATEGORIES } from '@/components/layout/FooterSeoLinks';

// ── types ─────────────────────────────────────────────────────────────────────

interface City { id: string; name: string; slug?: string }
interface LocalityOption { id: string; locality: string; city: string }

interface FooterLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
  groupId?: string;
  localityId?: string;
  localityName?: string;
  h1Title?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  introContent?: string;
  bottomContent?: string;
  faqJson?: { question: string; answer: string }[];
  robots?: string;
}
interface FooterGroup {
  id: string;
  title: string;
  cityId?: string;
  cityName?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  links: FooterLink[];
}

const EMPTY_LINK_FORM = {
  label: '', url: '', sortOrder: 0, isActive: true, groupId: '',
  localityId: '', localityName: '',
  h1Title: '', metaTitle: '', metaDescription: '', metaKeywords: '',
  canonicalUrl: '', introContent: '', bottomContent: '',
  faqJson: [] as { question: string; answer: string }[],
  robots: 'index,follow',
};
type LinkForm = typeof EMPTY_LINK_FORM;

function hasSeo(link: FooterLink) {
  return !!(link.metaTitle || link.h1Title || link.introContent || link.bottomContent);
}

// ── FAQ Editor ─────────────────────────────────────────────────────────────────
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
          <input value={faq.question} onChange={e => update(i, 'question', e.target.value)} placeholder="Question"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          <textarea value={faq.answer} onChange={e => update(i, 'answer', e.target.value)} placeholder="Answer" rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
}

// ── Locality Picker ────────────────────────────────────────────────────────────
function LocalityPicker({ cityName, value, onChange }: {
  cityName: string;
  value: string;
  onChange: (localityName: string, localityId?: string) => void;
}) {
  const [options, setOptions] = useState<LocalityOption[]>([]);
  const [search, setSearch]   = useState(value || '');
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityName) { setOptions([]); return; }
    setLoading(true);
    locationsApi.getLocalities(cityName, undefined, search || undefined)
      .then(r => setOptions((r.data || []).slice(0, 60)))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [cityName, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (opt: LocalityOption) => { setSearch(opt.locality); onChange(opt.locality, opt.id); setOpen(false); };
  const clear  = () => { setSearch(''); onChange('', ''); };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Locality <span className="text-gray-400 font-normal">(from database)</span>
      </label>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); onChange(e.target.value, ''); }}
          onFocus={() => setOpen(true)}
          placeholder={cityName ? `Search localities in ${cityName}` : 'Select city in group first'}
          disabled={!cityName}
          className="w-full border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
        />
        {search && (
          <button type="button" onClick={clear} className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
        )}
      </div>
      {open && cityName && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
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

// ── City Picker ────────────────────────────────────────────────────────────────
function CityPicker({ cities, value, onChange }: {
  cities: City[];
  value: string;
  onChange: (cityName: string, cityId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = cities.find(c => c.name === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = cities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-gray-400 font-normal">(optional)</span></label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 text-sm hover:border-blue-300 transition-colors bg-white">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected ? selected.name : 'Select city...'}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button type="button" onClick={() => { onChange('', ''); setOpen(false); setSearch(''); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50">— No city</button>
            {filtered.map(c => (
              <button key={c.id} type="button" onClick={() => { onChange(c.name, c.id); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${value === c.name ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-800'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Remap Slide-Over ───────────────────────────────────────────────────────────
function RemapSlideOver({
  open, onClose,
  mode,             // 'group' | 'link'
  target,           // the group or link being remapped
  allGroups,
  cities,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'group' | 'link';
  target: FooterGroup | FooterLink | null;
  allGroups: FooterGroup[];
  cities: City[];
  onSaved: () => void;
}) {
  // --- group remap state ---
  const [newCityName, setNewCityName]   = useState('');
  const [newCityId, setNewCityId]       = useState('');
  const [newCategory, setNewCategory]   = useState('');

  // --- link remap state ---
  const [newGroupId, setNewGroupId]     = useState('');
  const [newLocalityName, setNewLocalityName] = useState('');
  const [newLocalityId, setNewLocalityId]     = useState('');
  // city context for locality picker (derived from selected group)
  const [localityCityCtx, setLocalityCityCtx] = useState('');

  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<'city' | 'locality' | 'group' | 'category'>('city');

  // reset when opened
  useEffect(() => {
    if (!open || !target) return;
    if (mode === 'group') {
      const g = target as FooterGroup;
      setNewCityName(g.cityName || '');
      setNewCityId(g.cityId || '');
      setNewCategory(g.category || '');
      setSection('city');
    } else {
      const l = target as FooterLink;
      setNewGroupId(l.groupId || '');
      setNewLocalityName(l.localityName || '');
      setNewLocalityId(l.localityId || '');
      // find parent group for city ctx
      const pg = allGroups.find(g => g.links.some(lnk => lnk.id === l.id));
      setLocalityCityCtx(pg?.cityName || '');
      setSection('group');
    }
  }, [open, target, mode, allGroups]);

  // when link's group changes, update city context for locality picker
  useEffect(() => {
    if (mode !== 'link') return;
    const g = allGroups.find(g => g.id === newGroupId);
    setLocalityCityCtx(g?.cityName || '');
  }, [newGroupId, allGroups, mode]);

  if (!open || !target) return null;

  const saveRemap = async () => {
    setSaving(true);
    try {
      if (mode === 'group') {
        await seoApi.adminUpdateFooterGroup(target.id, {
          cityId:   newCityId   || null,
          cityName: newCityName || null,
          category: newCategory || null,
        });
      } else {
        const updates: Record<string, any> = {};
        if (newGroupId)      updates.groupId      = newGroupId;
        if (newLocalityName !== undefined) updates.localityName = newLocalityName || null;
        if (newLocalityId   !== undefined) updates.localityId   = newLocalityId   || null;
        await seoApi.adminUpdateFooterLink(target.id, updates);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to remap');
    } finally {
      setSaving(false);
    }
  };

  const targetGroup = mode === 'group' ? (target as FooterGroup) : null;
  const targetLink  = mode === 'link'  ? (target as FooterLink)  : null;
  const selectedNewGroup = allGroups.find(g => g.id === newGroupId);

  const tabs = mode === 'group'
    ? [
        { key: 'city'     as const, label: 'Remap City' },
        { key: 'category' as const, label: 'Remap Category' },
      ]
    : [
        { key: 'group'    as const, label: 'Move to Group' },
        { key: 'locality' as const, label: 'Remap Locality / City' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-violet-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <ArrowLeftRight className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Remap {mode === 'group' ? 'Group' : 'Link'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">
                {mode === 'group' ? (targetGroup?.title) : (targetLink?.label)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current mapping banner */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Mapping</p>
          <div className="flex flex-wrap gap-2">
            {mode === 'group' && (
              <>
                {targetGroup?.category
                  ? <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      <Tag className="w-3 h-3" /> {FOOTER_CATEGORIES.find(c => c.value === targetGroup.category)?.short ?? targetGroup.category}
                    </span>
                  : <span className="text-xs text-amber-600 italic">No category (auto)</span>
                }
                {targetGroup?.cityName
                  ? <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <MapPin className="w-3 h-3" /> City: {targetGroup.cityName}
                    </span>
                  : <span className="text-xs text-gray-400 italic">No city</span>
                }
              </>
            )}
            {mode === 'link' && (
              <>
                {(() => {
                  const pg = allGroups.find(g => g.links.some(l => l.id === target.id));
                  return pg
                    ? <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        <FolderInput className="w-3 h-3" /> Group: {pg.title}
                      </span>
                    : null;
                })()}
                {targetLink?.localityName
                  ? <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      <MapPin className="w-3 h-3" /> Locality: {targetLink.localityName}
                    </span>
                  : <span className="text-xs text-gray-400 italic">No locality mapped</span>
                }
              </>
            )}
          </div>
        </div>

        {/* Section tabs */}
        {tabs.length > 1 && (
          <div className="px-6 pt-4 pb-0 flex-shrink-0">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setSection(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${section === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* GROUP: remap city */}
          {mode === 'group' && section === 'city' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Changing the city will move this group to a different city tab in the public footer.
                All links inside the group will still point to their existing locality mappings.
              </p>
              <CityPicker
                cities={cities}
                value={newCityName}
                onChange={(name, id) => { setNewCityName(name); setNewCityId(id); }}
              />
              {newCityName && newCityName !== (targetGroup?.cityName || '') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  ⚠️ Group will move from <strong>{targetGroup?.cityName || 'No City'}</strong> → <strong>{newCityName}</strong>
                </div>
              )}
              {!newCityName && (targetGroup?.cityName) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  ⚠️ This will remove the city mapping — group will appear under &ldquo;No City&rdquo;.
                </div>
              )}
            </div>
          )}

          {/* GROUP: remap category */}
          {mode === 'group' && section === 'category' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                The category determines which tab this group appears under in the public footer
                (e.g. &ldquo;Buy&rdquo;, &ldquo;Flats&rdquo;, &ldquo;Villas&rdquo;). If not set, it is derived from the group title.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-orange-500" /> Footer Category
                </label>
                <select value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">— Auto-detect from title —</option>
                  {FOOTER_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.short} — {c.label}</option>
                  ))}
                </select>
              </div>
              {newCategory && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
                  Tab: <strong>{FOOTER_CATEGORIES.find(c => c.value === newCategory)?.short}</strong>
                  {' '}({FOOTER_CATEGORIES.find(c => c.value === newCategory)?.label})
                </div>
              )}
              {!newCategory && targetGroup?.category && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  ⚠️ Will clear explicit category — group will fall back to title-based detection.
                </div>
              )}
            </div>
          )}

          {/* LINK: move to another group */}
          {mode === 'link' && section === 'group' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Move this link to a different group. The locality mapping will be preserved unless you also update it.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Target Group</label>
                <div className="space-y-1.5 max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-2">
                  {allGroups.map(g => {
                    const isCurrent = g.links.some(l => l.id === target.id);
                    const isSelected = g.id === newGroupId;
                    return (
                      <button key={g.id} type="button"
                        onClick={() => setNewGroupId(g.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                          isSelected ? 'bg-violet-50 ring-2 ring-violet-400'
                          : isCurrent ? 'bg-blue-50 opacity-60 cursor-default'
                          : 'hover:bg-gray-50'
                        }`}
                        disabled={isCurrent}
                      >
                        <Link2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-violet-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${isSelected ? 'text-violet-700' : 'text-gray-700'}`}>{g.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {g.cityName && (
                              <span className="text-xs text-blue-600 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{g.cityName}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{g.links?.length || 0} links</span>
                            {isCurrent && <span className="text-xs text-blue-500 font-medium">• current</span>}
                          </div>
                        </div>
                        {isSelected && <span className="text-xs text-violet-600 font-semibold flex-shrink-0">✓ Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedNewGroup && !selectedNewGroup.links.some(l => l.id === target.id) && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700">
                  Link will be moved to group: <strong>{selectedNewGroup.title}</strong>
                  {selectedNewGroup.cityName && <> (City: {selectedNewGroup.cityName})</>}
                </div>
              )}
            </div>
          )}

          {/* LINK: remap locality / city */}
          {mode === 'link' && section === 'locality' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Update which locality or city this link is associated with.
                Used for display in city-tab footer and admin filtering.
              </p>

              {/* If target group has no city, let user pick a city to use as context */}
              {!localityCityCtx && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    City context <span className="text-gray-400">(needed to search localities)</span>
                  </label>
                  <CityPicker
                    cities={cities}
                    value={newLocalityName && cities.find(c => c.name === newLocalityName) ? newLocalityName : ''}
                    onChange={(name, id) => {
                      setLocalityCityCtx(name);
                      setNewLocalityName(name);
                      setNewLocalityId(id);
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    For generic groups (no city), selecting a city here stores it as the locality mapping.
                  </p>
                </div>
              )}

              {localityCityCtx && (
                <>
                  <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    City context: <strong>{localityCityCtx}</strong>
                    <button type="button" onClick={() => { setLocalityCityCtx(''); setNewLocalityName(''); setNewLocalityId(''); }}
                      className="ml-auto text-blue-400 hover:text-blue-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <LocalityPicker
                    cityName={localityCityCtx}
                    value={newLocalityName || ''}
                    onChange={(name, id) => { setNewLocalityName(name || ''); setNewLocalityId(id || ''); }}
                  />
                </>
              )}

              {newLocalityName && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                  Will map to: <strong>{newLocalityName}</strong>
                  {localityCityCtx && <>, {localityCityCtx}</>}
                  {newLocalityId
                    ? <span className="ml-2 text-emerald-500">✓ matched in DB</span>
                    : <span className="ml-2 text-amber-600">⚠ name only (no DB row match)</span>
                  }
                </div>
              )}
              {!newLocalityName && (targetLink?.localityName) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  ⚠️ This will clear the current locality mapping ({targetLink.localityName}).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={saveRemap} disabled={saving}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            {saving ? 'Saving…' : 'Apply Remap'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Link SEO Slide-Over ────────────────────────────────────────────────────────
function LinkSlideOver({
  open, onClose, editId, form, setForm, onSave, saving, groupCityName,
}: {
  open: boolean; onClose: () => void; editId: string | null;
  form: LinkForm; setForm: (fn: (f: LinkForm) => LinkForm) => void;
  onSave: () => void; saving: boolean; groupCityName?: string;
}) {
  const [tab, setTab] = useState<'basic' | 'seo'>('basic');
  if (!open) return null;

  const field = (label: string, key: keyof LinkForm, opts?: { placeholder?: string; type?: string; mono?: boolean; hint?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{opts?.hint && <span className="ml-1 text-gray-400 font-normal">{opts.hint}</span>}
      </label>
      <input type={opts?.type || 'text'} value={(form[key] as string) || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={opts?.placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${opts?.mono ? 'font-mono' : ''}`} />
    </div>
  );

  const textarea = (label: string, key: keyof LinkForm, opts?: { placeholder?: string; rows?: number; hint?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{opts?.hint && <span className="ml-1 text-gray-400 font-normal">{opts.hint}</span>}
      </label>
      <textarea value={(form[key] as string) || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder} rows={opts?.rows || 3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-y" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Footer Link' : 'New Footer Link'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set link details and SEO content</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 pt-4 pb-0 flex-shrink-0">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['basic', 'seo'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'basic' ? <><Link2 className="w-3.5 h-3.5" /> Basic Info</> : <>
                  <Globe className="w-3.5 h-3.5" /> SEO Content
                  {(form.metaTitle || form.h1Title || form.introContent) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                </>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'basic' && (
            <div className="space-y-4">
              <LocalityPicker cityName={groupCityName || ''} value={form.localityName || ''}
                onChange={(ln, lid) => setForm(f => ({ ...f, localityName: ln || '', localityId: lid || '' }))} />
              {form.localityName && (
                <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  Mapped to: <strong>{form.localityName}</strong>{groupCityName && <>, {groupCityName}</>}
                </div>
              )}
              {field('Link Label *', 'label', { placeholder: 'e.g. Flats in Andheri East' })}
              {field('URL *', 'url', { placeholder: '/flats-for-sale-in-andheri-east', mono: true })}
              <div className="grid grid-cols-2 gap-4">
                {field('Sort Order', 'sortOrder', { type: 'number' })}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              {field('Page Heading (H1)', 'h1Title', { placeholder: 'e.g. Flats for Sale in Andheri East', hint: '(main heading on listing page)' })}
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <strong>Tip:</strong> Use the <ArrowLeftRight className="w-3 h-3 inline" /> Remap button on the links table to quickly move this link to another group or re-assign locality.
              </div>
            </div>
          )}
          {tab === 'seo' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Meta Tags</span>
                  <span className="text-xs text-gray-400">(shown in Google)</span>
                </div>
                <div className="space-y-3">
                  {field('Meta Title', 'metaTitle', { placeholder: 'Flats for Sale in Andheri East | Site', hint: '(60 chars)' })}
                  {textarea('Meta Description', 'metaDescription', { placeholder: 'Find the best flats...', rows: 2, hint: '(160 chars)' })}
                  {field('Meta Keywords', 'metaKeywords', { placeholder: 'flats andheri east, 2bhk andheri', hint: '(comma-separated)' })}
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-800">Technical SEO</span>
                </div>
                <div className="space-y-3">
                  {field('Canonical URL', 'canonicalUrl', { mono: true })}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Robots</label>
                    <select value={form.robots || 'index,follow'} onChange={e => setForm(f => ({ ...f, robots: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="index,follow">index, follow (default)</option>
                      <option value="noindex,follow">noindex, follow</option>
                      <option value="index,nofollow">index, nofollow</option>
                      <option value="noindex,nofollow">noindex, nofollow</option>
                    </select>
                  </div>
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-800">Page Content</span>
                  <span className="text-xs text-gray-400">(shown on listing page for SEO)</span>
                </div>
                <div className="space-y-3">
                  {textarea('Intro Content', 'introContent', { placeholder: '<p>...</p>', rows: 5, hint: '(HTML, above listings)' })}
                  {textarea('Bottom Content', 'bottomContent', { placeholder: '<h2>...</h2><p>...</p>', rows: 6, hint: '(HTML, below listings)' })}
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-800">FAQs</span>
                  <span className="text-xs text-gray-400">(generates FAQ schema)</span>
                </div>
                <FaqEditor faqs={form.faqJson || []} onChange={faqs => setForm(f => ({ ...f, faqJson: faqs }))} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onSave} disabled={saving || !form.label || !form.url}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : editId ? 'Update Link' : 'Create Link'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Group Row ──────────────────────────────────────────────────────────────────
function GroupRow({ g, selected, onSelect, onEdit, onRemap, onDelete }: {
  g: FooterGroup;
  selected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onRemap: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClick={onSelect}
      className={`flex items-center gap-2.5 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50/80 transition-colors ${
        selected ? 'bg-blue-50/60 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'
      }`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate">{g.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {g.category && (
            <span className="inline-flex items-center gap-0.5 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
              <Tag className="w-2.5 h-2.5" />{FOOTER_CATEGORIES.find(c => c.value === g.category)?.short ?? g.category}
            </span>
          )}
          {g.cityName && (
            <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              <MapPin className="w-2.5 h-2.5" />{g.cityName}
            </span>
          )}
          <span className="text-xs text-gray-400">{g.links?.length || 0} links</span>
          {!g.isActive && <span className="text-xs text-gray-300 italic">inactive</span>}
        </div>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={onRemap} title="Remap city"
          className="p-1 text-gray-400 hover:text-violet-600 rounded transition-colors">
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={onEdit} title="Edit group"
          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} title="Delete group"
          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminFooterLinksPage() {
  const [groups, setGroups]   = useState<FooterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities]   = useState<City[]>([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('__all__');
  const [selectedGroupId, setSelectedGroupId]       = useState<string | null>(null);

  // Group modal
  const [groupModal, setGroupModal]   = useState(false);
  const [groupEditId, setGroupEditId] = useState<string | null>(null);
  const [groupForm, setGroupForm]     = useState({ title: '', sortOrder: 0, isActive: true, cityId: '', cityName: '', category: '' });
  const [groupSaving, setGroupSaving] = useState(false);

  // Link slide-over
  const [linkOpen, setLinkOpen]     = useState(false);
  const [linkEditId, setLinkEditId] = useState<string | null>(null);
  const [linkForm, setLinkForm]     = useState<LinkForm>({ ...EMPTY_LINK_FORM });
  const [linkSaving, setLinkSaving] = useState(false);

  // Remap slide-over
  const [remapOpen, setRemapOpen]     = useState(false);
  const [remapMode, setRemapMode]     = useState<'group' | 'link'>('link');
  const [remapTarget, setRemapTarget] = useState<FooterGroup | FooterLink | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'link'; id: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r   = await seoApi.adminGetFooterGroups();
      const data: FooterGroup[] = r.data || [];
      setGroups(data);
      if (data.length > 0 && !selectedGroupId) setSelectedGroupId(data[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    locationsApi.getCities(undefined, 200)
      .then(r => setCities((r.data || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))))
      .catch(() => {});
  }, []);

  // Build city filter tabs: "All" first, then "No City" (generic groups), then each city
  const cityTabs = [
    { key: '__all__',  label: 'All',      count: groups.length },
    { key: '__none__', label: 'Generic',  count: groups.filter(g => !g.cityName).length },
    ...Array.from(
      new Map(
        groups.filter(g => g.cityName)
          .map(g => [g.cityName!, g.cityName!])
      ).values()
    ).map(city => ({
      key:   city,
      label: city,
      count: groups.filter(g => g.cityName === city).length,
    })),
  ];

  const filteredGroups = groups.filter(g => {
    if (selectedCityFilter === '__all__')  return true;
    if (selectedCityFilter === '__none__') return !g.cityName;
    return g.cityName === selectedCityFilter;
  });

  // For the groups panel: separate generic and city-specific
  const genericGroups     = filteredGroups.filter(g => !g.cityName);
  const citySpecificGroups = filteredGroups.filter(g => !!g.cityName);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // ── group CRUD ───────────────────────────────────────────────────────────────
  const openCreateGroup = () => {
    setGroupEditId(null);
    setGroupForm({ title: '', sortOrder: groups.length, isActive: true, cityId: '', cityName: '', category: '' });
    setGroupModal(true);
  };
  const openEditGroup = (g: FooterGroup) => {
    setGroupEditId(g.id);
    setGroupForm({ title: g.title, sortOrder: g.sortOrder, isActive: g.isActive, cityId: g.cityId || '', cityName: g.cityName || '', category: g.category || '' });
    setGroupModal(true);
  };
  const openRemapGroup = (g: FooterGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemapMode('group');
    setRemapTarget(g);
    setRemapOpen(true);
  };
  const saveGroup = async () => {
    setGroupSaving(true);
    try {
      const p = { ...groupForm, cityId: groupForm.cityId || null, cityName: groupForm.cityName || null, category: groupForm.category || null };
      if (groupEditId) await seoApi.adminUpdateFooterGroup(groupEditId, p);
      else await seoApi.adminCreateFooterGroup(p);
      setGroupModal(false); load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
    finally { setGroupSaving(false); }
  };

  // ── link CRUD ────────────────────────────────────────────────────────────────
  const openCreateLink = () => {
    if (!selectedGroupId) return;
    setLinkEditId(null);
    setLinkForm({ ...EMPTY_LINK_FORM, sortOrder: (selectedGroup?.links || []).length, groupId: selectedGroupId });
    setLinkOpen(true);
  };
  const openEditLink = (link: FooterLink) => {
    setLinkEditId(link.id);
    setLinkForm({
      label: link.label, url: link.url, sortOrder: link.sortOrder, isActive: link.isActive,
      groupId: selectedGroupId!, localityId: link.localityId || '', localityName: link.localityName || '',
      h1Title: link.h1Title || '', metaTitle: link.metaTitle || '', metaDescription: link.metaDescription || '',
      metaKeywords: link.metaKeywords || '', canonicalUrl: link.canonicalUrl || '',
      introContent: link.introContent || '', bottomContent: link.bottomContent || '',
      faqJson: link.faqJson || [], robots: link.robots || 'index,follow',
    });
    setLinkOpen(true);
  };
  const openRemapLink = (link: FooterLink) => {
    setRemapMode('link');
    setRemapTarget({ ...link, groupId: selectedGroupId! });
    setRemapOpen(true);
  };
  const saveLink = async () => {
    setLinkSaving(true);
    try {
      const p = {
        ...linkForm,
        localityId: linkForm.localityId || null, localityName: linkForm.localityName || null,
        h1Title: linkForm.h1Title || null, metaTitle: linkForm.metaTitle || null,
        metaDescription: linkForm.metaDescription || null, metaKeywords: linkForm.metaKeywords || null,
        canonicalUrl: linkForm.canonicalUrl || null, introContent: linkForm.introContent || null,
        bottomContent: linkForm.bottomContent || null,
        faqJson: linkForm.faqJson?.length ? linkForm.faqJson : null,
      };
      if (linkEditId) await seoApi.adminUpdateFooterLink(linkEditId, p);
      else await seoApi.adminCreateFooterLink(p);
      setLinkOpen(false); load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
    finally { setLinkSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'group') {
        await seoApi.adminDeleteFooterGroup(deleteTarget.id);
        if (selectedGroupId === deleteTarget.id) setSelectedGroupId(null);
      } else {
        await seoApi.adminDeleteFooterLink(deleteTarget.id);
      }
      setDeleteTarget(null); load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <div className="p-6 max-w-full">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Footer SEO Links</h1>
          <p className="text-sm text-gray-500 mt-1">
            Two-level footer: <strong>Category</strong> tabs → <strong>City / Locality</strong> links.
            Use <ArrowLeftRight className="w-3 h-3 inline text-violet-500 mx-0.5" /> to remap without losing SEO content.
          </p>
        </div>
        <button onClick={openCreateGroup}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {/* ── Filter tabs: All → Generic → City ──────────────────────────── */}
      <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Row label */}
        <div className="px-4 pt-3 pb-0 flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filter by</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 pb-3 pt-2 overflow-x-auto scrollbar-none">
          {cityTabs.map(tab => (
            <button key={tab.key}
              onClick={() => { setSelectedCityFilter(tab.key); setSelectedGroupId(null); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                selectedCityFilter === tab.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {tab.key === '__none__' && <Globe className="w-3 h-3" />}
              {tab.key !== '__all__' && tab.key !== '__none__' && <MapPin className="w-3 h-3" />}
              {tab.label}
              <span className={`text-xs tabular-nums ${selectedCityFilter === tab.key ? 'text-blue-200' : 'text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main two-panel layout ───────────────────────────────────────── */}
      <div className="flex gap-4 min-h-[560px]">

        {/* Groups Panel */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {selectedCityFilter === '__all__'  ? 'All Groups'
               : selectedCityFilter === '__none__' ? 'Generic Groups'
               : selectedCityFilter + ' Groups'}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">{filteredGroups.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-8 text-center">
                <Link2 className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No groups</p>
              </div>
            ) : (
              <>
                {/* Generic groups section */}
                {(selectedCityFilter === '__all__' || selectedCityFilter === '__none__') && genericGroups.length > 0 && (
                  <div>
                    {selectedCityFilter === '__all__' && (
                      <div className="px-4 py-2 bg-amber-50/60 border-b border-amber-100">
                        <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                          <Globe className="w-3 h-3" /> Generic — all cities
                        </span>
                      </div>
                    )}
                    {genericGroups.map(g => (
                      <GroupRow key={g.id} g={g} selected={selectedGroupId === g.id}
                        onSelect={() => setSelectedGroupId(g.id)}
                        onEdit={e => { e.stopPropagation(); openEditGroup(g); }}
                        onRemap={e => openRemapGroup(g, e)}
                        onDelete={e => { e.stopPropagation(); setDeleteTarget({ type: 'group', id: g.id }); }} />
                    ))}
                  </div>
                )}

                {/* City-specific groups section */}
                {(selectedCityFilter === '__all__' || selectedCityFilter !== '__none__') && citySpecificGroups.length > 0 && (
                  <div>
                    {selectedCityFilter === '__all__' && (
                      <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100">
                        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> City-specific — locality links
                        </span>
                      </div>
                    )}
                    {citySpecificGroups.map(g => (
                      <GroupRow key={g.id} g={g} selected={selectedGroupId === g.id}
                        onSelect={() => setSelectedGroupId(g.id)}
                        onEdit={e => { e.stopPropagation(); openEditGroup(g); }}
                        onRemap={e => openRemapGroup(g, e)}
                        onDelete={e => { e.stopPropagation(); setDeleteTarget({ type: 'group', id: g.id }); }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Links Panel */}
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {!selectedGroup ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Link2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Select a group to manage links</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700">{selectedGroup.title}</span>
                  {selectedGroup.cityName && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" />{selectedGroup.cityName}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-gray-400">{selectedGroup.links?.length || 0} links</span>
                </div>
                <button onClick={openCreateLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!selectedGroup.links?.length ? (
                  <div className="p-8 text-center text-sm text-gray-400">No links yet. Click &ldquo;Add Link&rdquo;.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Label', 'Locality / City', 'URL', 'SEO', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedGroup.links.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(link => (
                        <tr key={link.id} className="hover:bg-gray-50/60">
                          <td className="px-5 py-2.5 font-medium text-gray-800 max-w-[160px]">
                            <span className="block truncate">{link.label}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {link.localityName
                              ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <MapPin className="w-3 h-3" />{link.localityName}
                                </span>
                              : <span className="text-xs text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs font-mono max-w-[160px] truncate">{link.url}</td>
                          <td className="px-4 py-2.5">
                            {hasSeo(link)
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><Globe className="w-3 h-3" /> SEO</span>
                              : <span className="text-xs text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {link.isActive ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openRemapLink(link)} title="Remap group / locality"
                                className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openEditLink(link)} title="Edit link & SEO"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: 'link', id: link.id })}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Group Modal ─────────────────────────────────────────────────────── */}
      {groupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{groupEditId ? 'Edit Group' : 'New Group'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Group Title *</label>
                <input value={groupForm.title} onChange={e => setGroupForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Flats in Mumbai"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              {/* Category picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-orange-500" /> Footer Category *</span>
                </label>
                <select value={groupForm.category}
                  onChange={e => setGroupForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">— Select category —</option>
                  {FOOTER_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.short} — {c.label}</option>
                  ))}
                </select>
                {groupForm.category && (
                  <p className="text-xs text-orange-600 mt-1">
                    Tab label: <strong>{FOOTER_CATEGORIES.find(c => c.value === groupForm.category)?.short}</strong>
                  </p>
                )}
              </div>

              <CityPicker cities={cities} value={groupForm.cityName}
                onChange={(n, id) => setGroupForm(f => ({ ...f, cityName: n, cityId: id }))} />
              {groupForm.cityName && (
                <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Group will appear under <strong>{groupForm.cityName}</strong> city tab in footer.
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={groupForm.sortOrder}
                  onChange={e => setGroupForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Status:</label>
                <button onClick={() => setGroupForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${groupForm.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {groupForm.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveGroup} disabled={groupSaving || !groupForm.title}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {groupSaving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setGroupModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Slide-Over ──────────────────────────────────────────────────── */}
      <LinkSlideOver open={linkOpen} onClose={() => setLinkOpen(false)} editId={linkEditId}
        form={linkForm} setForm={setLinkForm} onSave={saveLink} saving={linkSaving}
        groupCityName={selectedGroup?.cityName} />

      {/* ── Remap Slide-Over ─────────────────────────────────────────────────── */}
      <RemapSlideOver
        open={remapOpen}
        onClose={() => setRemapOpen(false)}
        mode={remapMode}
        target={remapTarget}
        allGroups={groups}
        cities={cities}
        onSaved={load}
      />

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-3">&#x26A0;&#xFE0F;</div>
            <h3 className="font-bold text-gray-900 mb-2">Delete {deleteTarget.type === 'group' ? 'Group' : 'Link'}?</h3>
            <p className="text-sm text-gray-500 mb-5">
              {deleteTarget.type === 'group' ? 'This will delete the group and all its links.' : 'This will permanently remove the link.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
