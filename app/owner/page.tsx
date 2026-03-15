'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Home, Target, TrendingUp, Plus, ArrowRight, Zap } from 'lucide-react';

interface Stats {
  totalProperties: number;
  activeListings: number;
  totalLeads: number;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState<Stats>({ totalProperties: 0, activeListings: 0, totalLeads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [propsRes, leadsRes] = await Promise.allSettled([
          api.get('/properties/my-listings'),
          api.get('/leads/my'),
        ]);

        const props = propsRes.status === 'fulfilled'
          ? (propsRes.value.data?.data ?? propsRes.value.data ?? [])
          : [];
        const leads = leadsRes.status === 'fulfilled'
          ? (leadsRes.value.data?.data ?? leadsRes.value.data ?? [])
          : [];

        setStats({
          totalProperties: Array.isArray(props) ? props.length : props.total ?? 0,
          activeListings:  Array.isArray(props) ? props.filter((p: any) => p.status === 'active' || p.isApproved).length : 0,
          totalLeads:      Array.isArray(leads) ? leads.length : leads.total ?? 0,
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
      <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20">
        <p className="text-emerald-100 text-sm font-medium mb-1">{greeting}</p>
        <h1 className="text-xl font-black leading-tight">{user?.name || 'Welcome back!'}</h1>
        <p className="text-emerald-100 text-sm mt-1">Manage your properties and leads</p>
        <Link
          href="/post-property"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Post New Property
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/owner/properties" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{loading ? '–' : stats.totalProperties}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Properties</div>
        </Link>

        <Link href="/owner/properties" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{loading ? '–' : stats.activeListings}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Active</div>
        </Link>

        <Link href="/owner/leads" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{loading ? '–' : stats.totalLeads}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Leads</div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/post-property"
            className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Post Property</span>
          </Link>

          <Link
            href="/owner/properties"
            className="flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">My Properties</span>
          </Link>

          <Link
            href="/owner/leads"
            className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">View Leads</span>
          </Link>

          <Link
            href="/owner/boost"
            className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-800">Boost Listing</span>
          </Link>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Owner Tips</h2>
        <ul className="space-y-2.5">
          {[
            { icon: Plus,       text: 'Add high-quality photos to get 5x more inquiries' },
            { icon: TrendingUp, text: 'Set the right price using market analytics' },
            { icon: Target,     text: 'Respond to leads within 1 hour for best results' },
            { icon: Zap,        text: 'Boost your listing to reach more buyers instantly' },
          ].map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
