'use client';

import { useEffect, useState, useCallback } from 'react';
import { walletApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

interface WalletInfo {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'bonus';
  reason: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  durationDays: number;
  tokensIncluded: number;
  maxListings: number;
  isActive: boolean;
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

export default function AgentWalletPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    async function loadWallet() {
      try {
        const [walletRes, plansRes] = await Promise.allSettled([
          walletApi.getWallet(),
          walletApi.getSubscriptionPlans(),
        ]);
        if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
        if (plansRes.status === 'fulfilled') {
          const d = plansRes.value.data;
          setSubscriptionPlans(Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadWallet();
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const r = await walletApi.getTransactions({ page: txPage, limit: 15 });
      const data = r.data;
      const arr = Array.isArray(data?.transactions) ? data.transactions
        : Array.isArray(data?.items) ? data.items
        : Array.isArray(data) ? data : [];
      setTransactions(arr);
      setTxTotal(data?.total ?? arr.length);
    } catch (e) { console.error(e); }
    finally { setTxLoading(false); }
  }, [txPage]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-40 bg-gray-200 rounded-xl animate-pulse mb-6" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your token balance and transactions</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-100 mb-1">Available Balance</div>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{wallet?.balance?.toLocaleString() ?? 0}</span>
              <span className="text-3xl">🪙</span>
            </div>
            <div className="text-sm text-blue-200 mt-1">tokens</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Total Earned</div>
            <div className="text-lg font-semibold text-green-300">+{wallet?.totalEarned?.toLocaleString() ?? 0} 🪙</div>
            <div className="text-sm text-blue-200 mt-2">Total Spent</div>
            <div className="text-lg font-semibold text-red-300">-{wallet?.totalSpent?.toLocaleString() ?? 0} 🪙</div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Transaction History</h2>
        </div>

        {txLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🪙</div>
            <div className="text-gray-500 font-medium">No transactions yet</div>
            <p className="text-gray-400 text-sm mt-1">Your transaction history will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Type', 'Reason', 'Amount', 'Balance After', 'Description'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{timeAgo(tx.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[tx.type] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{tx.reason?.replace(/_/g, ' ') || '—'}</td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${TYPE_AMOUNT[tx.type] || 'text-gray-700'}`}>
                    {tx.type === 'debit' ? '-' : '+'}{tx.amount} 🪙
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tx.balanceAfter?.toLocaleString() ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {txTotal > 15 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(txPage - 1) * 15 + 1}–{Math.min(txPage * 15, txTotal)} of {txTotal}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setTxPage((p) => Math.max(1, p - 1))} disabled={txPage === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setTxPage((p) => p + 1)} disabled={txPage * 15 >= txTotal} className="px-3 py-1 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Buy More Tokens Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Buy More Tokens</h2>
            <p className="text-sm text-gray-500 mt-0.5">Upgrade your plan to get more tokens and listings</p>
          </div>
          <span className="inline-flex px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Coming Soon</span>
        </div>

        {subscriptionPlans.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Basic Plan', price: '₹999', tokens: '50 tokens', listings: '10 listings', color: 'border-blue-200' },
              { name: 'Premium Plan', price: '₹2,499', tokens: '150 tokens', listings: '30 listings', color: 'border-purple-200' },
              { name: 'Featured Plan', price: '₹4,999', tokens: '400 tokens', listings: 'Unlimited', color: 'border-yellow-200' },
            ].map((plan) => (
              <div key={plan.name} className={`border-2 ${plan.color} rounded-xl p-4 opacity-70`}>
                <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                <div className="text-2xl font-bold text-gray-800 mb-3">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>🪙 {plan.tokens}</div>
                  <div>🏠 {plan.listings}</div>
                </div>
                <button disabled className="mt-4 w-full py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subscriptionPlans.filter((p) => p.isActive).map((plan) => (
              <div key={plan.id} className="border-2 border-gray-200 rounded-xl p-4 opacity-70">
                <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                <div className="text-2xl font-bold text-gray-800 mb-3">
                  ₹{plan.price?.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">/{plan.durationDays}d</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>🪙 {plan.tokensIncluded} tokens</div>
                  <div>🏠 {plan.maxListings} listings</div>
                </div>
                <button disabled className="mt-4 w-full py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
