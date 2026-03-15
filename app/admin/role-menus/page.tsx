'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Shield, Check, X, RefreshCw, Loader2, LayoutGrid } from 'lucide-react';

interface MenuDef {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

interface PermissionsMatrix {
  menus: MenuDef[];
  permissions: Record<string, Record<number, boolean>>;
}

const ROLES = ['buyer', 'owner', 'agent', 'admin'] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<Role, string> = {
  buyer: 'text-cyan-600 bg-cyan-100',
  owner: 'text-emerald-600 bg-emerald-100',
  agent: 'text-violet-600 bg-violet-100',
  admin: 'text-orange-600 bg-orange-100',
};

export default function RoleMenusPage() {
  const [data,    setData]    = useState<PermissionsMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null);
  const [error,   setError]   = useState('');

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/menus/admin/matrix');
      setData(res);
    } catch {
      setError('Failed to load menu permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatrix(); }, []);

  const toggle = async (role: Role, menuId: number, current: boolean) => {
    const key = `${role}-${menuId}`;
    setSaving(key);
    try {
      await api.patch('/menus/admin/permission', { role, menuId, isVisible: !current });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            [role]: {
              ...prev.permissions[role],
              [menuId]: !current,
            },
          },
        };
      });
    } catch {
      setError('Failed to update permission.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading menu permissions…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || 'Something went wrong.'}</p>
        <button onClick={fetchMatrix} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Role Menu Permissions</h1>
            <p className="text-sm text-gray-500">Control which menus are visible per role</p>
          </div>
        </div>
        <button
          onClick={fetchMatrix}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROLES.map((r) => (
          <span key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${ROLE_COLORS[r]}`}>
            <Shield className="w-3.5 h-3.5" />
            {r}
          </span>
        ))}
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 font-bold text-gray-600 w-48">Menu</th>
              {ROLES.map((r) => (
                <th key={r} className="px-4 py-3 font-bold text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs capitalize ${ROLE_COLORS[r]}`}>
                    <Shield className="w-3 h-3" />
                    {r}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.menus.map((menu, idx) => (
              <tr key={menu.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{menu.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{menu.slug}</div>
                </td>
                {ROLES.map((role) => {
                  const visible = !!data.permissions[role]?.[menu.id];
                  const key     = `${role}-${menu.id}`;
                  const isSaving = saving === key;
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(role, menu.id, visible)}
                        disabled={isSaving}
                        title={visible ? `Hide from ${role}` : `Show for ${role}`}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all ${
                          isSaving
                            ? 'opacity-50 cursor-wait bg-gray-100'
                            : visible
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
                              : 'bg-red-50 hover:bg-red-100 text-red-400'
                        }`}
                      >
                        {isSaving
                          ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          : visible
                            ? <Check className="w-4 h-4" />
                            : <X className="w-4 h-4" />
                        }
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Changes take effect immediately. Users will see updated menus on their next login or page refresh.
      </p>
    </div>
  );
}
