'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function CreateAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    city: '',
    agentLicense: '',
    agentBio: '',
    agentExperience: '',
    agentFreeQuota: '100',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createAgent({
        ...form,
        agentExperience: form.agentExperience ? parseInt(form.agentExperience) : undefined,
        agentFreeQuota: parseInt(form.agentFreeQuota) || 100,
      });
      router.push('/admin/agents');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  }

  const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    required,
  }: {
    label: string;
    name: keyof typeof form;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/agents" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Agents
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Create Agent</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Account */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Account Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" name="name" placeholder="Amit Verma" required />
            <Field label="Email" name="email" type="email" placeholder="agent@example.com" required />
            <Field label="Password" name="password" type="password" placeholder="Min 8 characters" required />
            <Field label="Phone" name="phone" placeholder="9876543210" />
          </div>
        </div>

        {/* Professional */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Professional Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" name="company" placeholder="PropElite Realty" />
            <Field label="City" name="city" placeholder="Mumbai" />
            <Field label="RERA License" name="agentLicense" placeholder="MH-RERA-A12345" />
            <Field label="Experience (years)" name="agentExperience" type="number" placeholder="5" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.agentBio}
              onChange={(e) => set('agentBio', e.target.value)}
              placeholder="Short professional bio..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Quota */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-1">Listing Quota</h2>
          <p className="text-sm text-gray-500 mb-4">
            Number of free property listings this agent can post. After the quota, paid plans are required.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              value={form.agentFreeQuota}
              onChange={(e) => set('agentFreeQuota', e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">free listings (default: 100)</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Agent'}
          </button>
          <Link
            href="/admin/agents"
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
