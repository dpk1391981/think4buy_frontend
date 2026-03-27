'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Plus, Pencil, Trash2, ChevronRight,
  Users, Lock, AlertCircle, Check, X,
} from 'lucide-react';
import { rbacApi } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  level: number;
  permissions: { id: string; key: string; name: string; module: string }[];
  createdAt: string;
}

const LEVEL_LABEL: Record<number, { label: string; color: string }> = {
  100: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  80:  { label: 'Admin',       color: 'bg-orange-100 text-orange-700' },
  60:  { label: 'Broker',      color: 'bg-purple-100 text-purple-700' },
  50:  { label: 'Agent',       color: 'bg-blue-100 text-blue-700' },
  40:  { label: 'Owner',       color: 'bg-green-100 text-green-700' },
  20:  { label: 'Buyer',       color: 'bg-gray-100 text-gray-600' },
};

function levelBadge(level: number) {
  const match = LEVEL_LABEL[level];
  if (match) return match;
  if (level >= 90) return { label: 'Very High', color: 'bg-red-100 text-red-700' };
  if (level >= 70) return { label: 'High',      color: 'bg-orange-100 text-orange-700' };
  if (level >= 40) return { label: 'Medium',    color: 'bg-blue-100 text-blue-700' };
  return { label: 'Low', color: 'bg-gray-100 text-gray-600' };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', description: '', level: 10 });
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const load = async () => {
    try {
      const res = await rbacApi.getRoles();
      setRoles(res.data?.data ?? []);
    } catch {
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await rbacApi.createRole({
        name: form.name,
        displayName: form.displayName,
        description: form.description || undefined,
        level: form.level,
      });
      setShowCreate(false);
      setForm({ name: '', displayName: '', description: '', level: 10 });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to create role');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(role: Role) {
    try {
      await rbacApi.deleteRole(role.id);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete role');
    }
  }

  async function toggleActive(role: Role) {
    try {
      await rbacApi.updateRole(role.id, { isActive: !role.isActive });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update role');
    }
  }

  if (loading) return (
    <div className="p-8 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage dynamic roles. Click a role to configure its permission matrix.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map((role) => {
          const badge = levelBadge(role.level);
          return (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{role.displayName}</span>
                    <code className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                      {role.name}
                    </code>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                      Level {role.level} · {badge.label}
                    </span>
                    {role.isSystem && (
                      <span className="text-[11px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">System</span>
                    )}
                    {!role.isActive && (
                      <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {role.permissions.slice(0, 6).map(p => (
                      <span key={p.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {p.key}
                      </span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span className="text-[10px] text-gray-400">+{role.permissions.length - 6} more</span>
                    )}
                    {role.permissions.length === 0 && (
                      <span className="text-[10px] text-gray-400 italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(role)}
                    title={role.isActive ? 'Deactivate' : 'Activate'}
                    className={`p-1.5 rounded-lg transition-colors ${role.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    {role.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <Link
                    href={`/admin/roles/${role.id}`}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Configure permissions"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  {!role.isSystem && (
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <Link
                    href={`/admin/roles/${role.id}`}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit log link */}
      <div className="mt-6 text-center">
        <Link href="/admin/audit-logs" className="text-sm text-primary-600 hover:underline flex items-center justify-center gap-1">
          <Lock className="w-3.5 h-3.5" /> View Audit Logs
        </Link>
      </div>

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Role</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role Key (slug)</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. content_manager"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
                <input
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Content Manager"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Privilege Level (0–99, higher = more access)
                </label>
                <input
                  type="number" min={1} max={79}
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) || 10 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Delete "{deleteTarget.displayName}"?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Users assigned this role will lose their RBAC permissions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
