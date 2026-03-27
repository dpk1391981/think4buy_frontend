'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Home,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Wallet,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalAgents: number;
  totalProperties: number;
  pendingProperties: number;
  approvedProperties: number;
  rejectedProperties: number;
  totalInquiries: number;
  featuredProperties: number;
  totalWalletBalance?: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  iconBg: string;
  icon: React.ReactNode;
  href?: string;
  trend?: string;
}

const StatCard = ({ label, value, color, bgColor, iconBg, icon, href, trend }: StatCardProps) => {
  const inner = (
    <div
      className={`bg-white rounded-2xl p-5 border-l-4 ${color} shadow-sm hover:shadow-md transition-all group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-primary-600 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
};

const STAT_CARDS = (stats: Stats): StatCardProps[] => [
  {
    label: 'Total Users',
    value: stats.totalUsers ?? 0,
    color: 'border-blue-500',
    bgColor: '',
    iconBg: 'bg-blue-50',
    icon: <Users className="w-5 h-5 text-blue-600" />,
    href: '/admin/users',
  },
  {
    label: 'Total Agents',
    value: stats.totalAgents ?? 0,
    color: 'border-purple-500',
    bgColor: '',
    iconBg: 'bg-purple-50',
    icon: <Users className="w-5 h-5 text-purple-600" />,
    href: '/admin/agents',
  },
  {
    label: 'Total Properties',
    value: stats.totalProperties ?? 0,
    color: 'border-green-500',
    bgColor: '',
    iconBg: 'bg-green-50',
    icon: <Home className="w-5 h-5 text-green-600" />,
    href: '/admin/properties',
  },
  {
    label: 'Total Inquiries',
    value: stats.totalInquiries ?? 0,
    color: 'border-orange-500',
    bgColor: '',
    iconBg: 'bg-orange-50',
    icon: <ClipboardList className="w-5 h-5 text-orange-600" />,
  },
  {
    label: 'Pending Approval',
    value: stats.pendingProperties ?? 0,
    color: 'border-yellow-500',
    bgColor: '',
    iconBg: 'bg-yellow-50',
    icon: <Clock className="w-5 h-5 text-yellow-600" />,
    href: '/admin/properties?status=pending',
  },
  {
    label: 'Approved',
    value: stats.approvedProperties ?? 0,
    color: 'border-emerald-400',
    bgColor: '',
    iconBg: 'bg-emerald-50',
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    href: '/admin/properties?status=approved',
  },
  {
    label: 'Rejected',
    value: stats.rejectedProperties ?? 0,
    color: 'border-red-400',
    bgColor: '',
    iconBg: 'bg-red-50',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    href: '/admin/properties?status=rejected',
  },
  {
    label: 'Featured',
    value: stats.featuredProperties ?? 0,
    color: 'border-indigo-500',
    bgColor: '',
    iconBg: 'bg-indigo-50',
    icon: <Star className="w-5 h-5 text-indigo-600" />,
  },
];

const SkeletonCard = () => (
  <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
);

type CacheStatus = 'idle' | 'loading' | 'success' | 'error';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('idle');
  const [cacheMsg, setCacheMsg] = useState('');

  useEffect(() => {
    adminApi
      .getDashboard()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleGlobalCacheRefresh() {
    setCacheStatus('loading');
    setCacheMsg('');
    try {
      const res = await adminApi.globalCacheRefresh();
      setCacheMsg(res.data?.message ?? 'All caches refreshed');
      setCacheStatus('success');
    } catch {
      setCacheMsg('Cache refresh failed. Try again.');
      setCacheStatus('error');
    } finally {
      setTimeout(() => setCacheStatus('idle'), 6000);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Overview of Think4BuySale platform</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats && STAT_CARDS(stats).map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Wallet Summary */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-primary-600/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-primary-200" />
              <span className="text-primary-200 text-sm font-medium">Wallet Overview</span>
            </div>
            <div className="text-3xl font-bold">
              🪙 Tokens System Active
            </div>
            <p className="text-primary-200 text-sm mt-1">
              Manage user wallets and token balances from the Wallets section.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/wallets"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors backdrop-blur-sm"
            >
              View Wallets
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-white text-primary-700 text-sm font-medium rounded-xl transition-colors hover:bg-primary-50"
            >
              Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* Global Cache Refresh */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary-600" />
              Global Cache Refresh
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Rebuilds all server caches: property rankings, hot scores, agents, projects, locations, categories &amp; market snapshots.
            </p>
            {cacheMsg && (
              <p className={`text-xs mt-2 font-medium ${cacheStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {cacheMsg}
              </p>
            )}
          </div>
          <button
            onClick={handleGlobalCacheRefresh}
            disabled={cacheStatus === 'loading'}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${cacheStatus === 'loading' ? 'animate-spin' : ''}`} />
            {cacheStatus === 'loading' ? 'Refreshing...' : 'Refresh All Caches'}
          </button>
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-600 rounded-full" />
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/properties?status=pending"
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl text-sm font-medium hover:bg-yellow-200 transition-colors"
            >
              Review Pending ({stats?.pendingProperties ?? 0})
            </Link>
            <Link
              href="/admin/agents/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Create Agent
            </Link>
            <Link
              href="/admin/agents"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Manage Agents
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              User Wallets
            </Link>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-green-500 rounded-full" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[
              { icon: '🏠', text: `${stats?.pendingProperties ?? 0} properties awaiting approval`, time: 'Now', color: 'bg-yellow-50' },
              { icon: '👤', text: `${stats?.totalAgents ?? 0} active agents on platform`, time: 'Today', color: 'bg-blue-50' },
              { icon: '📋', text: `${stats?.totalInquiries ?? 0} total inquiries received`, time: 'All time', color: 'bg-green-50' },
              { icon: '⭐', text: `${stats?.featuredProperties ?? 0} featured properties live`, time: 'Active', color: 'bg-indigo-50' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 ${item.color} rounded-xl`}>
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">{item.text}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
