'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bell, IndianRupee } from 'lucide-react';

interface Alert {
  id: string;
  city: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  createdAt: string;
}

export default function BuyerAlerts() {
  const [items,   setItems]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/alerts')
      .then(({ data }) => setItems(Array.isArray(data) ? data : data.items ?? data.data ?? []))
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
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No property alerts</h2>
        <p className="text-gray-500 text-sm">Create alerts to get notified when matching properties are listed.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-gray-900 mb-5">Property Alerts ({items.length})</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">{item.city} — {item.propertyType || 'Any type'}</p>
              {(item.minPrice || item.maxPrice) && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <IndianRupee className="w-3 h-3" />
                  {item.minPrice ? `${(item.minPrice / 100000).toFixed(0)}L` : '0'}
                  {' – '}
                  {item.maxPrice ? `${(item.maxPrice / 100000).toFixed(0)}L` : '∞'}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Created {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
