'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
};

const VALUE_TYPE_BADGE: Record<string, string> = {
  boolean: 'bg-blue-100 text-blue-700',
  number:  'bg-purple-100 text-purple-700',
  string:  'bg-gray-100 text-gray-700',
  json:    'bg-orange-100 text-orange-700',
};

export default function SystemConfigPage() {
  const [configs, setConfigs]     = useState<SystemConfig[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [groupFilter, setGroupFilter] = useState('all');
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = groupFilter !== 'all' ? { group: groupFilter } : {};
      const r = await api.get<SystemConfig[]>('/admin/config', { params });
      setConfigs(r.data);
      const vals: Record<string, string> = {};
      r.data.forEach(c => { vals[c.key] = c.value; });
      setEditValues(vals);
    } catch {
      setError('Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupFilter]);

  const handleSave = async (config: SystemConfig) => {
    setSaving(config.key);
    setSuccess('');
    setError('');
    try {
      await api.put(`/admin/config/${config.key}`, {
        value:       editValues[config.key],
        valueType:   config.valueType,
        description: config.description,
        group:       config.group,
      });
      setSuccess(`Saved: ${config.key}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError(`Failed to save ${config.key}`);
    } finally {
      setSaving(null);
    }
  };

  const renderValueInput = (config: SystemConfig) => {
    const val = editValues[config.key] ?? config.value;

    if (config.valueType === 'boolean') {
      return (
        <button
          onClick={() => setEditValues(prev => ({
            ...prev,
            [config.key]: prev[config.key] === 'true' ? 'false' : 'true',
          }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            val === 'true' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              val === 'true' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      );
    }

    if (config.valueType === 'json') {
      return (
        <textarea
          value={val}
          onChange={e => setEditValues(prev => ({ ...prev, [config.key]: e.target.value }))}
          rows={3}
          className="w-full text-sm font-mono border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      );
    }

    return (
      <input
        type={config.valueType === 'number' ? 'number' : 'text'}
        value={val}
        onChange={e => setEditValues(prev => ({ ...prev, [config.key]: e.target.value }))}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  const groups = ['all', ...Object.keys(GROUP_LABELS)];
  const grouped = configs.reduce<Record<string, SystemConfig[]>>((acc, c) => {
    const g = c.group || 'general';
    if (!acc[g]) acc[g] = [];
    acc[g].push(c);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Runtime feature toggles and settings. Changes apply immediately (Redis cache TTL: 5 min).
        </p>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Group Filter */}
      <div className="flex gap-2 flex-wrap">
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              groupFilter === g
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {g === 'all' ? 'All' : GROUP_LABELS[g] ?? g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, groupConfigs]) => (
            <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  {GROUP_LABELS[group] ?? group}
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {groupConfigs.map(config => (
                  <div key={config.key} className="px-5 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                            {config.key}
                          </code>
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${VALUE_TYPE_BADGE[config.valueType]}`}>
                            {config.valueType}
                          </span>
                          {config.isSecret && (
                            <span className="px-2 py-0.5 text-xs rounded font-medium bg-red-100 text-red-700">
                              secret
                            </span>
                          )}
                        </div>
                        {config.description && (
                          <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Last updated: {new Date(config.updatedAt).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 sm:min-w-[280px]">
                        <div className="flex-1">
                          {renderValueInput(config)}
                        </div>
                        <button
                          onClick={() => handleSave(config)}
                          disabled={saving === config.key || editValues[config.key] === config.value}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {saving === config.key ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
