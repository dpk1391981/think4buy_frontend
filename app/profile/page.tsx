'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, MapPin, Building, Shield, Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';

export default function ProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', city: '', company: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    if (user) setForm({ name: user.name || '', email: user.email || '', city: user.city || '', company: user.company || '' });
  }, [user, authLoading, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refresh();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;
  }

  const initials = user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      <div className="container-max py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Avatar + name */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow">
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <Camera className="w-3.5 h-3.5 text-gray-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{user.role} Account</p>
            {user.isVerified && (
              <div className="flex items-center gap-1 mt-1 text-green-600 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Verified Account
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 font-medium hover:underline">
                Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary text-sm py-1.5 px-4"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg px-4 py-2 mb-4">
              <CheckCircle className="w-4 h-4" /> Profile updated successfully
            </div>
          )}

          <div className="space-y-4">
            {[
              { icon: User, label: 'Full Name', key: 'name', value: form.name, type: 'text' },
              { icon: Mail, label: 'Email Address', key: 'email', value: form.email, type: 'email' },
              { icon: Phone, label: 'Phone Number', key: null, value: user.phone || 'Not added', type: 'text' },
              { icon: MapPin, label: 'City', key: 'city', value: form.city, type: 'text' },
              { icon: Building, label: 'Company / Agency', key: 'company', value: form.company, type: 'text' },
            ].map(({ icon: Icon, label, key, value, type }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  {editing && key ? (
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input-field py-2 text-sm"
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-400 italic">Not added</span>}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Security</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Your account is secured with OTP-based login.</p>
          <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4" />
            OTP login is active — no password needed
          </div>
        </div>
      </div>
    </div>
  );
}
