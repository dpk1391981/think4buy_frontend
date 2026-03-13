'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { agentApi, walletApi, subscriptionApi, agencyApi } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalInquiries: number;
  walletBalance: number;
  agentFreeQuota?: number;
  agentUsedQuota?: number;
}

interface Inquiry {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type: string;
  createdAt: string;
  property?: { title: string; slug: string };
}

interface Listing {
  id: string;
  title: string;
  approvalStatus: string;
  isActive: boolean;
  isBoosted: boolean;
  price: number;
  category: string;
  createdAt: string;
  slug: string;
}

interface ActiveSubscription {
  plan: { name: string; type: string; maxListings: number };
  expiresAt: string;
  status: string;
}

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const TICK_CONFIG: Record<string, { color: string; label: string }> = {
  blue: { color: 'text-blue-500', label: 'Verified' },
  gold: { color: 'text-yellow-500', label: 'Gold' },
  diamond: { color: 'text-purple-500', label: 'Diamond' },
};

function StatCard({
  value, label, color, sub,
}: { value: string | number; label: string; color: string; sub?: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 border-l-4 ${color} shadow-sm`}>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [agency, setAgency] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, inquiriesRes, listingsRes, walletRes, subRes, agencyRes] = await Promise.allSettled([
          agentApi.getDashboardStats(),
          agentApi.getMyInquiries({ page: 1, limit: 5 }),
          agentApi.getMyListings({ page: 1, limit: 5 }),
          walletApi.getWallet(),
          subscriptionApi.getCurrent(),
          agencyApi.getMyAgency(),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (inquiriesRes.status === 'fulfilled') {
          const d = inquiriesRes.value.data;
          const arr = d?.items ?? d;
          setRecentInquiries(Array.isArray(arr) ? arr : []);
        }
        if (listingsRes.status === 'fulfilled') {
          const d = listingsRes.value.data;
          const arr = d?.items ?? d;
          setRecentListings(Array.isArray(arr) ? arr : []);
        }
        if (walletRes.status === 'fulfilled' && walletRes.value.data) {
          const bal = walletRes.value.data.balance;
          if (bal !== undefined) {
            setStats((prev) => prev ? { ...prev, walletBalance: bal } : prev);
          }
        }
        if (subRes.status === 'fulfilled' && subRes.value.data?.current) {
          setSubscription(subRes.value.data.current);
        }
        if (agencyRes.status === 'fulfilled' && agencyRes.value.data) {
          // backend may return the agency directly or wrapped in { agency }
          const agencyData = agencyRes.value.data;
          setAgency(agencyData.agency ?? (agencyData.id ? agencyData : null));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const quota = stats?.agentFreeQuota ?? 100;
  const used = stats?.agentUsedQuota ?? 0;
  const quotaPercent = Math.min(Math.round((used / quota) * 100), 100);
  const quotaColor = quotaPercent >= 90 ? 'bg-red-500' : quotaPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Welcome back! Here's your activity overview.</p>
      </div>

      {/* Subscription Status Banner */}
      {subscription ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="font-semibold text-sm">{subscription.plan.name} Active</div>
              <div className="text-xs text-blue-200">
                Expires {new Date(subscription.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{subscription.plan.maxListings} listings allowed
              </div>
            </div>
          </div>
          <Link href="/agent/subscription" className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors">
            Manage
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <div className="font-semibold text-gray-800 text-sm">Upgrade to a Plan</div>
              <div className="text-xs text-gray-500">Get more listings, tokens, and featured placement</div>
            </div>
          </div>
          <Link href="/agent/subscription" className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            View Plans
          </Link>
        </div>
      )}

      {/* Agency Banner */}
      {agency && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4">
          {agency.logo ? (
            <img src={agency.logo} alt={agency.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {agency.name?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm truncate">{agency.name}</span>
              {agency.isVerified && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">✓ Verified</span>}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{agency.totalAgents ?? 0} agents · {agency.totalListings ?? 0} listings</div>
          </div>
          <Link
            href="/agent/agency"
            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors flex-shrink-0"
          >
            View Agency
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard value={stats?.totalListings ?? 0} label="Total Listings" color="border-blue-500" />
        <StatCard value={stats?.activeListings ?? 0} label="Active Listings" color="border-green-500" />
        <StatCard value={stats?.totalInquiries ?? 0} label="Total Leads" color="border-orange-500" />
        <div className="bg-white rounded-xl p-5 border-l-4 border-yellow-500 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold text-gray-800">{stats?.walletBalance?.toLocaleString() ?? 0}</span>
            <span className="text-xl">🪙</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Token Balance</div>
        </div>
      </div>

      {/* Listing Quota Bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-gray-800 text-sm">Listing Quota</div>
            <div className="text-xs text-gray-500 mt-0.5">{used} of {quota} listings used</div>
          </div>
          <div className="text-right">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              quotaPercent >= 90 ? 'bg-red-100 text-red-700' : quotaPercent >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}>
              {quota - used} remaining
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${quotaColor}`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
        {quotaPercent >= 80 && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-amber-600">
              {quotaPercent >= 100 ? '⚠️ Quota reached! Upgrade to post more.' : '⚠️ Approaching your limit.'}
            </p>
            <Link href="/agent/subscription" className="text-xs text-blue-600 hover:underline font-medium">
              Upgrade Plan →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/post-property" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Post Property
          </Link>
          <Link href="/agent/listings" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
            🚀 Boost a Listing
          </Link>
          <Link href="/agent/wallet" className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
            💰 Wallet
          </Link>
          <Link href="/agent/inquiries" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            💬 Inquiries
          </Link>
          <Link href="/agent/analytics" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
            📈 Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Leads</h2>
            <Link href="/agent/inquiries" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No inquiries yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">{inq.name}</div>
                      <div className="text-xs text-gray-500 truncate">{inq.property?.title || 'Unknown property'}</div>
                      {inq.phone && <div className="text-xs text-gray-400">{inq.phone}</div>}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(inq.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Listings</h2>
            <Link href="/agent/listings" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentListings.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No listings yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentListings.map((listing) => (
                <div key={listing.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{listing.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatPrice(listing.price)} · {listing.category}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {listing.isBoosted && (
                      <span className="inline-flex px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Boosted</span>
                    )}
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${APPROVAL_BADGE[listing.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {listing.approvalStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
