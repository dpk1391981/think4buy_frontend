'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminWalletApi } from '@/lib/api';

interface WalletUser {
  id: string;
  name: string;
  email: string;
  role: string;
  wallet?: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Top-up modal
  const [topUpModal, setTopUpModal] = useState<{ user: WalletUser } | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDesc, setTopUpDesc] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const [topUpSaving, setTopUpSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      const r = await adminWalletApi.getAllWallets(params);
      const data = r.data;
      setWallets(data?.wallets || data?.items || data || []);
      setTotal(data?.total || (data?.wallets || data?.items || data || []).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function handleTopUp() {
    if (!topUpModal) return;
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      setTopUpError('Please enter a valid amount.');
      return;
    }
    setTopUpSaving(true);
    setTopUpError('');
    try {
      await adminWalletApi.topUp(topUpModal.user.id, amount, topUpDesc || undefined);
      setTopUpModal(null);
      setTopUpAmount('');
      setTopUpDesc('');
      load();
    } catch (e: any) {
      setTopUpError(e?.response?.data?.message || 'Failed to top up wallet.');
    } finally {
      setTopUpSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user token balances</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : wallets.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No wallets found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Role', 'Balance', 'Total Earned', 'Total Spent', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {wallets.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{w.name}</div>
                    <div className="text-gray-400 text-xs">{w.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      w.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      w.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {w.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">🪙</span>
                      <span className="font-semibold text-gray-900">{(w.wallet?.balance ?? 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-green-700 font-medium">
                    +{(w.wallet?.totalEarned ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-red-600 font-medium">
                    -{(w.wallet?.totalSpent ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setTopUpModal({ user: w }); setTopUpAmount(''); setTopUpDesc(''); setTopUpError(''); }}
                      disabled={actionLoading === w.id}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Top Up
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

      {/* Top Up Modal */}
      {topUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Top Up Wallet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Adding tokens to <span className="font-medium text-gray-700">{topUpModal.user.name}</span>
            </p>
            {topUpError && <p className="text-sm text-red-600 mb-3">{topUpError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Token Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🪙</span>
                  <input
                    type="number"
                    min={1}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Enter token amount"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={topUpDesc}
                  onChange={(e) => setTopUpDesc(e.target.value)}
                  placeholder="e.g. Promotional bonus"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleTopUp}
                disabled={topUpSaving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {topUpSaving ? 'Processing...' : 'Confirm Top Up'}
              </button>
              <button
                onClick={() => setTopUpModal(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
