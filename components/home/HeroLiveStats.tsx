'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchPlatformStats } from '@/lib/store/slices/statsSlice';

/** 52418 → "52,418"  ·  falls back to a rounded promise while loading. */
function fmtCount(n: number): string {
  return n.toLocaleString('en-IN');
}

function fmtCompact(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1).replace(/\.0$/, '')}L+`;
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K+`;
  return `${n}+`;
}

/**
 * Hero "live listings" badge — real platform count, pulsing status dot.
 * Renders a stable placeholder until stats resolve so the hero never jumps.
 */
export function HeroLiveBadge() {
  const dispatch = useAppDispatch();
  const { data: stats } = useAppSelector((s) => s.stats);

  useEffect(() => {
    dispatch(fetchPlatformStats() as any);
  }, [dispatch]);

  const label = stats?.total
    ? `${fmtCount(stats.total)} verified listings live`
    : '50,000+ verified listings live';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.09] px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-indigo-100">
      <span className="rv-pulse h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
      <span className="truncate">{label}</span>
    </div>
  );
}

/**
 * The glass stat tiles beside the hero headline.
 * Every value is real: agent and city counts come from the platform stats,
 * and 0% is the platform's standing zero-brokerage policy on owner deals.
 */
export function HeroStatTiles() {
  const { data: stats, loaded } = useAppSelector((s) => s.stats);

  const tiles = [
    {
      value: stats?.totalAgents ? fmtCompact(stats.totalAgents) : null,
      sub:   'verified agents',
    },
    {
      value: stats?.totalCities ? fmtCount(stats.totalCities) : null,
      sub:   'cities covered',
    },
    {
      value: '0%',
      sub:   'brokerage on owner deals',
    },
  ]
    // Once stats have resolved, drop the tiles the platform has no number for
    // yet (a fresh install reports 0) instead of leaving a skeleton forever.
    .filter((t) => t.value !== null || !loaded);

  return (
    <div className="flex flex-shrink-0 gap-2.5">
      {tiles.map((t) => (
        <div
          key={t.sub}
          className="min-w-[104px] flex-1 rounded-2xl border border-white/[0.14] bg-white/[0.07] px-4 py-3 lg:min-w-[128px] lg:px-[18px] lg:py-3.5"
        >
          {t.value ? (
            <p className="text-xl font-extrabold tracking-tight text-white lg:text-2xl">{t.value}</p>
          ) : (
            /* Skeleton — keeps the tile height stable instead of showing a made-up number */
            <span className="rv-pulse mt-1 block h-5 w-14 rounded bg-white/20 lg:h-6" />
          )}
          <p className="mt-1 text-[10.5px] font-semibold leading-tight text-slate-300/60 lg:text-[11px]">
            {t.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
