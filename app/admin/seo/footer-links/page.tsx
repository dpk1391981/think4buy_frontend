'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import { seoApi } from '@/lib/api';

interface FooterLink { id: string; label: string; url: string; sortOrder: number; isActive: boolean; }
interface FooterGroup { id: string; title: string; sortOrder: number; isActive: boolean; links: FooterLink[]; }

export default function AdminFooterLinksPage() {
  const [groups, setGroups] = useState<FooterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Group modal state
  const [groupModal, setGroupModal] = useState(false);
  const [groupEditId, setGroupEditId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ title: '', sortOrder: 0, isActive: true });
  const [groupSaving, setGroupSaving] = useState(false);

  // Link modal state
  const [linkModal, setLinkModal] = useState(false);
  const [linkEditId, setLinkEditId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({ label: '', url: '', sortOrder: 0, isActive: true, groupId: '' });
  const [linkSaving, setLinkSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'link'; id: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await seoApi.adminGetFooterGroups();
      const data: FooterGroup[] = r.data || [];
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(prev => {
          if (!prev || !data.find(g => g.id === prev)) return data[0].id;
          return prev;
        });
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
      setGroupModal(false);
      load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
    finally { setGroupSaving(false); }
  };

  const openCreateLink = () => {
    if (!selectedGroupId) return;
    setLinkEditId(null);
    const linksInGroup = selectedGroup?.links || [];
    setLinkForm({ label: '', url: '', sortOrder: linksInGroup.length, isActive: true, groupId: selectedGroupId });
    setLinkModal(true);
  };

  const openEditLink = (link: FooterLink) => {
    setLinkEditId(link.id);
    setLinkForm({ label: link.label, url: link.url, sortOrder: link.sortOrder, isActive: link.isActive, groupId: selectedGroupId! });
    setLinkModal(true);
  };

  const saveLink = async () => {
    setLinkSaving(true);
    try {
      if (linkEditId) await seoApi.adminUpdateFooterLink(linkEditId, linkForm);
      else await seoApi.adminCreateFooterLink(linkForm);
      setLinkModal(false);
      load();
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
      setDeleteTarget(null);
      load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <div className="p-6 max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Footer SEO Links</h1>
        <p className="text-sm text-gray-500 mt-1">Manage dynamic SEO link groups displayed in the site footer</p>
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
                  <div className="text-xs text-gray-400">{g.links?.length || 0} links &middot; {g.isActive ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openEditGroup(g); }} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'group', id: g.id }); }} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        {['Label', 'URL', 'Order', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide first:pl-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedGroup.links.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(link => (
                        <tr key={link.id} className="hover:bg-gray-50/60">
                          <td className="px-5 py-2.5 font-medium text-gray-800">{link.label}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs font-mono max-w-[200px] truncate">{link.url}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-center">{link.sortOrder}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {link.isActive ? 'Active' : 'Off'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditLink(link)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
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
                {groupSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setGroupModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{linkEditId ? 'Edit Link' : 'New Link'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Label *</label>
                <input value={linkForm.label} onChange={e => setLinkForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Flats in Mumbai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
                <input value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="/buy/property-in-mumbai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={linkForm.sortOrder} onChange={e => setLinkForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Active:</label>
                <button onClick={() => setLinkForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${linkForm.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {linkForm.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveLink} disabled={linkSaving || !linkForm.label || !linkForm.url}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {linkSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setLinkModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
