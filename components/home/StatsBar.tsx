'use client';

import { useEffect } from 'react';
import { Building2, Home, Key, Briefcase } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchPlatformStats } from '@/lib/store/slices/statsSlice';

function fmt(n: number): string {
  return n > 0 ? `${n.toLocaleString('en-IN')}+` : '—';
}

export default function StatsBar() {
  const dispatch = useAppDispatch();
  const { data: stats, loading } = useAppSelector((s) => s.stats);

  useEffect(() => {
    dispatch(fetchPlatformStats() as any);
  }, [dispatch]);

  const items = [
    {
      icon: Building2,
      value: stats ? fmt(stats.total)       : loading ? '…' : '—',
      label: 'Total Properties',
      color: 'text-blue-600',
    },
    {
      icon: Home,
      value: stats ? fmt(stats.forSale)     : loading ? '…' : '—',
      label: 'Properties for Sale',
      color: 'text-green-600',
    },
    {
      icon: Key,
      value: stats ? fmt(stats.forRent)     : loading ? '…' : '—',
      label: 'Properties for Rent',
      color: 'text-purple-600',
    },
    {
      icon: Briefcase,
      value: stats ? fmt(stats.totalCities) : loading ? '…' : '—',
      label: 'Cities Covered',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container-max">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {items.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-3 sm:p-5 justify-center">
              <div className={`${color} flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
