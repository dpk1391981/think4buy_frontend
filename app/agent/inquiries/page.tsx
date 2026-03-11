'use client';

import { useEffect, useState, useCallback } from 'react';
import { agentApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

interface Inquiry {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  type: string;
  status: string;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    slug: string;
  };
}

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-gray-100 text-gray-600',
  replied: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-600',
};

const TYPE_BADGE: Record<string, string> = {
  general: 'bg-gray-100 text-gray-600',
  visit: 'bg-purple-100 text-purple-700',
  call: 'bg-orange-100 text-orange-700',
  offer: 'bg-green-100 text-green-700',
};

export default function AgentInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewModal, setViewModal] = useState<Inquiry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await agentApi.getMyInquiries({ page, limit: 15 });
      const data = r.data;
      let items: Inquiry[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      if (filterStatus) {
        items = items.filter((i) => i.status === filterStatus);
      }
      setInquiries(items);
      setTotal(data?.total ?? items.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-500 text-sm mt-1">{total} total inquiries received</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { label: 'All', value: '' },
            { label: 'New', value: 'new' },
            { label: 'Read', value: 'read' },
            { label: 'Replied', value: 'replied' },
            { label: 'Closed', value: 'closed' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <div className="text-gray-500 font-medium">No inquiries yet</div>
            <p className="text-gray-400 text-sm mt-1">Inquiries from potential buyers will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Property', 'Inquirer', 'Contact', 'Type', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{inq.property?.title || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{inq.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {inq.phone && <div className="text-gray-700 text-xs">{inq.phone}</div>}
                    {inq.email && <div className="text-gray-400 text-xs">{inq.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[inq.type] || 'bg-gray-100 text-gray-600'}`}>
                      {inq.type || 'general'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{timeAgo(inq.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inq.status || 'new'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewModal(inq)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Inquiry Details</h3>
              <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Property</div>
                <div className="font-medium text-gray-900">{viewModal.property?.title || '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Name</div>
                  <div className="font-medium text-gray-900">{viewModal.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Type</div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[viewModal.type] || 'bg-gray-100 text-gray-600'}`}>
                    {viewModal.type || 'general'}
                  </span>
                </div>
                {viewModal.phone && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                    <div className="text-gray-900">{viewModal.phone}</div>
                  </div>
                )}
                {viewModal.email && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Email</div>
                    <div className="text-gray-900">{viewModal.email}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Status</div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[viewModal.status] || 'bg-gray-100 text-gray-600'}`}>
                    {viewModal.status || 'new'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Date</div>
                  <div className="text-gray-900">{new Date(viewModal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
              {viewModal.message && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Message</div>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-700">{viewModal.message}</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setViewModal(null)}
              className="mt-5 w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
