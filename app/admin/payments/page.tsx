'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminWalletApi } from '@/lib/api';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'bonus';
  reason: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

const TYPE_BADGE: Record<string, string> = {
  credit: 'bg-green-100 text-green-700',
  bonus: 'bg-emerald-100 text-emerald-700',
  debit: 'bg-red-100 text-red-700',
};

const TYPE_AMOUNT: Record<string, string> = {
  credit: 'text-green-700',
  bonus: 'text-emerald-700',
  debit: 'text-red-600',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminWalletApi.getAllTransactions({ page, limit: 20 });
      const data = r.data;
      const items = data?.transactions || data?.items || (Array.isArray(data) ? data : []);
      setTransactions(items);
      setTotal(data?.total ?? items.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">All wallet transaction history across the platform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No transactions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'User', 'Type', 'Reason', 'Amount', 'Balance Before', 'Balance After', 'Description'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{formatDate(tx.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{(tx as any).wallet?.user?.name || tx.user?.name || '—'}</div>
                    <div className="text-gray-400 text-xs">{(tx as any).wallet?.user?.email || tx.user?.email || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{tx.reason?.replace(/_/g, ' ') || '—'}</td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${TYPE_AMOUNT[tx.type] || 'text-gray-700'}`}>
                    {tx.type === 'debit' ? '-' : '+'}{tx.amount} 🪙
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tx.balanceBefore?.toLocaleString() ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.balanceAfter?.toLocaleString() ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
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
