'use client';

import { useEffect } from 'react';
import { Home, Users, MapPin, BarChart3 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchPlatformStats } from '@/lib/store/slices/statsSlice';

function fmtStat(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(0)}L+`;
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K+`;
  return n > 0 ? `${n.toLocaleString('en-IN')}+` : '—';
}

export default function PlatformStatsCards() {
  const dispatch = useAppDispatch();
  const { data: stats, loading } = useAppSelector((s) => s.stats);

  useEffect(() => {
    dispatch(fetchPlatformStats() as any);
  }, [dispatch]);

  const cards = [
    {
      icon: Home,
      value: stats ? fmtStat(stats.total)       : loading ? '…' : '—',
      label: 'Active Listings',
    },
    {
      icon: Users,
      value: stats ? fmtStat(stats.totalAgents)  : loading ? '…' : '—',
      label: 'Verified Agents',
    },
    {
      icon: MapPin,
      value: stats ? fmtStat(stats.totalCities)  : loading ? '…' : '—',
      label: 'Cities Covered',
    },
    {
      icon: BarChart3,
      value: '98%',
      label: 'Satisfaction Rate',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
      {cards.map(({ icon: Icon, value, label }) => (
        <div key={label} className="bg-white rounded-2xl p-3 sm:p-5 text-center border border-gray-100 shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}
