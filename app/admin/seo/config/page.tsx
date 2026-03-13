'use client';
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { seoApi } from '@/lib/api';

const DEFAULT_CONFIGS = [
  { key: 'site_title', label: 'Site Title', description: 'Default title tag for all pages', value: '' },
  { key: 'site_description', label: 'Site Description', description: 'Default meta description', value: '' },
  { key: 'site_keywords', label: 'Site Keywords', description: 'Default meta keywords (comma separated)', value: '' },
  { key: 'og_image', label: 'OG Image URL', description: 'Default Open Graph image for social sharing', value: '' },
  { key: 'twitter_handle', label: 'Twitter Handle', description: 'e.g. @think4buysale', value: '' },
  { key: 'google_site_verification', label: 'Google Site Verification', description: 'Google Search Console verification code', value: '' },
  { key: 'robots_txt_extras', label: 'Robots.txt Extra Rules', description: 'Additional robots.txt directives', value: '' },
  { key: 'canonical_domain', label: 'Canonical Domain', description: 'e.g. https://think4buysale.com', value: '' },
];

interface ConfigItem { id?: string; key: string; label: string; description: string; value: string; }

export default function AdminSeoConfigPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>(DEFAULT_CONFIGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Custom config state
  const [customKey, setCustomKey] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    seoApi.adminGetConfigs()
      .then(r => {
        const dbConfigs: any[] = r.data || [];
        setConfigs(prev => {
          const merged = prev.map(c => {
            const dbVal = dbConfigs.find(d => d.key === c.key);
            return dbVal ? { ...c, id: dbVal.id, value: dbVal.value || '' } : c;
          });
          // Add any custom configs not in defaults
          const extraConfigs = dbConfigs.filter(d => !DEFAULT_CONFIGS.find(c => c.key === d.key));
          if (extraConfigs.length > 0) {
            return [...merged, ...extraConfigs.map((e: any) => ({ id: e.id, key: e.key, label: e.label || e.key, description: e.description || '', value: e.value || '' }))];
          }
          return merged;
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await seoApi.adminBulkUpsertConfigs(
        configs.map(c => ({ key: c.key, value: c.value, label: c.label, description: c.description }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const addCustomConfig = () => {
    if (!customKey || !customLabel) return;
    setConfigs(prev => [...prev, { key: customKey, label: customLabel, description: '', value: customValue }]);
    setCustomKey(''); setCustomLabel(''); setCustomValue('');
  };

  const removeConfig = (key: string) => {
    setConfigs(prev => prev.filter(c => c.key !== key));
  };

  if (loading) {
    return <div className="p-8 space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Global SEO settings for the site</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50`}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
        {configs.map((config, idx) => (
          <div key={config.key} className="p-4 flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-semibold text-gray-800">{config.label}</label>
                <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{config.key}</code>
              </div>
              {config.description && <p className="text-xs text-gray-500 mb-2">{config.description}</p>}
              {config.key === 'site_description' || config.key === 'robots_txt_extras' ? (
                <textarea value={config.value} onChange={e => handleChange(config.key, e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              ) : (
                <input value={config.value} onChange={e => handleChange(config.key, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              )}
            </div>
            {idx >= DEFAULT_CONFIGS.length && (
              <button onClick={() => removeConfig(config.key)} className="mt-6 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Config */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Add Custom Config
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Key *</label>
            <input value={customKey} onChange={e => setCustomKey(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
              placeholder="custom_key" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Label *</label>
            <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
              placeholder="Custom Field" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Default Value</label>
            <input value={customValue} onChange={e => setCustomValue(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <button onClick={addCustomConfig} disabled={!customKey || !customLabel}
          className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
          Add Config
        </button>
      </div>
    </div>
  );
}
