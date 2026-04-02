'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Link2, X, ChevronDown, ChevronUp, Search, Globe, FileText } from 'lucide-react';
import { seoApi } from '@/lib/api';

interface FooterLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
  // SEO fields
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
  sortOrder: number;
  isActive: boolean;
  links: FooterLink[];
}

const EMPTY_LINK_FORM = {
  label: '', url: '', sortOrder: 0, isActive: true, groupId: '',
  h1Title: '', metaTitle: '', metaDescription: '', metaKeywords: '',
  canonicalUrl: '', introContent: '', bottomContent: '',
  faqJson: [] as { question: string; answer: string }[],
  robots: 'index,follow',
};

type LinkForm = typeof EMPTY_LINK_FORM;

function hasSeo(link: FooterLink) {
  return !!(link.metaTitle || link.h1Title || link.introContent || link.bottomContent);
}

// ── FAQ Editor ────────────────────────────────────────────────────────────────
function FaqEditor({ faqs, onChange }: {
  faqs: { question: string; answer: string }[];
  onChange: (faqs: { question: string; answer: string }[]) => void;
}) {
  const add = () => onChange([...faqs, { question: '', answer: '' }]);
  const remove = (i: number) => onChange(faqs.filter((_, idx) => idx !== i));
  const update = (i: number, key: 'question' | 'answer', val: string) => {
    const next = [...faqs];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-600 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            value={faq.question}
            onChange={e => update(i, 'question', e.target.value)}
            placeholder="Question"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            value={faq.answer}
            onChange={e => update(i, 'answer', e.target.value)}
            placeholder="Answer"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
      ))}
      <button type="button" onClick={add}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>
    </div>
  );
}

// ── Link SEO Slide-Over ────────────────────────────────────────────────────────
function LinkSlideOver({
  open, onClose, editId, form, setForm, onSave, saving,
}: {
  open: boolean;
  onClose: () => void;
  editId: string | null;
  form: LinkForm;
  setForm: (fn: (f: LinkForm) => LinkForm) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [tab, setTab] = useState<'basic' | 'seo'>('basic');

  if (!open) return null;

  const field = (
    label: string,
    key: keyof LinkForm,
    opts?: { placeholder?: string; type?: string; mono?: boolean; hint?: string }
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {opts?.hint && <span className="ml-1 text-gray-400 font-normal">{opts.hint}</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        value={(form[key] as string) || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${opts?.mono ? 'font-mono' : ''}`}
      />
    </div>
  );

  const textarea = (
    label: string,
    key: keyof LinkForm,
    opts?: { placeholder?: string; rows?: number; hint?: string }
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {opts?.hint && <span className="ml-1 text-gray-400 font-normal">{opts.hint}</span>}
      </label>
      <textarea
        value={(form[key] as string) || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        rows={opts?.rows || 3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-y"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Footer Link' : 'New Footer Link'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set link details and SEO content for this page</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-0 flex-shrink-0">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab('basic')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Link2 className="w-3.5 h-3.5" /> Basic Info
            </button>
            <button
              onClick={() => setTab('seo')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'seo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Globe className="w-3.5 h-3.5" /> SEO Content
              {(form.metaTitle || form.h1Title || form.introContent) && (
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'basic' && (
            <div className="space-y-4">
              {field('Label *', 'label', { placeholder: 'e.g. Flats in Mumbai' })}
              {field('URL *', 'url', { placeholder: '/flats-for-sale-in-mumbai', mono: true })}
              <div className="grid grid-cols-2 gap-4">
                {field('Sort Order', 'sortOrder', { type: 'number' })}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${form.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  >
                    {form.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {field('Page Heading (H1)', 'h1Title', { placeholder: 'e.g. Office Space for Rent in Delhi', hint: '(shown as the main heading on the listing page)' })}

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                <strong>Tip:</strong> Use the SEO Content tab to add meta tags, page content, and FAQs.
                Footer link SEO takes <strong>highest priority</strong> — it overrides all other SEO configs for this URL.
              </div>
            </div>
          )}

          {tab === 'seo' && (
            <div className="space-y-5">
              {/* Meta section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">Meta Tags</span>
                  <span className="text-xs text-gray-400">(shown in Google search results)</span>
                </div>
                <div className="space-y-3">
                  {field('Meta Title', 'metaTitle', { placeholder: 'Flats for Sale in Mumbai | Think4BuySale', hint: '(60 chars max)' })}
                  {textarea('Meta Description', 'metaDescription', { placeholder: 'Find the best flats for sale in Mumbai...', rows: 2, hint: '(160 chars max)' })}
                  {field('Meta Keywords', 'metaKeywords', { placeholder: 'flats in mumbai, apartments for sale, 2bhk mumbai', hint: '(comma-separated)' })}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Technical SEO */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-800">Technical SEO</span>
                </div>
                <div className="space-y-3">
                  {field('Canonical URL', 'canonicalUrl', { placeholder: 'https://think4buysale.com/flats-for-sale-in-mumbai', mono: true })}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Robots</label>
                    <select
                      value={form.robots || 'index,follow'}
                      onChange={e => setForm(f => ({ ...f, robots: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="index,follow">index, follow (default)</option>
                      <option value="noindex,follow">noindex, follow</option>
                      <option value="index,nofollow">index, nofollow</option>
                      <option value="noindex,nofollow">noindex, nofollow</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Page Content */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-800">Page Content</span>
                  <span className="text-xs text-gray-400">(shown on the listing page for SEO)</span>
                </div>
                <div className="space-y-3">
                  {textarea('Intro Content', 'introContent', {
                    placeholder: '<p>Mumbai is one of the most sought-after cities...</p>',
                    rows: 5,
                    hint: '(HTML allowed, shown above listings)',
                  })}
                  {textarea('Bottom Content', 'bottomContent', {
                    placeholder: '<h2>Why Buy Flats in Mumbai?</h2><p>...</p>',
                    rows: 6,
                    hint: '(HTML allowed, shown below listings)',
                  })}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* FAQs */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-800">FAQs</span>
                  <span className="text-xs text-gray-400">(generates FAQ schema for Google)</span>
                </div>
                <FaqEditor
                  faqs={form.faqJson || []}
                  onChange={faqs => setForm(f => ({ ...f, faqJson: faqs }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onSave}
            disabled={saving || !form.label || !form.url}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : editId ? 'Update Link' : 'Create Link'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminFooterLinksPage() {
  const [groups, setGroups] = useState<FooterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Group modal
  const [groupModal, setGroupModal] = useState(false);
  const [groupEditId, setGroupEditId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ title: '', sortOrder: 0, isActive: true });
  const [groupSaving, setGroupSaving] = useState(false);

  // Link slide-over
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEditId, setLinkEditId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<LinkForm>({ ...EMPTY_LINK_FORM });
  const [linkSaving, setLinkSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'link'; id: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await seoApi.adminGetFooterGroups();
      const data: FooterGroup[] = r.data || [];
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(prev => (!prev || !data.find(g => g.id === prev)) ? data[0].id : prev);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const openCreateGroup = () => {
    setGroupEditId(null);
    setGroupForm({ title: '', sortOrder: groups.length, isActive: true });
    setGroupModal(true);
  };
  const openEditGroup = (g: FooterGroup) => {
    setGroupEditId(g.id);
    setGroupForm({ title: g.title, sortOrder: g.sortOrder, isActive: g.isActive });
    setGroupModal(true);
  };
  const saveGroup = async () => {
    setGroupSaving(true);
    try {
      if (groupEditId) await seoApi.adminUpdateFooterGroup(groupEditId, groupForm);
      else await seoApi.adminCreateFooterGroup(groupForm);
      setGroupModal(false); load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
    finally { setGroupSaving(false); }
  };

  const openCreateLink = () => {
    if (!selectedGroupId) return;
    setLinkEditId(null);
    const linksInGroup = selectedGroup?.links || [];
    setLinkForm({ ...EMPTY_LINK_FORM, sortOrder: linksInGroup.length, groupId: selectedGroupId });
    setLinkOpen(true);
  };
  const openEditLink = (link: FooterLink) => {
    setLinkEditId(link.id);
    setLinkForm({
      label: link.label,
      url: link.url,
      sortOrder: link.sortOrder,
      isActive: link.isActive,
      groupId: selectedGroupId!,
      h1Title: link.h1Title || '',
      metaTitle: link.metaTitle || '',
      metaDescription: link.metaDescription || '',
      metaKeywords: link.metaKeywords || '',
      canonicalUrl: link.canonicalUrl || '',
      introContent: link.introContent || '',
      bottomContent: link.bottomContent || '',
      faqJson: link.faqJson || [],
      robots: link.robots || 'index,follow',
    });
    setLinkOpen(true);
  };
  const saveLink = async () => {
    setLinkSaving(true);
    try {
      const payload = {
        ...linkForm,
        h1Title: linkForm.h1Title || null,
        metaTitle: linkForm.metaTitle || null,
        metaDescription: linkForm.metaDescription || null,
        metaKeywords: linkForm.metaKeywords || null,
        canonicalUrl: linkForm.canonicalUrl || null,
        introContent: linkForm.introContent || null,
        bottomContent: linkForm.bottomContent || null,
        faqJson: linkForm.faqJson?.length ? linkForm.faqJson : null,
      };
      if (linkEditId) await seoApi.adminUpdateFooterLink(linkEditId, payload);
      else await seoApi.adminCreateFooterLink(payload);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Footer SEO Links</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage footer link groups and add full SEO content per link — meta tags, page content &amp; FAQs.
          Footer link SEO has <strong>highest priority</strong> and overrides all other SEO configs.
        </p>
      </div>

      <div className="flex gap-4 min-h-[500px]">
        {/* Groups Panel */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Link Groups</span>
            <button onClick={openCreateGroup} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : groups.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No groups yet</div>
            ) : groups.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors border-b border-gray-50 ${selectedGroupId === g.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <Link2 className={`w-4 h-4 flex-shrink-0 ${selectedGroupId === g.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${selectedGroupId === g.id ? 'text-blue-700' : 'text-gray-700'}`}>{g.title}</div>
                  <div className="text-xs text-gray-400">{g.links?.length || 0} links · {g.isActive ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); openEditGroup(g); }} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'group', id: g.id }); }} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
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
                  <span className="ml-2 text-xs text-gray-400">{selectedGroup.links?.length || 0} links</span>
                </div>
                <button onClick={openCreateLink} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {!selectedGroup.links?.length ? (
                  <div className="p-8 text-center text-sm text-gray-400">No links in this group. Click &ldquo;Add Link&rdquo; to add one.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Label', 'URL', 'SEO', 'Order', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedGroup.links.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(link => (
                        <tr key={link.id} className="hover:bg-gray-50/60">
                          <td className="px-5 py-2.5 font-medium text-gray-800">{link.label}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs font-mono max-w-[180px] truncate">{link.url}</td>
                          <td className="px-4 py-2.5">
                            {hasSeo(link) ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Globe className="w-3 h-3" /> SEO
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-center">{link.sortOrder}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {link.isActive ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditLink(link)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit link & SEO"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteTarget({ type: 'link', id: link.id })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Group Modal */}
      {groupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{groupEditId ? 'Edit Group' : 'New Group'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Group Title *</label>
                <input value={groupForm.title} onChange={e => setGroupForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Buy Property" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={groupForm.sortOrder} onChange={e => setGroupForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Active:</label>
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

      {/* Link Slide-Over */}
      <LinkSlideOver
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        editId={linkEditId}
        form={linkForm}
        setForm={setLinkForm}
        onSave={saveLink}
        saving={linkSaving}
      />

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-3">&#x26A0;&#xFE0F;</div>
            <h3 className="font-bold text-gray-900 mb-2">Delete {deleteTarget.type === 'group' ? 'Group' : 'Link'}?</h3>
            <p className="text-sm text-gray-500 mb-5">{deleteTarget.type === 'group' ? 'This will delete the group and all its links.' : 'This will permanently remove the link.'}</p>
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
