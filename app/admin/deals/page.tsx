'use client';

import { useEffect, useState, useCallback } from 'react';
import { Handshake, IndianRupee, TrendingUp } from 'lucide-react';
import { dealsApi } from '@/lib/api';

const STAGE_BADGE: Record<string, string> = {
  shortlisted: 'bg-gray-100 text-gray-600',
  negotiation: 'bg-yellow-100 text-yellow-700',
  offer_accepted: 'bg-blue-100 text-blue-700',
  booking_paid: 'bg-indigo-100 text-indigo-700',
  agreement_created: 'bg-purple-100 text-purple-700',
  closed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [stats, setStats] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsRes, statsRes] = await Promise.all([
        dealsApi.getAll({ page, limit: 20, stage: filterStage || undefined }),
        dealsApi.getStats(),
      ]);
      setDeals(dealsRes.data.items || []);
      setTotal(dealsRes.data.total || 0);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStage]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Deals</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} deals in the system</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Deals', value: stats.total || 0, icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Closed', value: stats.closed || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Active Pipeline', value: (stats.total || 0) - (stats.closed || 0) - (stats.cancelled || 0), icon: Handshake, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Total GMV', value: fmt(stats.totalRevenue || 0), icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {[
            { label: 'All', value: '' },
            { label: 'Negotiation', value: 'negotiation' },
            { label: 'Offer Accepted', value: 'offer_accepted' },
            { label: 'Booking Paid', value: 'booking_paid' },
            { label: 'Closed', value: 'closed' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => { setFilterStage(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStage === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="p-16 text-center">
            <Handshake className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No deals found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Lead', 'Agent', 'Agreed Price', 'Commission', 'Stage', 'Seller Type', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{d.leadId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{d.agentId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{fmt(d.agreedPrice)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{d.commissionRate}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STAGE_BADGE[d.stage]}`}>
                      {d.stage?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 capitalize">{d.sellerType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
