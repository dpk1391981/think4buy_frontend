'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ToggleLeft, ToggleRight, Save, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface SystemConfig {
  id:          string;
  key:         string;
  value:       string;
  valueType:   'boolean' | 'string' | 'number' | 'json';
  description: string;
  group:       string;
  isSecret:    boolean;
  updatedAt:   string;
}

const GROUP_LABELS: Record<string, string> = {
  media:    'Media Processing',
  database: 'Database',
  storage:  'Storage & CDN',
  general:  'General',
  feature:  'Feature Flags',
  forms:    'Form Fields',
  billing:  'Billing',
  auth:     'Authentication',
};

const GROUP_ORDER = ['general', 'auth', 'feature', 'media', 'storage', 'database', 'billing', 'forms'];

/** Normalise a raw DB value to a safe display value based on its declared type */
function normaliseValue(raw: string | null | undefined, type: string): string {
  const str = String(raw ?? '');
  if (type === 'boolean') {
    // Accept 'true'/'1'/truthy strings; treat anything else (incl. 'undefined') as 'false'
    return str === 'true' || str === '1' ? 'true' : 'false';
  }
  if (type === 'number') {
    const n = Number(str);
    return isNaN(n) ? '0' : str;
  }
  // string / json — treat 'undefined' as empty
  return str === 'undefined' ? '' : str;
}

export default function SystemConfigPage() {
  const [configs, setConfigs]       = useState<SystemConfig[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [groupFilter, setGroupFilter] = useState('all');
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = groupFilter !== 'all' ? { group: groupFilter } : {};
      const r = await api.get<SystemConfig[]>('/admin/config', { params });
      setConfigs(r.data);
      const vals: Record<string, string> = {};
      r.data.forEach(c => { vals[c.key] = normaliseValue(c.value, c.valueType); });
      setEditValues(vals);
    } catch {
      showToast('Failed to load configs', false);
    } finally {
      setLoading(false);
    }
  }, [groupFilter]);

  useEffect(() => { load(); }, [load]);

  const saveConfig = async (config: SystemConfig, overrideValue?: string) => {
    const valueToSave = overrideValue ?? editValues[config.key];
    setSaving(config.key);
    try {
      await api.put(`/admin/config/${config.key}`, {
        value:       valueToSave,
        valueType:   config.valueType,
        description: config.description,
        group:       config.group,
      });
      // Update local state so "unchanged" check reflects the saved value
      setConfigs(prev => prev.map(c => c.key === config.key ? { ...c, value: valueToSave, updatedAt: new Date().toISOString() } : c));
      showToast(`Saved ${config.key}`, true);
    } catch {
      showToast(`Failed to save ${config.key}`, false);
    } finally {
      setSaving(null);
    }
  };

  const toggleBoolean = async (config: SystemConfig) => {
    const next = editValues[config.key] === 'true' ? 'false' : 'true';
    setEditValues(prev => ({ ...prev, [config.key]: next }));
    await saveConfig(config, next);
  };

  // ── Render a value control based on type ──────────────────────────────────

  const renderControl = (config: SystemConfig) => {
    const val = editValues[config.key] ?? normaliseValue(config.value, config.valueType);
    const isOn = val === 'true';

    if (config.valueType === 'boolean') {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleBoolean(config)}
            disabled={saving === config.key}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
              isOn ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className={`text-sm font-semibold ${isOn ? 'text-emerald-600' : 'text-gray-400'}`}>
            {isOn ? 'Enabled' : 'Disabled'}
          </span>
          {saving === config.key && (
            <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
          )}
        </div>
      );
    }

    if (config.valueType === 'json') {
      return (
        <div className="flex gap-2 items-start">
          <textarea
            value={val}
            onChange={e => setEditValues(prev => ({ ...prev, [config.key]: e.target.value }))}
            rows={3}
            className="flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-gray-50"
          />
          <button
            onClick={() => saveConfig(config)}
            disabled={saving === config.key || val === normaliseValue(config.value, config.valueType)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving === config.key
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />
            }
            Save
          </button>
        </div>
      );
    }

    // string or number
    const isSecret = config.isSecret;
    const revealed = showSecret[config.key];
    return (
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type={isSecret && !revealed ? 'password' : config.valueType === 'number' ? 'number' : 'text'}
            value={val}
            onChange={e => setEditValues(prev => ({ ...prev, [config.key]: e.target.value }))}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 pr-8"
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => setShowSecret(prev => ({ ...prev, [config.key]: !prev[config.key] }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <button
          onClick={() => saveConfig(config)}
          disabled={saving === config.key || val === normaliseValue(config.value, config.valueType)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving === config.key
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            : <Save className="w-3.5 h-3.5" />
          }
          Save
        </button>
      </div>
    );
  };

  // ── Group + sort ──────────────────────────────────────────────────────────

  const allGroups = Array.from(new Set(configs.map(c => c.group || 'general')));
  const sortedGroups = [
    ...GROUP_ORDER.filter(g => allGroups.includes(g)),
    ...allGroups.filter(g => !GROUP_ORDER.includes(g)),
  ];
  const grouped = configs.reduce<Record<string, SystemConfig[]>>((acc, c) => {
    const g = c.group || 'general';
    if (!acc[g]) acc[g] = [];
    acc[g].push(c);
    return acc;
  }, {});

  const filterTabs = ['all', ...sortedGroups];

  const TYPE_BADGE: Record<string, string> = {
    boolean: 'bg-emerald-100 text-emerald-700',
    number:  'bg-purple-100 text-purple-700',
    string:  'bg-gray-100 text-gray-600',
    json:    'bg-orange-100 text-orange-700',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Runtime feature toggles and settings. Toggles apply instantly; text/number fields require Save.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border ${
          toast.ok
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.ok
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* Group Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(g => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors capitalize ${
              groupFilter === g
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {g === 'all' ? 'All' : (GROUP_LABELS[g] ?? g)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {(groupFilter === 'all' ? sortedGroups : [groupFilter]).map(group => {
            const groupConfigs = grouped[group];
            if (!groupConfigs?.length) return null;
            return (
              <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-700 text-sm">
                    {GROUP_LABELS[group] ?? <span className="capitalize">{group}</span>}
                  </h2>
                  <span className="text-xs text-gray-400">{groupConfigs.length} setting{groupConfigs.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {groupConfigs.map(config => (
                    <div key={config.key} className="px-5 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Left — key + description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {config.key}
                            </code>
                            <span className={`px-2 py-0.5 text-[11px] rounded font-medium ${TYPE_BADGE[config.valueType] ?? TYPE_BADGE.string}`}>
                              {config.valueType}
                            </span>
                            {config.isSecret && (
                              <span className="px-2 py-0.5 text-[11px] rounded font-medium bg-red-100 text-red-700">
                                secret
                              </span>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{config.description}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            Updated {new Date(config.updatedAt).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* Right — control */}
                        <div className={config.valueType === 'boolean' ? 'sm:w-48' : 'sm:w-72'}>
                          {renderControl(config)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {configs.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No configurations found</div>
          )}
        </div>
      )}
    </div>
  );
}
