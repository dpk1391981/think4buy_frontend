'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Home, Eye, Edit2, Trash2, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { propertiesApi } from '@/lib/api';
import PropertyCard from '@/components/property/PropertyCard';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-4 h-4 text-green-500" />,
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' };
      if (statusFilter) params.status = statusFilter;
      const res = await propertiesApi.getAll(params);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (authLoading || !user) {
    return <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-max py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your property listings</p>
            </div>
            <Link href="/post-property" className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Post New Property
            </Link>
          </div>

          {/* Status tabs */}
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  statusFilter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.data.map((p: any) => (
              <div key={p.id} className="relative group">
                <PropertyCard property={p} />
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                  {statusIcon[p.status] ?? <Clock className="w-4 h-4 text-gray-400" />}
                  <span className="capitalize">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">
              {statusFilter ? `No ${statusFilter} properties found.` : 'Post your first property and reach thousands of buyers.'}
            </p>
            <Link href="/post-property" className="btn-primary">
              <Plus className="w-4 h-4" /> Post Property FREE
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
