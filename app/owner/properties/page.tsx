'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/imageUtils';
import { Home, Plus, MapPin, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  slug: string;
  status: string;
  isDraft: boolean;
  isApproved: boolean;
  approvalStatus: string;
  images?: { url: string }[];
}

type Tab = 'all' | 'published' | 'draft' | 'pending' | 'rejected';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft',     label: 'Draft' },
  { value: 'pending',   label: 'Pending' },
  { value: 'rejected',  label: 'Rejected' },
];

function getStatus(p: Property) {
  if (p.isDraft) return 'draft';
  if (p.approvalStatus === 'rejected') return 'rejected';
  if (p.isApproved || p.status === 'active') return 'published';
  return 'pending';
}

export default function OwnerProperties() {
  const [items,   setItems]   = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('all');

  useEffect(() => {
    api.get('/properties/my-listings')
      .then(({ data }) => setItems(Array.isArray(data) ? data : data.data ?? data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
          <Home className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No properties listed</h2>
        <p className="text-gray-500 text-sm mb-4">Post your first property listing to start getting leads.</p>
        <Link href="/post-property" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Post Property
        </Link>
      </div>
    );
  }

  // Tab counts
  const counts: Record<Tab, number> = {
    all:       items.length,
    published: items.filter(p => getStatus(p) === 'published').length,
    draft:     items.filter(p => getStatus(p) === 'draft').length,
    pending:   items.filter(p => getStatus(p) === 'pending').length,
    rejected:  items.filter(p => getStatus(p) === 'rejected').length,
  };

  const filtered = tab === 'all' ? items : items.filter(p => getStatus(p) === tab);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-gray-900">My Properties ({items.length})</h1>
        <Link href="/post-property" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add New
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar mb-5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {counts[t.value] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.value ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🏠</p>
          <p className="text-sm">No {tab} properties.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const st = getStatus(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-36 bg-gray-100 relative">
                  {p.images?.[0]?.url
                    ? <img src={resolveImageUrl(p.images[0].url)} alt={p.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
                  }
                  <span className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                    st === 'draft'     ? 'bg-gray-100 text-gray-600' :
                    st === 'published' ? 'bg-emerald-100 text-emerald-700' :
                    st === 'rejected'  ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {st === 'draft'     ? <Clock className="w-3 h-3" /> :
                     st === 'published' ? <CheckCircle className="w-3 h-3" /> :
                     st === 'rejected'  ? <XCircle className="w-3 h-3" /> :
                                         <Clock className="w-3 h-3" />}
                    {st === 'draft' ? 'Draft' : st === 'published' ? 'Published' : st === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm truncate mb-1">{p.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    {p.city}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-emerald-700">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {(p.price / 100000).toFixed(1)}L
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
