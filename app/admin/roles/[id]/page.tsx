'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck, ArrowLeft, Save, AlertCircle,
  CheckSquare, Square, RefreshCw,
} from 'lucide-react';
import { rbacApi } from '@/lib/api';

interface Permission {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  level: number;
  permissions: Permission[];
}

const MODULE_COLORS: Record<string, string> = {
  property:   'bg-green-50  border-green-200  text-green-800',
  user:       'bg-blue-50   border-blue-200   text-blue-800',
  role:       'bg-red-50    border-red-200    text-red-800',
  permission: 'bg-purple-50 border-purple-200 text-purple-800',
  dashboard:  'bg-indigo-50 border-indigo-200 text-indigo-800',
  analytics:  'bg-cyan-50   border-cyan-200   text-cyan-800',
  agent:      'bg-yellow-50 border-yellow-200 text-yellow-800',
  lead:       'bg-orange-50 border-orange-200 text-orange-800',
  content:    'bg-pink-50   border-pink-200   text-pink-800',
  settings:   'bg-gray-50   border-gray-200   text-gray-800',
  system:     'bg-rose-50   border-rose-200   text-rose-800',
  audit:      'bg-slate-50  border-slate-200  text-slate-800',
  menu:       'bg-teal-50   border-teal-200   text-teal-800',
};

export default function RolePermissionMatrix() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    try {
      const [roleRes, permRes] = await Promise.all([
        rbacApi.getRole(id),
        rbacApi.getPermissions(),
      ]);
      const r: Role = roleRes.data?.data;
      const perms: Permission[] = permRes.data?.data ?? [];
      setRole(r);
      setAllPerms(perms.filter(p => p.isActive));
      setSelected(new Set(r.permissions.map((p: Permission) => p.id)));
      setDisplayName(r.displayName);
      setDescription(r.description ?? '');
    } catch {
      setError('Failed to load role data');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const grouped = allPerms.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  function toggle(permId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  }

  function toggleModule(module: string) {
    const modulePerms = grouped[module] ?? [];
    const allChecked = modulePerms.every(p => selected.has(p.id));
    setSelected(prev => {
      const next = new Set(prev);
      modulePerms.forEach(p => allChecked ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allPerms.map(p => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await rbacApi.setRolePermissions(id, Array.from(selected));
      if (displayName !== role?.displayName || description !== (role?.description ?? '')) {
        await rbacApi.updateRole(id, { displayName, description: description || undefined });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!role) return (
    <div className="p-8 space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="mt-0.5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Configure: {role.displayName}</h1>
            {role.isSystem && (
              <span className="text-[11px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">
                System Role
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            <code className="font-mono">{role.name}</code> · Level {role.level} ·{' '}
            {selected.size} / {allPerms.length} permissions selected
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl mb-4 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Editable metadata */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex gap-3 mb-5">
        <button onClick={selectAll} className="px-3 py-1.5 text-xs border border-green-200 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          Select All ({allPerms.length})
        </button>
        <button onClick={clearAll} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          Clear All
        </button>
      </div>

      {/* Permission matrix by module */}
      <div className="space-y-4">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([module, perms]) => {
          const allModuleChecked = perms.every(p => selected.has(p.id));
          const someChecked = perms.some(p => selected.has(p.id));
          const colorClass = MODULE_COLORS[module] ?? 'bg-gray-50 border-gray-200 text-gray-800';

          return (
            <div key={module} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Module header */}
              <button
                onClick={() => toggleModule(module)}
                className={`w-full flex items-center justify-between px-5 py-3.5 border-b ${colorClass} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  {allModuleChecked
                    ? <CheckSquare className="w-4 h-4" />
                    : someChecked
                    ? <CheckSquare className="w-4 h-4 opacity-50" />
                    : <Square className="w-4 h-4 opacity-50" />
                  }
                  <span className="font-semibold text-sm capitalize">{module}</span>
                  <span className="text-xs opacity-70">{perms.filter(p => selected.has(p.id)).length}/{perms.length}</span>
                </div>
              </button>

              {/* Permission rows */}
              <div className="divide-y divide-gray-50">
                {perms.map(perm => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={selected.has(perm.id)}
                        onChange={() => toggle(perm.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{perm.name}</span>
                        <code className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {perm.key}
                        </code>
                      </div>
                      {perm.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky save bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 p-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold rounded-xl transition-colors"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
      <div className="h-20 sm:hidden" />
    </div>
  );
}
