'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { agentApi, walletApi, boostPropertyApi } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';

interface BoostPlan {
  id: string;
  name: string;
  durationDays: number;
  tokenCost: number;
  isActive: boolean;
}

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  category: string;
  price: number;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isBoosted: boolean;
  boostExpiry?: string;
  createdAt: string;
  slug: string;
}

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Inactive', value: 'inactive' },
];

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AgentListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Boost modal
  const [boostModal, setBoostModal] = useState<{ listing: Listing } | null>(null);
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostError, setBoostError] = useState('');
  const [boostSuccess, setBoostSuccess] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const r = await agentApi.getMyListings(params);
      const data = r.data;
      const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setListings(arr);
      setTotal(data?.total ?? arr.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function openBoostModal(listing: Listing) {
    setBoostModal({ listing });
    setSelectedPlan('');
    setBoostError('');
    setBoostSuccess('');
    try {
      const [plansRes, walletRes] = await Promise.all([
        walletApi.getBoostPlans(),
        walletApi.getWallet(),
      ]);
      setBoostPlans(plansRes.data?.items || plansRes.data || []);
      setWalletBalance(walletRes.data?.balance ?? 0);
    } catch (e) {
      setBoostError('Failed to load boost plans.');
    }
  }

  async function confirmBoost() {
    if (!boostModal || !selectedPlan) { setBoostError('Please select a boost plan.'); return; }
    setBoostLoading(true);
    setBoostError('');
    try {
      await boostPropertyApi(boostModal.listing.id, selectedPlan);
      setBoostSuccess('Property boosted successfully!');
      setTimeout(() => {
        setBoostModal(null);
        load();
      }, 1200);
    } catch (e: any) {
      setBoostError(e?.response?.data?.message || 'Failed to boost property. Check your balance.');
    } finally {
      setBoostLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total properties</p>
        </div>
        <Link
          href="/post-property"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Post Property
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatusFilter(t.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
        ) : listings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏠</div>
            <div className="text-gray-500 font-medium">No listings found</div>
            <Link href="/post-property" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Post your first property
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Property', 'Type / Category', 'Price', 'Status', 'Approval', 'Boosted', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{listing.title}</div>
                    <div className="text-gray-400 text-xs">{timeAgo(listing.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700 capitalize">{listing.propertyType?.replace(/_/g, ' ')}</div>
                    <div className="text-gray-400 text-xs capitalize">{listing.category}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{formatPrice(listing.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${listing.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${APPROVAL_BADGE[listing.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {listing.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {listing.isBoosted ? (
                      <div>
                        <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Boosted</span>
                        {listing.boostExpiry && (
                          <div className="text-xs text-gray-400 mt-0.5">Until {new Date(listing.boostExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <Link
                        href={`/properties/${listing.slug}`}
                        target="_blank"
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/post-property?edit=${listing.id}`}
                        className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </Link>
                      {!listing.isBoosted && listing.approvalStatus === 'approved' && (
                        <button
                          onClick={() => openBoostModal(listing)}
                          className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors"
                        >
                          Boost
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

      {/* Boost Modal */}
      {boostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Boost Property</h3>
            <p className="text-sm text-gray-500 mb-1 truncate">{boostModal.listing.title}</p>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-sm text-gray-600">Your balance:</span>
              <span className="text-sm font-semibold text-gray-900">{walletBalance}</span>
              <span>🪙</span>
            </div>

            {boostError && <p className="text-sm text-red-600 mb-3">{boostError}</p>}
            {boostSuccess && <p className="text-sm text-green-600 mb-3">{boostSuccess}</p>}

            {boostPlans.length === 0 && !boostError ? (
              <div className="text-center text-gray-400 py-4">Loading plans...</div>
            ) : (
              <div className="space-y-2 mb-5">
                {boostPlans.filter((p) => p.isActive).map((plan) => {
                  const canAfford = walletBalance >= plan.tokenCost;
                  return (
                    <label
                      key={plan.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : canAfford
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="radio"
                        name="boostPlan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={() => canAfford && setSelectedPlan(plan.id)}
                        disabled={!canAfford}
                        className="accent-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                        <div className="text-xs text-gray-500">{plan.durationDays} days visibility boost</div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                        <span>🪙</span>
                        <span>{plan.tokenCost}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmBoost}
                disabled={boostLoading || !selectedPlan || !!boostSuccess}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {boostLoading ? 'Processing...' : 'Confirm Boost'}
              </button>
              <button
                onClick={() => setBoostModal(null)}
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
