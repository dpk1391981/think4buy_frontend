'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Shield, Check, X, RefreshCw, Loader2, LayoutGrid,
  Users, Home, Settings, Globe, Lock, BarChart2,
  MessageSquare, CreditCard, Target, BookOpen, ShieldCheck,
} from 'lucide-react';

interface MenuDef {
  id: number;
  name: string;
  slug: string;
  icon: string;
  section: string;
  sortOrder: number;
}

interface PermissionsMatrix {
  menus: MenuDef[];
  permissions: Record<string, Record<number, boolean>>;
}

const ROLES = ['super_admin', 'admin', 'broker', 'agent', 'owner', 'seller', 'buyer'] as const;
type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  broker:      'Broker',
  agent:       'Agent',
  owner:       'Owner',
  seller:      'Seller',
  buyer:       'Buyer',
};

const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'text-red-700 bg-red-100',
  admin:       'text-orange-600 bg-orange-100',
  broker:      'text-indigo-600 bg-indigo-100',
  agent:       'text-violet-600 bg-violet-100',
  owner:       'text-emerald-600 bg-emerald-100',
  seller:      'text-teal-600 bg-teal-100',
  buyer:       'text-cyan-600 bg-cyan-100',
};

// Section display config
const SECTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin_overview:   { label: 'Admin — Overview',         color: 'bg-slate-700 text-white',         icon: LayoutGrid   },
  admin_listings:   { label: 'Admin — Listings',         color: 'bg-blue-700 text-white',           icon: Home         },
  admin_agents:     { label: 'Admin — Agents',           color: 'bg-violet-700 text-white',         icon: Users        },
  admin_users:      { label: 'Admin — Users',            color: 'bg-sky-700 text-white',            icon: Users        },
  admin_content:    { label: 'Admin — Content',          color: 'bg-amber-700 text-white',          icon: BookOpen     },
  admin_seo:        { label: 'Admin — SEO',              color: 'bg-lime-700 text-white',           icon: Globe        },
  admin_system:     { label: 'Admin — System',           color: 'bg-gray-700 text-white',           icon: Settings     },
  admin_rbac:       { label: 'Admin — Security & RBAC',  color: 'bg-red-700 text-white',            icon: ShieldCheck  },
  admin_locations:  { label: 'Admin — Locations',        color: 'bg-teal-700 text-white',           icon: Globe        },
  admin_crm:        { label: 'Admin — CRM',              color: 'bg-orange-700 text-white',         icon: Target       },
  admin_finance:    { label: 'Admin — Finance',          color: 'bg-green-700 text-white',          icon: CreditCard   },
  admin_messaging:  { label: 'Admin — Messaging',        color: 'bg-pink-700 text-white',           icon: MessageSquare},
  user_dashboard:   { label: 'User Dashboard',           color: 'bg-indigo-700 text-white',         icon: BarChart2    },
  admin_support:    { label: 'Admin — Support',          color: 'bg-purple-700 text-white',         icon: MessageSquare},
};

const SECTION_ORDER = [
  'admin_overview', 'admin_listings', 'admin_agents', 'admin_users',
  'admin_content', 'admin_seo', 'admin_system', 'admin_rbac',
  'admin_locations', 'admin_crm', 'admin_finance', 'admin_messaging',
  'user_dashboard', 'admin_support',
];

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
            [role]: { ...prev.permissions[role], [menuId]: !current },
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

  // Group menus by section
  const grouped: Record<string, MenuDef[]> = {};
  for (const menu of data.menus) {
    const sec = menu.section || 'user_dashboard';
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(menu);
  }

  const sections = SECTION_ORDER.filter((s) => grouped[s]?.length);

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

      {/* Role legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <span key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${ROLE_COLORS[r]}`}>
            <Shield className="w-3.5 h-3.5" />
            {ROLE_LABELS[r]}
          </span>
        ))}
      </div>

      {/* One table per section */}
      <div className="space-y-6">
        {sections.map((section) => {
          const menus = grouped[section];
          const meta  = SECTION_META[section] ?? { label: section, color: 'bg-gray-700 text-white', icon: LayoutGrid };
          const SectionIcon = meta.icon;

          return (
            <div key={section} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Section header */}
              <div className={`flex items-center gap-2 px-4 py-3 ${meta.color}`}>
                <SectionIcon className="w-4 h-4" />
                <span className="text-sm font-bold">{meta.label}</span>
                <span className="ml-auto text-xs opacity-70">{menus.length} items</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-44 whitespace-nowrap">Menu Item</th>
                      {ROLES.map((r) => (
                        <th key={r} className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${ROLE_COLORS[r]}`}>
                            {ROLE_LABELS[r]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map((menu, idx) => (
                      <tr key={menu.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-gray-900">{menu.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{menu.slug}</div>
                        </td>
                        {ROLES.map((role) => {
                          const visible  = !!data.permissions[role]?.[menu.id];
                          const key      = `${role}-${menu.id}`;
                          const isSaving = saving === key;
                          return (
                            <td key={role} className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => toggle(role, menu.id, visible)}
                                disabled={isSaving}
                                title={visible ? `Hide from ${ROLE_LABELS[role]}` : `Show for ${ROLE_LABELS[role]}`}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                  isSaving
                                    ? 'opacity-50 cursor-wait bg-gray-100'
                                    : visible
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
                                      : 'bg-red-50 hover:bg-red-100 text-red-400'
                                }`}
                              >
                                {isSaving
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                  : visible
                                    ? <Check className="w-3.5 h-3.5" />
                                    : <X className="w-3.5 h-3.5" />
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
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Changes take effect immediately. Users will see updated menus on their next login or page refresh.
      </p>
    </div>
  );
}
