'use client';

import { useEffect, useState, useCallback } from 'react';
import { IndianRupee, CheckCircle, Clock } from 'lucide-react';
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

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, statsRes] = await Promise.all([
        commissionsApi.getAll({ page, limit: 20, status: filterStatus || undefined }),
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

  const doApprove = async (id: string) => {
    setActionLoading(id + '_approve');
    try {
      await commissionsApi.approve(id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const doPay = async (id: string) => {
    const ref = prompt('Payment reference (UTR/cheque no.)?');
    if (!ref) return;
    setActionLoading(id + '_pay');
    try {
      await commissionsApi.markPaid(id, { paymentReference: ref });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Commissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} commission records</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Paid Out', value: fmt(stats.totalEarned || 0), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Approval', value: fmt(stats.totalPending || 0), icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Platform Revenue', value: fmt(stats.platformRevenue || 0), icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'TDS Collected', value: fmt(stats.totalTds || 0), icon: IndianRupee, color: 'text-red-500', bg: 'bg-red-50' },
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
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-16 text-center">
            <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No commissions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Invoice', 'Agent', 'Gross', 'Agent Net', 'TDS', 'Platform', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{c.invoiceNumber || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.agentId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{fmt(c.grossCommission)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-green-700">{fmt(c.agentNetPayout)}</td>
                  <td className="px-4 py-3 text-xs text-red-500">{fmt(c.tdsAmount)}</td>
                  <td className="px-4 py-3 text-xs text-blue-600">{fmt(c.platformAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.status === 'pending' && (
                        <button
                          onClick={() => doApprove(c.id)}
                          disabled={actionLoading === c.id + '_approve'}
                          className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {c.status === 'invoiced' && (
                        <button
                          onClick={() => doPay(c.id)}
                          disabled={actionLoading === c.id + '_pay'}
                          className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
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
