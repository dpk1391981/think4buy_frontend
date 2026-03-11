'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { savedApi, alertsApi } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';

interface SavedProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  city: string;
  category: string;
  images?: { url: string; isPrimary: boolean }[];
}

interface Alert {
  id: string;
  alertName: string;
  city?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [savedRes, alertsRes] = await Promise.allSettled([
          savedApi.getSaved({ page: 1, limit: 4 }),
          alertsApi.getAll(),
        ]);
        if (savedRes.status === 'fulfilled') {
          const data = savedRes.value.data;
          setSavedProperties(data?.items || []);
          setSavedTotal(data?.total || 0);
        }
        if (alertsRes.status === 'fulfilled') {
          const data = alertsRes.value.data;
          setAlerts(Array.isArray(data) ? data.slice(0, 3) : []);
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
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.isActive).length;

  return (
    <div className="p-4 md:p-8">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Your property search dashboard</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/saved" className="bg-white rounded-xl p-5 border-l-4 border-red-400 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{savedTotal}</div>
              <div className="text-sm text-gray-500 mt-1">Saved Properties</div>
            </div>
            <span className="text-3xl group-hover:scale-110 transition-transform">❤️</span>
          </div>
        </Link>

        <Link href="/dashboard/alerts" className="bg-white rounded-xl p-5 border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{activeAlerts}</div>
              <div className="text-sm text-gray-500 mt-1">Active Alerts</div>
            </div>
            <span className="text-3xl group-hover:scale-110 transition-transform">🔔</span>
          </div>
        </Link>

        <Link href="/properties" className="bg-white rounded-xl p-5 border-l-4 border-green-400 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700 mt-1">Browse Listings</div>
              <div className="text-xs text-gray-500 mt-0.5">Find your dream home</div>
            </div>
            <span className="text-3xl group-hover:scale-110 transition-transform">🔍</span>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/properties?category=buy" className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
            🏠 Buy Property
          </Link>
          <Link href="/properties?category=rent" className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
            🔑 Rent Property
          </Link>
          <Link href="/dashboard/alerts" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
            🔔 Set Alert
          </Link>
          <Link href="/agents" className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors">
            🤝 Find Agent
          </Link>
          <Link href="/services" className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-200 transition-colors">
            🛠️ Services
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved properties preview */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Saved Properties</h2>
            <Link href="/dashboard/saved" className="text-xs text-blue-600 hover:underline">View all ({savedTotal})</Link>
          </div>
          {savedProperties.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">❤️</div>
              <div className="text-gray-500 text-sm font-medium">No saved properties</div>
              <p className="text-gray-400 text-xs mt-1">Save properties you like to view them later</p>
              <Link href="/properties" className="mt-3 inline-block text-xs text-blue-600 hover:underline">
                Browse properties →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {savedProperties.map((prop) => {
                const thumb = prop.images?.find((i) => i.isPrimary)?.url || prop.images?.[0]?.url;
                return (
                  <Link
                    key={prop.id}
                    href={`/properties/${prop.slug}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={prop.title} className="w-12 h-12 object-cover" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-lg">🏠</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{prop.title}</div>
                      <div className="text-xs text-gray-500">{prop.city} · {formatPrice(prop.price)}</div>
                    </div>
                    <span className="text-gray-300 text-sm">›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerts preview */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Property Alerts</h2>
            <Link href="/dashboard/alerts" className="text-xs text-blue-600 hover:underline">Manage alerts</Link>
          </div>
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🔔</div>
              <div className="text-gray-500 text-sm font-medium">No alerts set</div>
              <p className="text-gray-400 text-xs mt-1">Get notified when matching properties are listed</p>
              <Link href="/dashboard/alerts" className="mt-3 inline-block text-xs text-blue-600 hover:underline">
                Create your first alert →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{alert.alertName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[alert.category, alert.city].filter(Boolean).join(' · ') || 'All India'}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {alert.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              ))}
              {alerts.length < activeAlerts && (
                <div className="px-5 py-3 text-xs text-gray-400">
                  +{activeAlerts - alerts.length} more alerts
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
