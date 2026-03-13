'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AvatarUpload from '@/components/common/AvatarUpload';

interface ProfileForm {
  name: string;
  phone: string;
  city: string;
  company: string;
  agentLicense: string;
  agentBio: string;
  agentExperience: string;
}

export default function AgentProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    city: '',
    company: '',
    agentLicense: '',
    agentBio: '',
    agentExperience: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    authApi.getProfile()
      .then((r) => {
        const d = r.data;
        setForm({
          name: d.name || '',
          phone: d.phone || '',
          city: d.city || '',
          company: d.company || '',
          agentLicense: d.agentLicense || '',
          agentBio: d.agentBio || '',
          agentExperience: d.agentExperience ? String(d.agentExperience) : '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { showToast('error', 'Name is required.'); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: form.name.trim(),
        city: form.city.trim() || undefined,
        company: form.company.trim() || undefined,
        ...({ phone: form.phone.trim() || undefined } as any),
        ...({ agentLicense: form.agentLicense.trim() || undefined } as any),
        ...({ agentBio: form.agentBio.trim() || undefined } as any),
        ...({ agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined } as any),
      });
      await refresh();
      showToast('success', 'Profile updated successfully!');
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Update your personal and professional information</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-5">
          <AvatarUpload size={88} />
          <div>
            <div className="font-semibold text-gray-900 text-base">{user?.name}</div>
            <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.email}</div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 XXXXX XXXXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Professional Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company / Agency</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="e.g. XYZ Realty Pvt Ltd"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text"
                value={form.agentLicense}
                onChange={(e) => setForm((f) => ({ ...f, agentLicense: e.target.value }))}
                placeholder="e.g. RERA/MH/2024/001234"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Experience (years)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={form.agentExperience}
                onChange={(e) => setForm((f) => ({ ...f, agentExperience: e.target.value }))}
                placeholder="Years of experience"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.agentBio}
                onChange={(e) => setForm((f) => ({ ...f, agentBio: e.target.value }))}
                placeholder="A brief description about yourself and your expertise..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
