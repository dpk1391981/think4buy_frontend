'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Target, Phone, Mail, Clock } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  status: string;
  createdAt: string;
  property?: { title: string };
}

const STATUS_STYLES: Record<string, string> = {
  new:        'bg-blue-100 text-blue-700',
  contacted:  'bg-amber-100 text-amber-700',
  converted:  'bg-emerald-100 text-emerald-700',
  lost:       'bg-red-100 text-red-700',
};

export default function OwnerLeads() {
  const [items,   setItems]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leads/my')
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
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No leads yet</h2>
        <p className="text-gray-500 text-sm">Buyer inquiries from your listings will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-gray-900 mb-5">Leads / Enquiries ({items.length})</h1>
      <div className="space-y-3">
        {items.map((lead) => (
          <div key={lead.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{lead.name}</p>
                {lead.property?.title && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{lead.property.title}</p>
                )}
              </div>
              <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_STYLES[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {lead.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {lead.phone}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {lead.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(lead.createdAt).toLocaleDateString()}
              </span>
            </div>
            {lead.message && (
              <p className="text-sm text-gray-600 line-clamp-2">{lead.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
