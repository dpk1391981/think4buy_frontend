'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { savedApi } from '@/lib/api';
import { Heart, MapPin, IndianRupee, ExternalLink } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  slug: string;
  images?: { url: string }[];
}

export default function BuyerSaved() {
  const [items, setItems]     = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    savedApi.getSaved({ page: 1, limit: 50 })
      .then(({ data }) => {
        // service returns { items: Property[], total, page, limit }
        const list: Property[] = Array.isArray(data) ? data : data.items ?? [];
        setItems(list.filter(Boolean));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-pink-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No saved properties</h2>
        <p className="text-gray-500 text-sm mb-4">Start browsing and save properties you like.</p>
        <Link href="/properties" className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-colors">
          Browse Properties
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-black text-gray-900 mb-5">Saved Properties ({items.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-36 bg-gray-100 relative">
              {p.images?.[0]?.url
                ? <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
              }
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-sm truncate mb-1">{p.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                {p.city}
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-cyan-700 mb-3">
                <IndianRupee className="w-3.5 h-3.5" />
                {(p.price / 100000).toFixed(1)}L
              </div>
              <Link href={`/properties/${p.slug}`} className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold hover:underline">
                View Property <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
