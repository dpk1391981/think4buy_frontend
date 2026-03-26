'use client';
import { useEffect, useState } from 'react';
import {
  Cloud, HardDrive, Eye, EyeOff, Save, CheckCircle, XCircle,
  FlaskConical, ImageIcon, AlertCircle,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

interface StorageForm {
  s3_enabled: boolean;
  s3_region: string;
  s3_bucket: string;
  s3_access_key: string;
  s3_secret_key: string;
  s3_cdn_url: string;
  watermark_enabled: boolean;
  watermark_text: string;
}

const AWS_REGIONS = [
  'ap-south-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1', 'ca-central-1', 'me-south-1',
];

const DEFAULTS: StorageForm = {
  s3_enabled: false,
  s3_region: 'ap-south-1',
  s3_bucket: '',
  s3_access_key: '',
  s3_secret_key: '',
  s3_cdn_url: '',
  watermark_enabled: false,
  watermark_text: '',
};

export default function StorageSettingsPage() {
  const [form, setForm] = useState<StorageForm>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getStorageConfig()
      .then((r: any) => {
        const d = r.data;
        setForm({
          s3_enabled:        d.s3_enabled        === '1',
          s3_region:         d.s3_region         || 'ap-south-1',
          s3_bucket:         d.s3_bucket         || '',
          s3_access_key:     d.s3_access_key     || '',
          s3_secret_key:     d.s3_secret_key     || '',
          s3_cdn_url:        d.s3_cdn_url        || '',
          watermark_enabled: d.watermark_enabled === '1',
          watermark_text:    d.watermark_text    || '',
        });
      })
      .catch(() => setError('Failed to load storage settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await adminApi.saveStorageConfig({
        s3_enabled:        form.s3_enabled        ? '1' : '0',
        s3_region:         form.s3_region,
        s3_bucket:         form.s3_bucket,
        s3_access_key:     form.s3_access_key,
        s3_secret_key:     form.s3_secret_key,
        s3_cdn_url:        form.s3_cdn_url,
        watermark_enabled: form.watermark_enabled ? '1' : '0',
        watermark_text:    form.watermark_text,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestS3 = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r: any = await adminApi.testS3Connection();
      setTestResult(r.data);
    } catch {
      setTestResult({ success: false, message: 'Test request failed' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Storage & Watermark Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure Amazon S3 for image storage and watermark branding on uploaded images.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* S3 Storage Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <Cloud size={18} className="text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Amazon S3 Storage</h2>
              <p className="text-xs text-gray-400">Upload images to S3 instead of local disk</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, s3_enabled: !f.s3_enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              form.s3_enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.s3_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className={`px-6 py-5 space-y-4 ${!form.s3_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Status banner */}
          {form.s3_enabled && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs font-medium">
              <Cloud size={13} />
              S3 is enabled — all new image uploads will go to S3
            </div>
          )}
          {!form.s3_enabled && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 text-xs font-medium">
              <HardDrive size={13} />
              Using local disk storage (S3 is off)
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">AWS Region</label>
              <select
                value={form.s3_region}
                onChange={e => setForm(f => ({ ...f, s3_region: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {AWS_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">S3 Bucket Name</label>
              <input
                type="text"
                value={form.s3_bucket}
                onChange={e => setForm(f => ({ ...f, s3_bucket: e.target.value }))}
                placeholder="my-property-images"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Access Key ID</label>
              <input
                type="text"
                value={form.s3_access_key}
                onChange={e => setForm(f => ({ ...f, s3_access_key: e.target.value }))}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Secret Access Key</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.s3_secret_key}
                  onChange={e => setForm(f => ({ ...f, s3_secret_key: e.target.value }))}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              CDN / Custom URL <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={form.s3_cdn_url}
              onChange={e => setForm(f => ({ ...f, s3_cdn_url: e.target.value }))}
              placeholder="https://cdn.think4buysale.com  (leave blank to use S3 URL)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              If set, image URLs will use this prefix instead of the S3 bucket URL.
            </p>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTestS3}
              disabled={testing || !form.s3_bucket || !form.s3_access_key}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FlaskConical size={14} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing…' : 'Test S3 Connection'}
            </button>
            {testResult && (
              <div className={`flex items-center gap-1.5 text-sm font-medium ${
                testResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult.success
                  ? <CheckCircle size={14} />
                  : <XCircle size={14} />
                }
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watermark Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <ImageIcon size={18} className="text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Image Watermark</h2>
              <p className="text-xs text-gray-400">Brand all uploaded images with your site name</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, watermark_enabled: !f.watermark_enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              form.watermark_enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.watermark_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className={`px-6 py-5 space-y-4 ${!form.watermark_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Watermark Text</label>
            <input
              type="text"
              value={form.watermark_text}
              onChange={e => setForm(f => ({ ...f, watermark_text: e.target.value }))}
              placeholder="think4buysale.com"
              maxLength={60}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This text will be overlaid at the bottom-right corner of every uploaded image.
            </p>
          </div>

          {/* Preview mockup */}
          {form.watermark_enabled && form.watermark_text && (
            <div className="relative w-full h-36 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden flex items-center justify-center">
              <span className="text-slate-400 text-sm">Image preview</span>
              <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-bold px-2 py-1 rounded">
                {form.watermark_text}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-60 transition"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={14} />
            Settings saved
          </div>
        )}
      </div>
    </div>
  );
}
