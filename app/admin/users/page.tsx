'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminWalletApi } from '@/lib/api';
import { resolveImageSrc } from '@/components/common/OptimizedImage';

interface WalletEntry {
  id: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    city?: string;
    avatar?: string;
    isActive?: boolean;
    agentTick?: string;
  };
}

export default function AdminUsersPage() {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Top-up modal state
  const [topUpModal, setTopUpModal] = useState<WalletEntry | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDesc, setTopUpDesc] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminWalletApi.getAllWallets({
        page,
        limit: 15,
        search: search || undefined,
      });
      setWallets(r.data?.wallets || r.data?.items || []);
      setTotal(r.data?.total || 0);
    } catch {
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredWallets =
    roleFilter === 'all' ? wallets : wallets.filter((w) => w.user?.role === roleFilter);

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    agent: 'bg-blue-100 text-blue-700',
    seller: 'bg-green-100 text-green-700',
    buyer: 'bg-gray-100 text-gray-600',
  };

  const TICK_ICONS: Record<string, string> = {
    blue: '🔵',
    gold: '🥇',
    diamond: '💎',
  };

  async function handleTopUp() {
    if (!topUpModal) return;
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      setTopUpError('Enter a valid amount');
      return;
    }
    setTopUpLoading(true);
    setTopUpError('');
    try {
      await adminWalletApi.topUp(topUpModal.user.id, amount, topUpDesc || undefined);
      setTopUpModal(null);
      setTopUpAmount('');
      setTopUpDesc('');
      load();
    } catch (e: any) {
      setTopUpError(e?.response?.data?.message || 'Failed to add tokens');
    } finally {
      setTopUpLoading(false);
    }
  }

  const ROLES = ['all', 'admin', 'agent', 'seller', 'buyer'];

  const statCards = [
    {
      label: 'Total Users',
      value: total,
      color: 'border-l-blue-500',
    },
    {
      label: 'Agents',
      value: wallets.filter((w) => w.user?.role === 'agent').length,
      color: 'border-l-purple-500',
    },
    {
      label: 'Total Tokens',
      value: wallets.reduce((a, w) => a + Number(w.balance || 0), 0).toLocaleString(),
      color: 'border-l-green-500',
    },
    {
      label: 'Sellers',
      value: wallets.filter((w) => w.user?.role === 'seller').length,
      color: 'border-l-orange-500',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage users and their wallet balances</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-2xl p-4 border-l-4 ${s.color} shadow-sm`}
          >
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-1 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading users...
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['User', 'Role', 'City', 'Wallet Balance', 'Earned / Spent', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredWallets.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {entry.user?.avatar ? (
                            <img
                              src={resolveImageSrc(entry.user.avatar)}
                              alt={entry.user.name}
                              className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                            {entry.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1">
                              {entry.user?.name}
                              {entry.user?.agentTick &&
                                entry.user.agentTick !== 'none' &&
                                TICK_ICONS[entry.user.agentTick] && (
                                  <span>{TICK_ICONS[entry.user.agentTick]}</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400">{entry.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold capitalize ${
                            ROLE_COLORS[entry.user?.role] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {entry.user?.role}
                        </span>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {entry.user?.city || '—'}
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">
                          🪙 {Number(entry.balance).toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">tokens</span>
                      </td>

                      {/* Earned / Spent */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <span className="text-green-600">
                          +{Number(entry.totalEarned).toFixed(0)}
                        </span>
                        {' / '}
                        <span className="text-red-500">-{Number(entry.totalSpent).toFixed(0)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setTopUpModal(entry);
                            setTopUpAmount('');
                            setTopUpDesc('');
                            setTopUpError('');
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          + Tokens
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 15 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page * 15 >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top-up Modal */}
      {topUpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add Tokens</h3>
            <p className="text-sm text-gray-500 mb-4">
              Adding tokens to{' '}
              <span className="font-semibold text-gray-700">{topUpModal.user.name}</span>
            </p>

            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-primary-700">
                🪙 {Number(topUpModal.balance).toFixed(0)} tokens
              </p>
            </div>

            {topUpError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl p-2 mb-3">{topUpError}</p>
            )}

            <input
              type="number"
              placeholder="Tokens to add (e.g., 100)"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={topUpDesc}
              onChange={(e) => setTopUpDesc(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setTopUpModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={topUpLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {topUpLoading ? 'Adding...' : 'Add Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
