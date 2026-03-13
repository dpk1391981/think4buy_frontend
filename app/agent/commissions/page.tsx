'use client';

import { useEffect, useState, useCallback } from 'react';
import { IndianRupee, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { commissionsApi } from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  invoiced: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-600',
  clawback: 'bg-orange-100 text-orange-700',
};

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState<any>(null);

  const [detailItem, setDetailItem] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, statsRes] = await Promise.all([
        commissionsApi.getMy({ page, limit: 15, status: filterStatus || undefined }),
        commissionsApi.getStats(),
      ]);
      setCommissions(commRes.data.items || []);
      setTotal(commRes.data.total || 0);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const doDispute = async (id: string) => {
    const reason = prompt('Reason for dispute?');
    if (!reason) return;
    try {
      await commissionsApi.dispute(id, reason);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} commission records</p>
      </div>

      <div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Earned', value: fmt(stats.totalEarned || 0), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending', value: fmt(stats.totalPending || 0), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'This Month', value: fmt(stats.thisMonth || 0), icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'TDS Deducted', value: fmt(stats.totalTds || 0), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
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
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Invoiced', value: 'invoiced' },
            { label: 'Paid', value: 'paid' },
            { label: 'Disputed', value: 'disputed' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-16 text-center">
            <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No commissions yet</p>
            <p className="text-xs text-gray-400 mt-1">Commissions are generated when deals are closed</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Invoice', 'Gross', 'Agent Net', 'TDS', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{c.invoiceNumber || '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{fmt(c.grossCommission)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-green-700">{fmt(c.agentNetPayout)}</td>
                  <td className="px-4 py-3 text-xs text-red-500">{fmt(c.tdsAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDetailItem(c)}
                        className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-100"
                      >
                        Details
                      </button>
                      {c.status === 'invoiced' && (
                        <button
                          onClick={() => doDispute(c.id)}
                          className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100"
                        >
                          Dispute
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Commission Breakdown</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Invoice Number', value: detailItem.invoiceNumber || '—' },
                { label: 'Gross Commission', value: fmt(detailItem.grossCommission) },
                { label: 'Platform Share', value: fmt(detailItem.platformAmount) },
                { label: 'Agency Share', value: fmt(detailItem.agencyAmount) },
                { label: 'Agent Gross', value: fmt(detailItem.agentGross) },
                { label: 'TDS (5%)', value: fmt(detailItem.tdsAmount) },
                { label: 'Agent Net Payout', value: fmt(detailItem.agentNetPayout), bold: true },
                { label: 'Status', value: detailItem.status },
                { label: 'Payment Ref', value: detailItem.paymentReference || '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`${row.bold ? 'font-bold text-green-700' : 'font-medium text-gray-800'}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setDetailItem(null)}
              className="mt-4 w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
