'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminPaymentApi, adminWalletApi } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalSuccess: number;
  totalFailed: number;
  totalRefunded: number;
  totalRevenueMoney: number;
  totalTransactions: number;
  paymentEnabled: boolean;
}

interface PaymentTx {
  id: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  mode: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  failureReason?: string;
  createdAt: string;
  processedAt?: string;
  user?: { id: string; name: string; email: string; phone?: string };
  gateway?: { name: string; displayName: string };
}

interface WalletTx {
  id: string;
  type: string;
  reason: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  wallet?: { user?: { name: string; email: string } };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  success:   'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  initiated: 'bg-gray-100 text-gray-600',
  pending:   'bg-yellow-100 text-yellow-700',
  refunded:  'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const MODE_BADGE: Record<string, string> = {
  real_money: 'bg-blue-100 text-blue-700',
  tokens:     'bg-amber-100 text-amber-700',
};

const TYPE_BADGE: Record<string, string> = {
  credit: 'bg-green-100 text-green-700',
  debit:  'bg-red-100 text-red-700',
  bonus:  'bg-emerald-100 text-emerald-700',
  refund: 'bg-purple-100 text-purple-700',
};

function fmt(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Refund Modal ─────────────────────────────────────────────────────────────
function RefundModal({
  tx,
  onClose,
  onSuccess,
}: {
  tx: PaymentTx;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(tx.amount));
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason.trim()) { setError('Reason is required'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || amt > tx.amount) {
      setError(`Amount must be between 1 and ${tx.amount}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await adminPaymentApi.initiateRefund({ transactionId: tx.id, amount: amt, reason });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Initiate Refund</h3>
          <p className="text-sm text-gray-500 mt-1">
            Transaction: <span className="font-mono text-xs">{tx.id.slice(0, 16)}…</span>
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Amount (max {tx.currency} {tx.amount})
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              max={tx.amount}
              min={1}
              step={0.01}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Describe the reason for this refund..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Issue Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<'real' | 'tokens'>('real');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [paymentTxs, setPaymentTxs] = useState<PaymentTx[]>([]);
  const [walletTxs, setWalletTxs] = useState<WalletTx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState<PaymentTx | null>(null);

  const loadStats = async () => {
    try {
      const r = await adminPaymentApi.getDashboard();
      setStats(r.data);
    } catch { /* stats are non-blocking */ }
  };

  const loadPaymentTxs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminPaymentApi.getTransactions({
        page,
        limit: 20,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const d = r.data;
      setPaymentTxs(d.transactions ?? []);
      setTotal(d.total ?? 0);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, [page, statusFilter, dateFrom, dateTo]);

  const loadWalletTxs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminWalletApi.getAllTransactions({ page, limit: 20 });
      const d = r.data;
      setWalletTxs(d?.transactions ?? d?.items ?? (Array.isArray(d) ? d : []));
      setTotal(d?.total ?? 0);
    } catch { /* show empty */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (tab === 'real') loadPaymentTxs();
    else loadWalletTxs();
  }, [tab, loadPaymentTxs, loadWalletTxs]);

  const handleExport = async () => {
    try {
      const r = await adminPaymentApi.exportTransactions({
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format: 'csv',
      });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch { alert('Export failed'); }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor all payment activity across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/payments/gateways"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage Gateways
          </Link>
          {tab === 'real' && (
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Payment Mode"
            value={stats.paymentEnabled ? 'Real Money' : 'Token Mode'}
            color={stats.paymentEnabled ? 'text-blue-600' : 'text-amber-600'}
          />
          <StatCard
            label="Total Revenue"
            value={`₹${Number(stats.totalRevenueMoney ?? 0).toLocaleString('en-IN')}`}
            sub="Real money payments"
            color="text-green-600"
          />
          <StatCard
            label="Successful"
            value={Number(stats.totalSuccess ?? 0).toLocaleString()}
            color="text-green-700"
          />
          <StatCard
            label="Failed"
            value={Number(stats.totalFailed ?? 0).toLocaleString()}
            color="text-red-600"
          />
          <StatCard
            label="Refunded"
            value={Number(stats.totalRefunded ?? 0).toLocaleString()}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
        {(['real', 'tokens'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              tab === t ? 'bg-white font-medium shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t === 'real' ? 'Real Money Payments' : 'Token Transactions'}
          </button>
        ))}
      </div>

      {/* Filters (real money tab) */}
      {tab === 'real' && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {['initiated', 'pending', 'success', 'failed', 'refunded', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-sm text-gray-500 hover:text-gray-800 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : tab === 'real' ? (
          paymentTxs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">No payment transactions found.</p>
              {!stats?.paymentEnabled && (
                <p className="text-xs text-gray-400 mt-2">
                  Payment mode is currently <strong>Token-based</strong>.
                  Enable real payments via <code className="bg-gray-100 px-1 rounded">PAYMENT_ENABLED=true</code> and activate a gateway.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Date', 'User', 'Amount', 'Type', 'Mode', 'Status', 'Gateway', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paymentTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-xs">{tx.user?.name ?? '—'}</div>
                        <div className="text-gray-400 text-xs">{tx.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {tx.currency} {Number(tx.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 capitalize text-xs text-gray-600">
                        {tx.type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${MODE_BADGE[tx.mode] ?? 'bg-gray-100 text-gray-600'}`}>
                          {tx.mode === 'real_money' ? 'Money' : 'Tokens'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {tx.status}
                        </span>
                        {tx.failureReason && (
                          <div className="text-xs text-red-500 mt-0.5 max-w-xs truncate" title={tx.failureReason}>
                            {tx.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {tx.gateway?.displayName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {tx.status === 'success' && tx.mode === 'real_money' && (
                          <button
                            onClick={() => setRefundTarget(tx)}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Token transactions table */
          walletTxs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No token transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Date', 'User', 'Type', 'Reason', 'Amount', 'Balance Before', 'Balance After', 'Description'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {walletTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-xs">{tx.wallet?.user?.name ?? '—'}</div>
                        <div className="text-gray-400 text-xs">{tx.wallet?.user?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[tx.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 capitalize">{tx.reason?.replace(/_/g, ' ')}</td>
                      <td className={`px-4 py-3 font-semibold text-xs whitespace-nowrap ${tx.type === 'debit' ? 'text-red-600' : 'text-green-700'}`}>
                        {tx.type === 'debit' ? '-' : '+'}{tx.amount} 🪙
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{tx.balanceBefore}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{tx.balanceAfter}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{tx.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <RefundModal
          tx={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSuccess={() => { loadPaymentTxs(); loadStats(); }}
        />
      )}
    </div>
  );
}
