'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Home, Key, Briefcase } from 'lucide-react';
import { propertiesApi } from '@/lib/api';

export default function StatsBar() {
  const { data: stats } = useQuery({
    queryKey: ['property-stats'],
    queryFn: () => propertiesApi.getStats().then((r) => r.data),
  });

  const items = [
    {
      icon: Building2,
      value: stats?.total ? `${stats.total.toLocaleString('en-IN')}+` : '50,000+',
      label: 'Total Properties',
      color: 'text-blue-600',
    },
    {
      icon: Home,
      value: stats?.forSale ? `${stats.forSale.toLocaleString('en-IN')}+` : '28,000+',
      label: 'Properties for Sale',
      color: 'text-green-600',
    },
    {
      icon: Key,
      value: stats?.forRent ? `${stats.forRent.toLocaleString('en-IN')}+` : '18,000+',
      label: 'Properties for Rent',
      color: 'text-purple-600',
    },
    {
      icon: Briefcase,
      value: '50+',
      label: 'Cities Covered',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container-max">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {items.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex flex-col sm:flex-row items-center gap-3 p-5 justify-center">
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
