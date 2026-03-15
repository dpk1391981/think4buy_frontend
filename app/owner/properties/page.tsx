'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Home, Plus, MapPin, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  slug: string;
  status: string;
  isApproved: boolean;
  images?: { url: string }[];
}

export default function OwnerProperties() {
  const [items,   setItems]   = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-gray-900">My Properties ({items.length})</h1>
        <Link href="/post-property" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add New
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((p) => {
          const approved = p.isApproved || p.status === 'active';
          const pending  = !approved && p.status !== 'rejected';
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gray-100 relative">
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
                }
                <span className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                  approved ? 'bg-emerald-100 text-emerald-700' :
                  pending  ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {approved ? <CheckCircle className="w-3 h-3" /> : pending ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {approved ? 'Active' : pending ? 'Pending' : 'Rejected'}
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
    </div>
  );
}
