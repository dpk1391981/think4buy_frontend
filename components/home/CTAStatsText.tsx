'use client';

import { useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchPlatformStats } from '@/lib/store/slices/statsSlice';

function fmtStat(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(0)}L+`;
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K+`;
  return n > 0 ? `${n.toLocaleString('en-IN')}+` : '';
}

export default function CTAStatsText() {
  const dispatch = useAppDispatch();
  const { data: stats } = useAppSelector((s) => s.stats);

  useEffect(() => {
    dispatch(fetchPlatformStats() as any);
  }, [dispatch]);

  const count = stats ? fmtStat(stats.total) : '50,000+';

  return (
    <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
      Join {count} property seekers
    </div>
  );
}
