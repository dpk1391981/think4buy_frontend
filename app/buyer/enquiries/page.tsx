'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Enquiry {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  property?: { title: string; city: string };
}

const STATUS_STYLES: Record<string, { label: string; icon: any; cls: string }> = {
  pending:  { label: 'Pending',   icon: Clock,        cls: 'bg-amber-100 text-amber-700' },
  replied:  { label: 'Replied',   icon: CheckCircle,  cls: 'bg-green-100 text-green-700' },
  closed:   { label: 'Closed',    icon: XCircle,      cls: 'bg-gray-100 text-gray-600'   },
};

export default function BuyerEnquiries() {
  const [items,   setItems]   = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inquiries/my-inquiries')
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
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No enquiries yet</h2>
        <p className="text-gray-500 text-sm">When you contact a property owner or agent, your enquiries will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-black text-gray-900 mb-5">My Enquiries ({items.length})</h1>
      <div className="space-y-3">
        {items.map((item) => {
          const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
          const StatusIcon = s.icon;
          return (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.property?.title ?? 'Property'}</p>
                  <p className="text-xs text-gray-500">{item.property?.city}</p>
                </div>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${s.cls}`}>
                  <StatusIcon className="w-3 h-3" />
                  {s.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.message}</p>
              <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
