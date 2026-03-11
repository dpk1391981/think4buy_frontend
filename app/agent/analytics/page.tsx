'use client';

import { useEffect, useState } from 'react';
import { agentApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Listing {
  id: string;
  title: string;
  slug: string;
  city: string;
  category: string;
  price: number;
  viewCount: number;
  isBoosted: boolean;
  approvalStatus: string;
  createdAt: string;
  images?: { url: string; isPrimary: boolean }[];
}

interface Stats {
  totalListings: number;
  activeListings: number;
  totalInquiries: number;
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs text-gray-500 font-medium">{d.value}</div>
          <div
            className="w-full bg-blue-500 rounded-t-md transition-all duration-500 min-h-[4px]"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          />
          <div className="text-xs text-gray-400 truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AgentAnalyticsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'views' | 'price' | 'date'>('views');

  useEffect(() => {
    async function load() {
      try {
        const [listingsRes, statsRes] = await Promise.allSettled([
          agentApi.getMyListings({ page: 1, limit: 50 }),
          agentApi.getDashboardStats(),
        ]);
        if (listingsRes.status === 'fulfilled') {
          const data = listingsRes.value.data;
          const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          setListings(arr);
        }
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const approved = listings.filter((l) => l.approvalStatus === 'approved');
  const totalViews = listings.reduce((s, l) => s + (l.viewCount || 0), 0);
  const boostedCount = listings.filter((l) => l.isBoosted).length;

  // Top listings by view
  const topByViews = [...listings]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10);

  // Chart: top 6 by views
  const chartData = topByViews.slice(0, 6).map((l) => ({
    label: l.title.slice(0, 12) + (l.title.length > 12 ? '…' : ''),
    value: l.viewCount || 0,
  }));

  // Sort table
  const sorted = [...listings].sort((a, b) => {
    if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'price') return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Performance overview of your listings</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{stats?.totalListings ?? listings.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Listings</div>
        </div>
        <div className="bg-white rounded-xl p-5 border-l-4 border-green-500 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Total Views</div>
        </div>
        <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{stats?.totalInquiries ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Leads</div>
        </div>
        <div className="bg-white rounded-xl p-5 border-l-4 border-purple-500 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{boostedCount}</div>
          <div className="text-sm text-gray-500 mt-1">Boosted Listings</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Top Listings by Views</h2>
          <BarChart data={chartData} />
        </div>
      )}

      {/* Performance insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Avg. Views / Listing</div>
          <div className="text-3xl font-bold text-gray-800">
            {listings.length > 0 ? Math.round(totalViews / listings.length) : 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">per listing</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Best Performing</div>
          {topByViews[0] ? (
            <div>
              <div className="font-semibold text-gray-800 text-sm truncate">{topByViews[0].title}</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{topByViews[0].viewCount || 0} views</div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No data yet</div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Conversion Rate</div>
          <div className="text-3xl font-bold text-gray-800">
            {totalViews > 0 && (stats?.totalInquiries ?? 0) > 0
              ? `${((stats!.totalInquiries / totalViews) * 100).toFixed(1)}%`
              : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">leads / total views</div>
        </div>
      </div>

      {/* Listings performance table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-gray-800 text-sm">All Listings Performance</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {([
              { label: 'Views', value: 'views' as const },
              { label: 'Price', value: 'price' as const },
              { label: 'Date', value: 'date' as const },
            ]).map((s) => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortBy === s.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <div className="text-4xl mb-3">📊</div>
            <div>No listings yet. Post properties to see analytics.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Property', 'City', 'Price', 'Views', 'Status', 'Boosted'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((listing, idx) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <a
                            href={`/properties/${listing.slug}`}
                            target="_blank"
                            className="font-medium text-gray-900 hover:text-blue-600 truncate block max-w-[200px]"
                          >
                            {listing.title}
                          </a>
                          <div className="text-xs text-gray-400 capitalize">{listing.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{listing.city || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{formatPrice(listing.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{
                              width: `${topByViews[0] ? Math.round(((listing.viewCount || 0) / (topByViews[0]?.viewCount || 1)) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <span className="font-semibold text-gray-800 w-8 text-right">{listing.viewCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        listing.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                        listing.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {listing.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {listing.isBoosted ? (
                        <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">🚀 Boosted</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
