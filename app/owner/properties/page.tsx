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
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="h-8 bg-gray-100 rounded-lg w-1/3 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gray-100 animate-pulse" />
              <div className="px-4 pt-3 pb-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
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
              <Link
                key={p.id}
                href={`/properties/${p.slug}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer block"
              >
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {p.images?.[0]?.url
                    ? <img src={resolveImageUrl(p.images[0].url)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
                  }
                  {/* Status badge */}
                  <span className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm ${
                    st === 'draft'     ? 'bg-gray-500/80 text-white' :
                    st === 'published' ? 'bg-emerald-500/90 text-white' :
                    st === 'rejected'  ? 'bg-red-500/90 text-white' :
                    'bg-amber-500/90 text-white'
                  }`}>
                    {st === 'draft'     ? <Clock className="w-3 h-3" /> :
                     st === 'published' ? <CheckCircle className="w-3 h-3" /> :
                     st === 'rejected'  ? <XCircle className="w-3 h-3" /> :
                                         <Clock className="w-3 h-3" />}
                    {st === 'draft' ? 'Draft' : st === 'published' ? 'Published' : st === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                  {/* Price overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-4 pb-2">
                    <span className="inline-flex items-center gap-1 text-white text-sm font-black">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {(p.price / 100000).toFixed(1)}L
                    </span>
                  </div>
                </div>
                <div className="px-4 pt-3 pb-4">
                  <h3 className="font-bold text-gray-900 text-sm truncate mb-1 group-hover:text-emerald-700 transition-colors">{p.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {p.city}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
