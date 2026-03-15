'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Heart, MessageSquare, Bell, Search, MapPin, TrendingDown, ArrowRight } from 'lucide-react';

interface Stats {
  savedCount: number;
  enquiriesCount: number;
  alertsCount: number;
}

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ savedCount: 0, enquiriesCount: 0, alertsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [savedRes, inqRes, alertsRes] = await Promise.allSettled([
          api.get('/saved'),
          api.get('/inquiries/my-inquiries'),
          api.get('/alerts'),
        ]);
        setStats({
          savedCount:    savedRes.status === 'fulfilled'  ? (savedRes.value.data?.total ?? savedRes.value.data?.length ?? 0) : 0,
          enquiriesCount: inqRes.status === 'fulfilled'   ? (inqRes.value.data?.total  ?? inqRes.value.data?.length ?? 0)  : 0,
          alertsCount:   alertsRes.status === 'fulfilled' ? (alertsRes.value.data?.total ?? alertsRes.value.data?.length ?? 0) : 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Welcome banner */}
      <div className="mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-cyan-600/20">
        <p className="text-cyan-100 text-sm font-medium mb-1">{greeting}</p>
        <h1 className="text-xl font-black leading-tight">{user?.name || 'Welcome back!'}</h1>
        <p className="text-cyan-100 text-sm mt-1">Find your dream property today</p>
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl transition-all"
        >
          <Search className="w-4 h-4" />
          Search Properties
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/buyer/saved" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-pink-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{loading ? '–' : stats.savedCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Saved</div>
        </Link>

        <Link href="/buyer/enquiries" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{loading ? '–' : stats.enquiriesCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Enquiries</div>
        </Link>

        <Link href="/buyer/alerts" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{loading ? '–' : stats.alertsCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Alerts</div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/properties"
            className="flex items-center gap-3 p-3 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Search Properties</span>
          </Link>

          <Link
            href="/buyer/saved"
            className="flex items-center gap-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Saved Properties</span>
          </Link>

          <Link
            href="/buyer/enquiries"
            className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">My Enquiries</span>
          </Link>

          <Link
            href="/buyer/alerts"
            className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Property Alerts</span>
          </Link>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Buyer Tips</h2>
        <ul className="space-y-2.5">
          {[
            { icon: Search,      text: 'Use filters to narrow down by location, budget & BHK' },
            { icon: Heart,       text: 'Save properties to compare them side by side' },
            { icon: Bell,        text: 'Set price alerts to get notified on drops' },
            { icon: MapPin,      text: 'Schedule site visits before making a decision' },
            { icon: TrendingDown, text: 'Check price trends to find the best time to buy' },
          ].map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
