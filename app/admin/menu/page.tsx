'use client';

import { useState, useEffect } from 'react';
import { seoApi } from '@/lib/api';
import {
  Navigation, Home, Users, Wrench, FolderOpen, BookOpen,
  RefreshCw, CheckCircle, AlertCircle, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  key: string;
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
  locked?: boolean; // cannot be toggled off
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'nav_properties_enabled',
    label: 'Properties',
    href: '/properties',
    description: 'Main property search and listings. Core site feature — always visible.',
    icon: <Home className="w-5 h-5" />,
    locked: true,
  },
  {
    key: 'nav_agents_enabled',
    label: 'Agents',
    href: '/agents',
    description: 'Browse verified real estate agents and agency profiles.',
    icon: <Users className="w-5 h-5" />,
  },
  {
    key: 'nav_services_enabled',
    label: 'Services',
    href: '/services',
    description: 'Home loan, legal, interior, and other ancillary services.',
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    key: 'nav_new_projects_enabled',
    label: 'New Projects',
    href: '/new-projects',
    description: 'Curated developer projects, new launches and under-construction inventory.',
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    key: 'nav_articles_enabled',
    label: 'Articles',
    href: '/articles',
    description: 'Real estate guides, market insights, legal tips and investment advice. Disabled by default — enable once you have published articles.',
    icon: <BookOpen className="w-5 h-5" />,
  },
];

export default function AdminMenuPage() {
  const [config, setConfig]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await seoApi.adminGetConfigs();
      const map: Record<string, string> = {};
      (res.data || []).forEach((c: any) => { map[c.key] = c.value; });
      setConfig(map);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }

  function isEnabled(key: string, locked?: boolean): boolean {
    if (locked) return true;
    // Unset keys default: properties/agents/services/new-projects = true, articles = false
    if (!(key in config)) {
      return key !== 'nav_articles_enabled';
    }
    return config[key] === 'true';
  }

  async function handleToggle(item: NavItem) {
    if (item.locked) return;
    const current = isEnabled(item.key);
    const next    = !current;
    setSaving(item.key);
    try {
      await seoApi.adminUpsertConfig(item.key, String(next));
      setConfig(c => ({ ...c, [item.key]: String(next) }));
      // Bust the client-side nav config cache so the header picks up changes immediately
      if (typeof window !== 'undefined') localStorage.removeItem('t4bs_nav_cfg');
      showToast('success', `"${item.label}" ${next ? 'enabled' : 'disabled'} in navigation`);
    } catch {
      showToast('error', `Failed to update "${item.label}"`);
    } finally {
      setSaving(null);
    }
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const enabledCount = NAV_ITEMS.filter(i => isEnabled(i.key, i.locked)).length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary-600" /> Menu Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Control which items appear in the main site navigation. Changes take effect immediately.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 px-3 py-2 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Live preview strip */}
      <div className="bg-slate-800 rounded-xl px-5 py-3">
        <p className="text-xs text-slate-400 font-medium mb-2.5 uppercase tracking-wide">Live Preview — Navigation Bar</p>
        <div className="flex items-center gap-1 flex-wrap">
          {NAV_ITEMS.filter(i => isEnabled(i.key, i.locked)).map(item => (
            <span key={item.key}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-100 rounded-md">
              {item.label}
            </span>
          ))}
          {enabledCount === 0 && <span className="text-xs text-slate-500 italic">No nav items enabled</span>}
        </div>
      </div>

      {/* Nav item cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading config…
        </div>
      ) : (
        <div className="grid gap-3">
          {NAV_ITEMS.map(item => {
            const enabled   = isEnabled(item.key, item.locked);
            const isSaving  = saving === item.key;

            return (
              <div key={item.key}
                className={cn(
                  'bg-white rounded-xl border p-5 flex items-start gap-4 transition-all duration-200',
                  enabled ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-70',
                  item.locked && 'bg-gray-50'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  enabled ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'
                )}>
                  {item.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900">{item.label}</span>
                    {item.locked && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" /> Always on
                      </span>
                    )}
                    {!item.locked && enabled && (
                      <span className="text-xs text-green-600 font-medium">Visible</span>
                    )}
                    {!item.locked && !enabled && (
                      <span className="text-xs text-gray-400">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{item.href}</p>
                </div>

                {/* Toggle */}
                <div className="flex-shrink-0 pt-0.5">
                  {item.locked ? (
                    <div className="w-11 h-6 bg-primary-500 rounded-full flex items-center justify-end px-0.5 cursor-not-allowed">
                      <div className="w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={isSaving}
                      aria-label={`${enabled ? 'Disable' : 'Enable'} ${item.label}`}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400',
                        enabled ? 'bg-primary-500' : 'bg-gray-200',
                        isSaving && 'opacity-60 cursor-wait'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      )} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">How it works</p>
          <ul className="space-y-1 text-blue-600 text-xs">
            <li>• Changes apply to the public site navigation instantly — no restart needed.</li>
            <li>• The <strong>Articles</strong> tab is hidden by default. Enable it once you have published articles.</li>
            <li>• <strong>Properties</strong> is always shown as it is the core feature of the platform.</li>
            <li>• Mobile bottom nav and slide-out drawer also respect these settings.</li>
          </ul>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 right-6 z-[500] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
