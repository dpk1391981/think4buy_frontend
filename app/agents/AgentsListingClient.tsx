'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, MapPin, Phone, Star, Shield, CheckCircle, Building2,
  Briefcase, TrendingUp, ChevronRight, ChevronDown, ChevronLeft,
  X, Users, MessageCircle, SlidersHorizontal, BadgeCheck,
  Home, Handshake, Quote, Sparkles, Zap, Flame, Trophy,
} from 'lucide-react';
import { usersApi, locationsApi, agencyApi } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CallButton, WhatsAppButton } from '@/components/common/PhoneRevealButton';
import { resolveImageSrc } from '@/components/common/OptimizedImage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  company?: string;
  isVerified?: boolean;
  agentTick?: 'none' | 'verified' | 'bronze' | 'silver' | 'gold';
  agentRating?: number;
  agentExperience?: number;
  agentLicense?: string;
  agentBio?: string;
  totalDeals?: number;
  agentUsedQuota?: number;
  createdAt?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TICK: Record<string, { label: string; cls: string; icon: string; grad: string; dot: string }> = {
  verified: { label: 'Verified', cls: 'bg-blue-50 text-blue-700 border-blue-200',        icon: '✓', grad: 'from-blue-500 to-blue-700',       dot: 'bg-blue-500'    },
  bronze:   { label: 'Bronze',   cls: 'bg-orange-50 text-orange-700 border-orange-300',  icon: '◉', grad: 'from-orange-500 to-red-600',       dot: 'bg-orange-500'  },
  silver:   { label: 'Silver',   cls: 'bg-slate-50 text-slate-600 border-slate-300',     icon: '◈', grad: 'from-slate-400 to-slate-700',      dot: 'bg-slate-400'   },
  gold:     { label: 'Gold',     cls: 'bg-amber-50 text-amber-700 border-amber-300',     icon: '♛', grad: 'from-amber-400 to-yellow-500',     dot: 'bg-amber-400'   },
};

// Per-badge card theme — 3D metallic
const CARD_THEME: Record<string, {
  card: string; barH: string;
  headerGrad: string; leftBg: string; leftBorder: string;
  avatarGrad: string; avatarRing: string; avatarShadow: string;
  rightBg: string; rightBorder: string;
  callCls: string; waCls: string; profileCls: string;
  nameCls: string; crownIcon: string | null;
  statIconBg: string; statIconColor: string;
  cardShadow: string; hoverShadow: string;
  badgeGrad: string; badgeShadow: string; badgeColor: string;
  mobileCta: string; taglineColor: string;
}> = {
  none: {
    card:         'border-gray-200 bg-white',
    barH:         'h-1',
    headerGrad:   'from-gray-200 to-gray-300',
    leftBg:       'bg-gray-50/50', leftBorder: 'border-gray-100',
    avatarGrad:   'from-slate-400 to-slate-600', avatarRing: '', avatarShadow: '',
    rightBg:      'bg-white', rightBorder: 'border-gray-100',
    callCls:      'bg-emerald-500 hover:bg-emerald-600 text-white',
    waCls:        'border-green-400 text-green-700 bg-green-50/40 hover:bg-green-50',
    profileCls:   'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50',
    nameCls:      'group-hover:text-primary-600',
    crownIcon:    null, statIconBg: 'bg-blue-50 border-blue-100', statIconColor: 'text-blue-500',
    cardShadow:   '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)',
    hoverShadow:  '0 4px 8px rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.08)',
    badgeGrad: '', badgeShadow: '', badgeColor: '',
    mobileCta: 'border-gray-100 bg-white', taglineColor: '',
  },
  verified: {
    card:         'border-blue-200/60',
    barH:         'h-1.5',
    headerGrad:   'from-blue-600 via-blue-500 to-indigo-500',
    leftBg:       'bg-blue-50/40', leftBorder: 'border-blue-100',
    avatarGrad:   'from-blue-500 to-indigo-700',
    avatarRing:   'ring-2 ring-blue-300/60',
    avatarShadow: '0 4px 14px rgba(29,78,216,0.4)',
    rightBg:      'bg-blue-50/30', rightBorder: 'border-blue-100',
    callCls:      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_2px_8px_rgba(29,78,216,0.4)]',
    waCls:        'border-blue-300 text-blue-700 bg-blue-50/60 hover:bg-blue-100',
    profileCls:   'border-blue-200 text-blue-700 hover:bg-blue-50',
    nameCls:      'group-hover:text-blue-700',
    crownIcon:    '✓',
    statIconBg:   'bg-blue-50 border-blue-100', statIconColor: 'text-blue-600',
    cardShadow:   '0 2px 6px rgba(29,78,216,0.1), 0 8px 20px rgba(29,78,216,0.12)',
    hoverShadow:  '0 4px 10px rgba(29,78,216,0.15), 0 18px 36px rgba(29,78,216,0.2), 0 0 20px rgba(59,130,246,0.2)',
    badgeGrad:    'linear-gradient(135deg,#1e3a8a,#1d4ed8,#60a5fa,#bfdbfe,#60a5fa,#1d4ed8)',
    badgeShadow:  '0 2px 8px rgba(29,78,216,0.45)',
    badgeColor:   '#eff6ff',
    mobileCta:    'border-blue-100 bg-blue-50/40', taglineColor: 'text-blue-600',
  },
  bronze: {
    card:         'border-orange-200/70',
    barH:         'h-2',
    headerGrad:   'from-[#431407] via-[#c2410c] to-[#fb923c]',
    leftBg:       'bg-orange-50/40', leftBorder: 'border-orange-100',
    avatarGrad:   'from-orange-500 to-red-700',
    avatarRing:   'ring-2 ring-orange-300/70',
    avatarShadow: '0 4px 14px rgba(194,65,12,0.4)',
    rightBg:      'bg-orange-50/30', rightBorder: 'border-orange-100',
    callCls:      'bg-gradient-to-r from-[#9a3412] via-[#c2410c] to-[#ea580c] hover:brightness-110 text-white shadow-[0_2px_8px_rgba(124,45,18,0.45)]',
    waCls:        'border-orange-300 text-orange-800 bg-orange-50/60 hover:bg-orange-100',
    profileCls:   'border-orange-200 text-orange-800 hover:bg-orange-50',
    nameCls:      'group-hover:text-orange-700',
    crownIcon:    '◉',
    statIconBg:   'bg-orange-50 border-orange-100', statIconColor: 'text-orange-600',
    cardShadow:   '0 2px 6px rgba(124,45,18,0.1), 0 8px 20px rgba(124,45,18,0.14)',
    hoverShadow:  '0 4px 10px rgba(124,45,18,0.18), 0 18px 36px rgba(124,45,18,0.22), 0 0 24px rgba(251,146,60,0.3)',
    badgeGrad:    'linear-gradient(135deg,#431407,#7c2d12,#c2410c,#fdba74,#fb923c,#c2410c,#7c2d12)',
    badgeShadow:  '0 2px 8px rgba(124,45,18,0.55)',
    badgeColor:   '#fff7ed',
    mobileCta:    'border-orange-100 bg-orange-50/40', taglineColor: 'text-orange-700',
  },
  silver: {
    card:         'border-slate-300/70',
    barH:         'h-2',
    headerGrad:   'from-[#1e293b] via-[#64748b] to-[#e2e8f0]',
    leftBg:       'bg-slate-50/50', leftBorder: 'border-slate-100',
    avatarGrad:   'from-slate-500 to-slate-800',
    avatarRing:   'ring-2 ring-slate-300/70',
    avatarShadow: '0 4px 14px rgba(100,116,139,0.45)',
    rightBg:      'bg-slate-50/40', rightBorder: 'border-slate-100',
    callCls:      'bg-gradient-to-r from-[#1e293b] via-[#475569] to-[#64748b] hover:brightness-110 text-white shadow-[0_2px_8px_rgba(30,41,59,0.4)]',
    waCls:        'border-slate-300 text-slate-700 bg-slate-50/60 hover:bg-slate-100',
    profileCls:   'border-slate-200 text-slate-700 hover:bg-slate-50',
    nameCls:      'group-hover:text-slate-700',
    crownIcon:    '◈',
    statIconBg:   'bg-slate-50 border-slate-200', statIconColor: 'text-slate-500',
    cardShadow:   '0 2px 6px rgba(30,41,59,0.1), 0 8px 20px rgba(100,116,139,0.14)',
    hoverShadow:  '0 4px 10px rgba(30,41,59,0.16), 0 18px 36px rgba(100,116,139,0.24), 0 0 24px rgba(148,163,184,0.35)',
    badgeGrad:    'linear-gradient(135deg,#0f172a,#334155,#94a3b8,#f1f5f9,#cbd5e1,#64748b,#1e293b)',
    badgeShadow:  '0 2px 8px rgba(30,41,59,0.5)',
    badgeColor:   '#f8fafc',
    mobileCta:    'border-slate-200 bg-slate-50/50', taglineColor: 'text-slate-600',
  },
  gold: {
    card:         'border-amber-300/70',
    barH:         'h-2',
    headerGrad:   'from-[#713f12] via-[#d97706] to-[#fde68a]',
    leftBg:       'bg-amber-50/40', leftBorder: 'border-amber-100',
    avatarGrad:   'from-amber-400 to-orange-700',
    avatarRing:   'ring-2 ring-amber-300/80',
    avatarShadow: '0 4px 16px rgba(161,98,7,0.5)',
    rightBg:      'bg-amber-50/30', rightBorder: 'border-amber-100',
    callCls:      'bg-gradient-to-r from-[#92400e] via-[#d97706] to-[#eab308] hover:brightness-110 text-white shadow-[0_2px_8px_rgba(161,98,7,0.5)]',
    waCls:        'border-amber-300 text-amber-800 bg-amber-50/60 hover:bg-amber-100',
    profileCls:   'border-amber-200 text-amber-800 hover:bg-amber-50',
    nameCls:      'group-hover:text-amber-700',
    crownIcon:    '♛',
    statIconBg:   'bg-amber-50 border-amber-100', statIconColor: 'text-amber-600',
    cardShadow:   '0 2px 6px rgba(161,98,7,0.12), 0 8px 20px rgba(161,98,7,0.18)',
    hoverShadow:  '0 4px 10px rgba(161,98,7,0.2), 0 20px 40px rgba(161,98,7,0.28), 0 0 28px rgba(234,179,8,0.35)',
    badgeGrad:    'linear-gradient(135deg,#92400e,#b45309,#d97706,#fde68a,#fbbf24,#d97706,#b45309,#92400e)',
    badgeShadow:  '0 2px 8px rgba(161,98,7,0.6)',
    badgeColor:   '#fff7ed',
    mobileCta:    'border-amber-200 bg-amber-50/40', taglineColor: 'text-amber-700',
  },
};

const SORT_OPTIONS = [
  { value: 'rating',     label: 'Top Rated'        },
  { value: 'deals',      label: 'Most Deals'        },
  { value: 'experience', label: 'Most Experienced'  },
  { value: 'listings',   label: 'Most Listings'     },
  { value: 'newest',     label: 'Recently Joined'   },
];

const BADGE_OPTIONS = [
  { value: 'verified', label: '✓ Verified' },
  { value: 'bronze',   label: '◉ Bronze'   },
  { value: 'silver',   label: '◈ Silver'   },
  { value: 'gold',     label: '♛ Gold'     },
];

const EXP_OPTIONS = [
  { value: '',   label: 'Any'     },
  { value: '1',  label: '1+ yrs'  },
  { value: '3',  label: '3+ yrs'  },
  { value: '5',  label: '5+ yrs'  },
  { value: '10', label: '10+ yrs' },
];

const DEALS_OPTIONS = [
  { value: '',   label: 'Any'   },
  { value: '5',  label: '5+'    },
  { value: '10', label: '10+'   },
  { value: '25', label: '25+'   },
  { value: '50', label: '50+'   },
];

const TOP_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Noida', 'Kolkata', 'Ahmedabad'];

const QUICK_FILTERS = [
  { label: 'All Agents',      sort: 'rating',     badge: null,       icon: '🏠' },
  { label: 'Top Rated',       sort: 'rating',     badge: null,       icon: '⭐' },
  { label: 'Most Deals',      sort: 'deals',      badge: null,       icon: '🔥' },
  { label: 'Experienced',     sort: 'experience', badge: null,       icon: '🕐' },
  { label: 'Most Listings',   sort: 'listings',   badge: null,       icon: '📋' },
  { label: '✓ Verified',      sort: 'rating',     badge: 'verified', icon: '✓'  },
  { label: '◉ Bronze',        sort: 'rating',     badge: 'bronze',   icon: '◉'  },
  { label: '◈ Silver',        sort: 'rating',     badge: 'silver',   icon: '◈'  },
  { label: '♛ Gold',          sort: 'rating',     badge: 'gold',     icon: '♛'  },
];

const LIMIT = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSlug(a: Agent) {
  const n = (a.name || 'agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!a.city) return n;
  const c = a.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${n}/${c}`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function clientSort(agents: Agent[], by: string) {
  return [...agents].sort((a, b) => {
    if (by === 'rating')     return (b.agentRating ?? 0) - (a.agentRating ?? 0);
    if (by === 'deals')      return (b.totalDeals ?? 0) - (a.totalDeals ?? 0);
    if (by === 'experience') return (b.agentExperience ?? 0) - (a.agentExperience ?? 0);
    if (by === 'listings')   return (b.agentUsedQuota ?? 0) - (a.agentUsedQuota ?? 0);
    if (by === 'newest')     return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    return 0;
  });
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  );
}

function Avatar({ agent, size = 'lg' }: { agent: Agent; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-11 h-11 text-sm rounded-xl', md: 'w-14 h-14 text-base rounded-2xl', lg: 'w-[72px] h-[72px] text-lg rounded-2xl' }[size];
  const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK[agent.agentTick] : null;
  const grad = tick?.grad ?? 'from-slate-400 to-slate-600';
  if (agent.avatar) return <img src={resolveImageSrc(agent.avatar)} alt={agent.name} className={`${sz} object-cover flex-shrink-0 shadow-sm`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
  return (
    <div className={`${sz} bg-gradient-to-br ${grad} flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm`}>
      {getInitials(agent.name)}
    </div>
  );
}

// ── Agent Card — 3D metallic badge-themed ─────────────────────────────────────

const TIER_TAGLINE: Record<string, string> = {
  gold:     '♛ Trusted Gold-Tier Agent',
  silver:   '◈ Elite Silver-Tier Agent',
  bronze:   '◉ Certified Bronze Agent',
  verified: '✓ Verified Agent',
};

function AgentCard({ agent, rank }: { agent: Agent; rank?: number }) {
  const tickKey = agent.agentTick && agent.agentTick !== 'none' ? agent.agentTick : 'none';
  const tick    = tickKey !== 'none' ? TICK[tickKey] : null;
  const theme   = CARD_THEME[tickKey] ?? CARD_THEME.none;
  const slug    = buildSlug(agent);
  const waPhone = agent.phone ? `91${agent.phone.replace(/\D/g, '')}` : null;
  const isPremium = tickKey !== 'none';

  return (
    <article
      className={cn('group border rounded-2xl overflow-hidden relative transition-all duration-300 ease-out', theme.card)}
      style={{
        boxShadow: theme.cardShadow,
        transform: 'translateY(0)',
        willChange: 'transform, box-shadow',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform  = 'translateY(-4px)';
        el.style.boxShadow  = theme.hoverShadow;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform  = 'translateY(0)';
        el.style.boxShadow  = theme.cardShadow;
      }}
    >
      {/* ── Metallic top bar ── */}
      <div
        className={cn(`bg-gradient-to-r ${theme.headerGrad}`, theme.barH)}
        style={isPremium ? { boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.12)' } : {}}
      />

      {/* ── Metallic badge (top-right, tiered only) ── */}
      {isPremium && theme.badgeGrad && (
        <div
          className="absolute top-4 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest z-10 select-none"
          style={{
            background: theme.badgeGrad,
            boxShadow:  theme.badgeShadow,
            color:      theme.badgeColor,
            letterSpacing: '0.1em',
          }}
        >
          <span>{tick?.icon}</span>
          <span>{tick?.label.toUpperCase()}</span>
        </div>
      )}

      <div className="flex">
        {/* ── LEFT: rank + avatar ─────────────────── */}
        <div className={cn(
          'flex flex-col items-center gap-2 px-4 py-4 border-r w-[88px] sm:w-[100px] flex-shrink-0',
          theme.leftBg, theme.leftBorder,
        )}>
          {rank && (
            <span className={cn(
              'text-xs font-black w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm',
              rank === 1 ? 'bg-amber-400' : rank === 2 ? 'bg-slate-400' : rank === 3 ? 'bg-orange-600' : 'bg-gray-300',
            )}>
              {rank}
            </span>
          )}

          {theme.crownIcon && (
            tickKey === 'gold' ? (
              <span className="gold-crown-3d text-xl">♛</span>
            ) : (
              <span className="text-base leading-none" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))' }}>
                {theme.crownIcon}
              </span>
            )
          )}

          {/* Avatar */}
          <div className="relative">
            {agent.avatar ? (
              <img
                src={resolveImageSrc(agent.avatar)}
                alt={agent.name}
                className={cn('w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-white', theme.avatarRing)}
                style={isPremium ? { boxShadow: theme.avatarShadow } : {}}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div
                className={cn(
                  'w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white text-lg font-black border-2 border-white',
                  `bg-gradient-to-br ${theme.avatarGrad}`,
                  theme.avatarRing,
                )}
                style={isPremium ? { boxShadow: theme.avatarShadow } : {}}
              >
                {getInitials(agent.name)}
              </div>
            )}
            {agent.isVerified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white fill-white" />
              </span>
            )}
          </div>

        </div>

        {/* ── MIDDLE: info ────────────────────────── */}
        <Link href={`/agents/${slug}`} className="flex-1 min-w-0 px-4 py-4 flex flex-col justify-between">
          <div>
            {/* Name row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5 pr-20">
              <h2 className={cn('text-base font-extrabold text-gray-900 transition-colors leading-tight', theme.nameCls)}>
                {agent.company || agent.name}
              </h2>
              {agent.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  <CheckCircle className="w-2.5 h-2.5" /> RERA
                </span>
              )}
            </div>

            {/* Rating stars below name */}
            {(agent.agentRating ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <Stars rating={Number(agent.agentRating)} size="sm" />
                <span className="text-xs font-semibold text-amber-600">{Number(agent.agentRating).toFixed(1)}</span>
              </div>
            )}

            {/* Premium tagline */}
            {isPremium && (
              <p className={cn('text-[10px] font-semibold mb-1.5 flex items-center gap-1', theme.taglineColor)}>
                <Sparkles className="w-3 h-3" /> {TIER_TAGLINE[tickKey]}
              </p>
            )}

            {/* Agent name (secondary) + location */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-2.5 text-xs text-gray-500">
              {agent.company && (
                <span className="flex items-center gap-1 text-gray-500">
                  {agent.name}
                </span>
              )}
              {(agent.city || agent.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary-400 flex-shrink-0" />
                  {[agent.city, agent.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={cn('w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0', theme.statIconBg)}>
                  <Briefcase className={cn('w-3.5 h-3.5', theme.statIconColor)} />
                </span>
                <span><b className="text-gray-900">{agent.agentExperience ?? 0}+</b> yrs exp</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={cn('w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0', theme.statIconBg)}>
                  <TrendingUp className={cn('w-3.5 h-3.5', theme.statIconColor)} />
                </span>
                <span><b className="text-gray-900">{agent.totalDeals ?? 0}</b> deals</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={cn('w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0', theme.statIconBg)}>
                  <Building2 className={cn('w-3.5 h-3.5', theme.statIconColor)} />
                </span>
                <span><b className="text-gray-900">{agent.agentUsedQuota ?? 0}</b> listings</span>
              </div>
            </div>

          </div>
        </Link>

        {/* ── RIGHT: contact panel — desktop ──────── */}
        <div className={cn(
          'hidden sm:flex flex-col border-l w-[160px] flex-shrink-0',
          theme.rightBg, theme.rightBorder,
        )}>
          <div className={cn('px-4 pt-4 pb-3 border-b', theme.rightBorder)}>
            <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-1.5', isPremium ? theme.taglineColor : 'text-gray-400')}>
              Contact {tick ? `${tick.icon} ${tick.label}` : 'Agent'}
            </p>
            {agent.phone ? (
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <Phone className={cn('w-3 h-3 flex-shrink-0', isPremium ? theme.statIconColor : 'text-emerald-500')} />
                ••••• {agent.phone.slice(-5)}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Login to view</p>
            )}
          </div>

          <div className="px-4 py-3 flex flex-col gap-2">
            {agent.phone ? (
              <CallButton
                phone={`+91${agent.phone}`}
                className={cn('flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95', theme.callCls)}
              >
                <Phone className="w-3.5 h-3.5" /> Call Now
              </CallButton>
            ) : (
              <Link
                href={`/agents/${slug}`}
                className={cn('flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95', theme.callCls)}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Send Enquiry
              </Link>
            )}

            {waPhone && (
              <WhatsAppButton
                phone={waPhone}
                message={`Hi ${agent.name}, I found your profile on Think4BuySale and I'm interested in your real estate services.`}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 text-white shadow-sm"
                style={{ background: '#25D366' }}
              >
                <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
              </WhatsAppButton>
            )}

            <Link
              href={`/agents/${slug}`}
              className={cn('flex items-center justify-center gap-1 w-full py-2.5 text-xs font-semibold rounded-xl transition-all border', theme.profileCls)}
            >
              View Profile <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile CTA ── */}
      <div className={cn('sm:hidden px-3 pb-3 pt-2.5 border-t flex items-center gap-2', theme.mobileCta)}>
        {agent.phone && (
          <CallButton
            phone={`+91${agent.phone}`}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors', theme.callCls)}
          >
            <Phone className="w-3.5 h-3.5 flex-shrink-0" /> Call
          </CallButton>
        )}
        {waPhone && (
          <WhatsAppButton
            phone={waPhone}
            message={`Hi ${agent.name}, I found your profile on Think4BuySale and I'm interested in your real estate services.`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 text-white"
            style={{ background: '#25D366' }}
          >
            <WhatsAppIcon className="w-3.5 h-3.5 flex-shrink-0" /> WhatsApp
          </WhatsAppButton>
        )}
        <Link
          href={`/agents/${slug}`}
          className={cn('flex items-center justify-center gap-1 py-2.5 px-3.5 border rounded-xl text-xs font-semibold transition-colors', theme.profileCls)}
        >
          <Users className="w-3.5 h-3.5 flex-shrink-0" /> Profile
        </Link>
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-1 bg-gray-100" />
      <div className="flex">
        {/* Left rank+avatar */}
        <div className="w-[100px] flex-shrink-0 bg-gray-50 flex flex-col items-center gap-3 px-4 py-4 border-r border-gray-100">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="w-16 h-16 bg-gray-200 rounded-xl" />
          <div className="w-12 h-3 bg-gray-200 rounded" />
        </div>
        {/* Middle */}
        <div className="flex-1 px-4 py-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-3.5 bg-gray-200 rounded w-52" />
          <div className="flex gap-2">
            <div className="h-7 bg-gray-100 rounded-lg w-28" />
            <div className="h-7 bg-gray-100 rounded-lg w-28" />
            <div className="h-7 bg-gray-100 rounded-lg w-28" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-full max-w-sm" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        {/* Right CTA */}
        <div className="hidden sm:flex flex-col gap-2 w-[160px] flex-shrink-0 border-l border-gray-100 px-4 py-4">
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Filter Sidebar Section ────────────────────────────────────────────────────

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-800">
        {title}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-4 h-10 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 hover:text-primary-600 bg-white transition-colors">
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
          : (
            <button key={p} onClick={() => onChange(p as number)}
              className={cn('w-10 h-10 rounded-xl text-sm font-medium transition-colors', p === page
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600')}>
              {p}
            </button>
          )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="px-4 h-10 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 hover:text-primary-600 bg-white transition-colors">
        Next →
      </button>
    </div>
  );
}

// ── SEO bottom sections ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: '01', icon: <Search className="w-5 h-5" />, title: 'Search by City', desc: 'Enter your city or locality to discover top-rated agents in your area.' },
  { step: '02', icon: <Users className="w-5 h-5" />, title: 'Compare Profiles', desc: 'Review agent ratings, deals closed, experience years, RERA numbers and verified reviews.' },
  { step: '03', icon: <Phone className="w-5 h-5" />, title: 'Connect for Free', desc: 'Call or message the agent directly at zero cost. No middlemen, no hidden fees.' },
  { step: '04', icon: <Handshake className="w-5 h-5" />, title: 'Close Your Deal', desc: 'Expert guidance from shortlisting to registration. Your agent handles everything.' },
];

const WHY_CHOOSE = [
  { icon: <BadgeCheck className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100', title: 'RERA Verified Agents', desc: 'Every agent must submit their RERA registration. We verify credentials before granting the Verified badge.' },
  { icon: <Star className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50 border-amber-100', title: 'Authentic Reviews', desc: 'Ratings come only from verified clients who have actually worked with the agent. Zero fake reviews.' },
  { icon: <Shield className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 border-blue-100', title: 'Transparent Fees', desc: 'Agent brokerage details are disclosed upfront. No shock fees at the time of registration.' },
  { icon: <Sparkles className="w-5 h-5 text-violet-600" />, bg: 'bg-violet-50 border-violet-100', title: 'All Property Types', desc: 'Whether buying a flat, renting an office or selling a plot — find specialists for every category.' },
];

const TESTIMONIALS = [
  { text: 'Found my dream 3BHK in Pune in 2 weeks. The agent was professional and super responsive.', name: 'Priya Sharma', city: 'Pune', rating: 5 },
  { text: 'Sold my property at the best price. The agent handled all documentation and negotiations perfectly.', name: 'Rajesh Kumar', city: 'Mumbai', rating: 5 },
  { text: 'As a first-time buyer, the agent guided me through every step. Complete transparency, no hidden charges.', name: 'Ananya Singh', city: 'Bangalore', rating: 5 },
];

const FAQ = [
  { q: 'How do I find a verified real estate agent in India?', a: 'Use the search bar to filter agents by city. Look for the Verified (✓) or RERA badge on profiles, which confirms the agent has been background-checked by Think4BuySale.' },
  { q: 'Are agents on Think4BuySale RERA registered?', a: 'Yes. All listed agents must submit their RERA number during registration. Agents with the Verified badge have had their documents reviewed by our team. The RERA number is visible on every agent profile.' },
  { q: 'Is it free to contact a real estate agent?', a: 'Absolutely. Connecting with any agent on Think4BuySale is completely free. Simply call or message them directly from their profile. No subscription or inquiry fees for buyers and sellers.' },
  { q: 'How are agent ratings calculated?', a: 'Agent ratings are based on reviews submitted by verified clients — buyers, sellers and renters who have actually worked with the agent. Each review includes a 1–5 star rating and the average is updated automatically after every new review.' },
  { q: 'Can I find agents for commercial properties?', a: 'Yes. Think4BuySale agents cover all categories including apartments, villas, plots, commercial offices, shops, warehouses and PG accommodations. Browse agent profiles to find specialists for your requirement.' },
  { q: 'What is the difference between Verified, Gold and Diamond agents?', a: 'Verified agents have confirmed RERA registration. Gold agents additionally have a proven track record of high deal volume and strong ratings. Diamond is the highest tier, awarded to agents with exceptional performance, tenure and reviews.' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function AgentsListingClient({
  searchParams: _sp,
  city: serverCity = '',
}: {
  searchParams: Record<string, string>;
  city?: string;
}) {
  const router = useRouter();
  const urlP = useSearchParams();

  // URL param helpers
  const param = (key: string, fallback = '') => urlP.get(key) ?? fallback;

  const activeCity  = param('city', serverCity);
  const activeBadge = param('badge');
  const activeSort  = param('sort', 'rating');
  const activeMinExp    = param('minExp');
  const activeMinDeals  = param('minDeals');
  const activePage  = parseInt(param('page', '1'), 10) || 1;
  const activeSearch = param('search');

  // Local UI state
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bannerAgents, setBannerAgents] = useState<Agent[]>([]);

  // City search autocomplete (purely local — not a filter until applied)
  const [cityQuery, setCityQuery]     = useState(activeCity);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const searchWrap     = useRef<HTMLDivElement>(null);
  const bannerTrackRef = useRef<HTMLDivElement>(null);
  const bannerPaused   = useRef(false);

  // Sync city input if URL changes externally
  useEffect(() => { setCityQuery(activeCity); }, [activeCity]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Fetch banner agents from correct APIs (premium slots + top agents)
  useEffect(() => {
    Promise.allSettled([
      agencyApi.getPremiumAgents(activeCity || ''),
      agencyApi.getTopAgents(activeCity || undefined, 12),
    ]).then(([premRes, topRes]) => {
      // premAgents are already fully enriched (backend JOINs users table)
      const premRaw: Agent[] =
        premRes.status === 'fulfilled' && Array.isArray(premRes.value.data)
          ? premRes.value.data : [];

      // Deduplicate premium agents by user id (same agent may hold multiple slots)
      const seenIds = new Set<string>();
      const premAgents = premRaw.filter(a => {
        if (!a.id || seenIds.has(a.id)) return false;
        seenIds.add(a.id);
        return true;
      });

      const topRaw = topRes.status === 'fulfilled' ? topRes.value.data : null;
      const topList: Agent[] = Array.isArray(topRaw) ? topRaw
        : Array.isArray(topRaw?.agents) ? topRaw.agents
        : Array.isArray(topRaw?.items) ? topRaw.items : [];

      // Add top ticked agents not already in premium slots
      const premIds = new Set(premAgents.map(a => a.id));
      const extras = topList.filter(a => a.agentTick && a.agentTick !== 'none' && !premIds.has(a.id));
      const combined = [...premAgents, ...extras];

      if (combined.length === 0) { setBannerAgents([]); return; }
      // Duplicate for seamless loop (need at least 10 items)
      const times = Math.max(2, Math.ceil(10 / combined.length));
      setBannerAgents(Array.from({ length: times }, () => combined).flat());
    }).catch(() => setBannerAgents([]));
  }, [activeCity]);

  // Banner auto-scroll via requestAnimationFrame
  useEffect(() => {
    const track = bannerTrackRef.current;
    if (!track || bannerAgents.length === 0) return;
    let raf: number;
    let pos = 0;
    const speed = 0.6;
    function step() {
      if (!bannerPaused.current) {
        pos += speed;
        const half = track!.scrollWidth / 2;
        if (pos >= half) pos = 0;
        track!.style.transform = `translateX(-${pos}px)`;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [bannerAgents]);

  // City autocomplete
  const searchCity = useCallback(async (q: string) => {
    if (q.length < 2) { setCitySuggestions([]); return; }
    try {
      const { data } = await locationsApi.getCities();
      const all: string[] = (data || []).map((c: any) => c.name || c);
      setCitySuggestions(all.filter(c => c.toLowerCase().includes(q.toLowerCase())).slice(0, 7));
    } catch { setCitySuggestions([]); }
  }, []);

  // Push updated filters to URL (resets page to 1)
  const pushFilter = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(urlP.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '') p.delete(k); else p.set(k, v);
    });
    p.set('page', '1');
    router.push(`/agents?${p.toString()}`, { scroll: false });
  }, [urlP, router]);

  const pushPage = (pg: number) => {
    const p = new URLSearchParams(urlP.toString());
    p.set('page', String(pg));
    router.push(`/agents?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyCity = (c: string) => {
    setCityQuery(c); setShowSug(false);
    pushFilter({ city: c || null });
  };

  const clearAllFilters = () => {
    setCityQuery('');
    router.push('/agents', { scroll: false });
  };

  // Fetch ALL agents from API (server-side filters: city, badge only).
  // minExp / minDeals / sort are applied client-side so they always work
  // across all results, not just the current page's 15 items.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 500 };
      if (activeCity)  params.city = activeCity;
      if (activeBadge) params.agentTick = activeBadge;
      const r = await usersApi.getAgents(params);
      const data = r.data;
      const items: Agent[] = data?.agents || data?.items || (Array.isArray(data) ? data : []);
      setAllAgents(items);
    } catch {
      setAllAgents([]);
    } finally {
      setLoading(false);
    }
  }, [activeCity, activeBadge]); // only refetch when server-supported filters change

  useEffect(() => { load(); }, [load]);

  // Client-side filter + sort — instant, no API call
  const filteredAgents = useMemo(() => {
    const search = activeSearch.toLowerCase().trim();
    const result = allAgents.filter(a => {
      // Badge / tick filter
      if (activeBadge && a.agentTick !== activeBadge) return false;
      // City filter (client-side fallback in case API ignores it)
      if (activeCity && !(a.city ?? '').toLowerCase().includes(activeCity.toLowerCase())) return false;
      // Search filter — name, company, city
      if (search) {
        const hay = `${a.name} ${a.company ?? ''} ${a.city ?? ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      // Numeric filters
      if (activeMinExp   && (a.agentExperience ?? 0) < parseInt(activeMinExp))  return false;
      if (activeMinDeals && (a.totalDeals ?? 0)      < parseInt(activeMinDeals)) return false;
      return true;
    });
    return clientSort(result, activeSort);
  }, [allAgents, activeBadge, activeCity, activeSearch, activeMinExp, activeMinDeals, activeSort]);

  // Client-side pagination
  const total      = filteredAgents.length;
  const totalPages = Math.ceil(total / LIMIT);
  const agents     = useMemo(
    () => filteredAgents.slice((activePage - 1) * LIMIT, activePage * LIMIT),
    [filteredAgents, activePage],
  );

  const verifiedCount = filteredAgents.filter(a => a.isVerified || (a.agentTick && a.agentTick !== 'none')).length;

  // Active filter chips
  const activeFilterChips: { key: string; label: string }[] = [];
  if (activeCity)     activeFilterChips.push({ key: 'city',     label: `City: ${activeCity}` });
  if (activeBadge)    activeFilterChips.push({ key: 'badge',    label: BADGE_OPTIONS.find(b => b.value === activeBadge)?.label ?? activeBadge });
  if (activeMinExp)   activeFilterChips.push({ key: 'minExp',   label: `${activeMinExp}+ yrs exp` });
  if (activeMinDeals) activeFilterChips.push({ key: 'minDeals', label: `${activeMinDeals}+ deals` });

  const hasActiveFilters = !!(activeCity || activeBadge || activeMinExp || activeMinDeals || (activeSort !== 'rating'));

  // Chip removal — also clears local cityQuery state for city chip
  const removeChip = useCallback((key: string) => {
    if (key === 'city') setCityQuery('');
    pushFilter({ [key]: null });
  }, [pushFilter]);

  // ── Sidebar content ────────────────────────────────────────────────────────

  const makeSidebar = (idPrefix: string) => (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
          Filter Agents
        </h3>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
            Clear All
          </button>
        )}
      </div>

      {/* Sort By */}
      <SidebarSection title="Sort By">
        <div className="space-y-1">
          {SORT_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-sort`} value={o.value} checked={activeSort === o.value}
                onChange={() => pushFilter({ sort: o.value })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm transition-colors ${activeSort === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Agent Badge */}
      <SidebarSection title="Agent Badge">
        <div className="space-y-1">
          <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <input type="radio" name={`${idPrefix}-badge`} value="" checked={!activeBadge}
              onChange={() => pushFilter({ badge: null })}
              className="accent-primary-600 w-3.5 h-3.5" />
            <span className={`text-sm ${!activeBadge ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>All Agents</span>
          </label>
          {BADGE_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-badge`} value={o.value} checked={activeBadge === o.value}
                onChange={() => pushFilter({ badge: o.value })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm flex items-center gap-1 ${activeBadge === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TICK[o.value]?.dot}`} />
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Experience */}
      <SidebarSection title="Min. Experience">
        <div className="space-y-1">
          {EXP_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-minExp`} value={o.value}
                checked={activeMinExp === o.value}
                onChange={() => pushFilter({ minExp: o.value || null })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm ${activeMinExp === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Deals Closed */}
      <SidebarSection title="Min. Deals Closed">
        <div className="space-y-1">
          {DEALS_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-minDeals`} value={o.value}
                checked={activeMinDeals === o.value}
                onChange={() => pushFilter({ minDeals: o.value || null })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm ${activeMinDeals === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Popular Cities */}
      <SidebarSection title="Browse by City" defaultOpen={false}>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => { setCityQuery(''); pushFilter({ city: null }); }}
            className={cn('text-left text-sm py-1.5 px-2 rounded-lg transition-colors', !activeCity ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}>
            🇮🇳 All India
          </button>
          {TOP_CITIES.map(c => (
            <button key={c} onClick={() => pushFilter({ city: c })}
              className={cn('text-left text-sm py-1.5 px-2 rounded-lg flex items-center gap-1.5 transition-colors', activeCity === c ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}>
              <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />{c}
            </button>
          ))}
        </div>
      </SidebarSection>
    </aside>
  );

  // ── Render ─────────────────────────────────────────────────────────────────


  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes goldCrown3d {
          0%,100% { transform:translateY(0) scale(1) rotateZ(0deg);
            filter:drop-shadow(0 2px 6px rgba(234,179,8,.7)) drop-shadow(0 0 8px rgba(251,191,36,.4)); }
          20%  { transform:translateY(-4px) scale(1.25) rotateZ(-8deg);
            filter:drop-shadow(0 6px 14px rgba(234,179,8,.9)) drop-shadow(0 0 18px rgba(251,191,36,.7)) brightness(1.5); }
          40%  { transform:translateY(-6px) scale(1.3) rotateZ(0deg);
            filter:drop-shadow(0 8px 20px rgba(234,179,8,1)) drop-shadow(0 0 28px rgba(253,224,71,.8)) brightness(1.7); }
          60%  { transform:translateY(-4px) scale(1.25) rotateZ(8deg);
            filter:drop-shadow(0 6px 14px rgba(234,179,8,.9)) drop-shadow(0 0 18px rgba(251,191,36,.7)) brightness(1.5); }
          80%  { transform:translateY(-1px) scale(1.1) rotateZ(0deg);
            filter:drop-shadow(0 3px 8px rgba(234,179,8,.6)); }
        }
        .gold-crown-3d { animation: goldCrown3d 2.8s ease-in-out infinite; display:inline-block; line-height:1; }
        .banner-track  { will-change: transform; }
        .spn-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .spn-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.14); }
      ` }} />

      {/* ── Sticky search bar (same as property listing) ─────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="container-max py-3">
          <div ref={searchWrap} className="relative flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); setShowSug(true); searchCity(e.target.value); }}
                onFocus={() => { setShowSug(true); if (cityQuery.length >= 2) searchCity(cityQuery); }}
                onKeyDown={e => { if (e.key === 'Enter') applyCity(cityQuery); }}
                placeholder="Search agents by city (e.g. Mumbai, Delhi)…"
                className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
              />
              {cityQuery && (
                <button onClick={() => applyCity('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {showSug && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  {citySuggestions.map(c => (
                    <button key={c} onClick={() => applyCity(c)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 text-left border-b border-gray-50 last:border-0 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />{c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => applyCity(cityQuery)}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Search className="w-3.5 h-3.5" /> Search
            </button>
            {/* Mobile filter toggle */}
            <button onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white">
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
            </button>
          </div>
          {/* Horizontal quick filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
            {QUICK_FILTERS.map((qf) => {
              const isActive = activeSort === qf.sort && activeBadge === (qf.badge ?? '');
              return (
                <button
                  key={qf.label}
                  onClick={() => pushFilter({ sort: qf.sort, badge: qf.badge })}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  <span>{qf.icon}</span>
                  {qf.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb + city banner ──────────────────────────────────────── */}
      {activeCity && (
        <div className="bg-primary-50 border-b border-primary-100">
          <div className="container-max py-2.5 flex items-center gap-1.5 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link href="/agents" className="hover:text-primary-600 transition-colors">Agents</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold">{activeCity}</span>
          </div>
        </div>
      )}

      {/* ── Featured Agents Banner ────────────────────────────────────────── */}
      {bannerAgents.length > 0 && (
        <div className="container-max py-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide">
                <Zap className="w-2.5 h-2.5 fill-white" /> FEATURED
              </span>
              <span className="text-sm font-bold text-gray-800">
                Top Agents{activeCity ? ` in ${activeCity}` : ''}
              </span>
            </div>
            <Link href="/agents" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Auto-scroll track */}
          <div
            className="overflow-hidden cursor-default rounded-xl"
            onMouseEnter={() => { bannerPaused.current = true; }}
            onMouseLeave={() => { bannerPaused.current = false; }}
          >
            <div ref={bannerTrackRef} className="banner-track flex gap-2.5 w-max">
              {bannerAgents.map((a, idx) => {
                const tickKey = (a.agentTick && a.agentTick !== 'none') ? a.agentTick : 'verified';
                const theme   = CARD_THEME[tickKey] ?? CARD_THEME.none;
                const tick    = TICK[tickKey];
                const slug    = buildSlug(a);
                const isGold  = tickKey === 'gold';
                const waNum = a.phone ? `91${a.phone.replace(/\D/g, '')}` : null;
                return (
                  <div
                    key={`${a.id}-${idx}`}
                    className="spn-card relative flex-shrink-0 w-[220px] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${theme.headerGrad}`} />

                    {/* Profile link area */}
                    <Link href={`/agents/${slug}`} className="flex items-center gap-2.5 px-3 py-2.5 pl-4 pr-2">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {a.avatar ? (
                          <img src={resolveImageSrc(a.avatar)} alt={a.name}
                            className={`w-10 h-10 rounded-lg object-cover border border-white ${theme.avatarRing}`}
                            style={{ boxShadow: theme.avatarShadow || '0 2px 8px rgba(0,0,0,0.12)' }}
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-black bg-gradient-to-br ${theme.avatarGrad} ${theme.avatarRing}`}
                            style={{ boxShadow: theme.avatarShadow || '0 2px 8px rgba(0,0,0,0.12)' }}
                          >
                            {getInitials(a.name)}
                          </div>
                        )}
                        {a.isVerified && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                            <CheckCircle className="w-2 h-2 text-white fill-white" />
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0">
                          <p className="text-xs font-extrabold text-gray-900 truncate leading-tight">{a.company || a.name}</p>
                          {isGold && <span className="gold-crown-3d text-[11px] flex-shrink-0">♛</span>}
                        </div>
                        {a.company && (
                          <p className="text-[10px] text-gray-500 truncate leading-tight mb-0.5">{a.name}</p>
                        )}
                        <div className="flex items-center gap-1 mb-0.5">
                          {(a.agentRating ?? 0) > 0 && (
                            <>
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-2 h-2 ${i <= Math.round(a.agentRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                              ))}
                              <span className="text-[10px] font-bold text-amber-600 ml-0.5">{Number(a.agentRating).toFixed(1)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {a.city && (
                            <span className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                              <MapPin className="w-2 h-2 text-primary-400 flex-shrink-0" />{a.city}
                            </span>
                          )}
                          <span
                            className="ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: theme.badgeGrad || '#f3f4f6', color: theme.badgeColor || '#374151', boxShadow: theme.badgeShadow }}
                          >
                            {tick?.icon} {tick?.label.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* WhatsApp button — full width bottom strip */}
                    {waNum ? (
                      <WhatsAppButton
                        phone={waNum}
                        message={`Hi ${a.name}, I found your profile on Think4BuySale and I'm interested in your real estate services.`}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-white text-[10px] font-bold border-t border-green-100 transition-all"
                        style={{ background: '#25D366' }}
                      >
                        <WhatsAppIcon className="w-3 h-3" /> Chat on WhatsApp
                      </WhatsAppButton>
                    ) : (
                      <Link
                        href={`/agents/${slug}`}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-primary-600 text-[10px] font-semibold border-t border-gray-100 hover:bg-primary-50 transition-colors"
                      >
                        View Profile <ChevronRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Page body: sidebar + content ─────────────────────────────────── */}
      <div className="container-max py-5">
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0 sticky top-36 self-start max-h-[calc(100vh-160px)] overflow-y-auto">
            {makeSidebar('d')}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {activeCity
                    ? `Real Estate Agents in ${activeCity}`
                    : 'Find Top Real Estate Agents in India'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading…' : (
                    <>
                      <span className="font-semibold text-gray-700">{total.toLocaleString('en-IN')}</span> agents found
                      {verifiedCount > 0 && <span className="text-emerald-600"> · {verifiedCount} verified</span>}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilterChips.map(chip => (
                  <button key={chip.key} onClick={() => removeChip(chip.key)}
                    className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors">
                    {chip.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-600 underline px-1 transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Agent list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Agents Found</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  {activeCity ? `No agents in ${activeCity} yet.` : 'Try adjusting your filters.'}
                </p>
                <button onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm">
                  Browse All Agents
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {agents.map((a, i) => (
                    <AgentCard key={a.id} agent={a} rank={activePage === 1 ? i + 1 : undefined} />
                  ))}
                </div>

                {/* Count line */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  Showing {(activePage - 1) * LIMIT + 1}–{Math.min(activePage * LIMIT, total)} of {total.toLocaleString('en-IN')} agents
                </p>

                {/* Pagination */}
                <Pagination page={activePage} totalPages={totalPages} onChange={pushPage} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-y-0 left-0 w-[300px] bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Filter Agents</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {makeSidebar('m')}
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
                Show {total} Agents
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SEO CONTENT — BELOW THE FOLD
      ══════════════════════════════════════════════════════════════════ */}

      {/* City SEO links */}
      <section className="bg-white border-t border-gray-100 py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Explore by City</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Find Agents in Your City</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto">Browse RERA-certified real estate agents in all major cities across India.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {[...TOP_CITIES, 'Chandigarh', 'Lucknow', 'Kochi', 'Indore', 'Nagpur', 'Bhopal', 'Coimbatore', 'Vadodara', 'Patna', 'Bhubaneswar', 'Visakhapatnam', 'Mangalore'].map(c => (
              <Link key={c} href={`/agents?city=${encodeURIComponent(c)}`}
                className="flex items-center justify-between gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all group">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-400 group-hover:text-primary-500 flex-shrink-0" />{c}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-primary-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">How to Find the Right Agent</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto">Finding a trustworthy real estate agent in India has never been easier.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-primary-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-sm">{step.icon}</div>
                  <span className="text-3xl font-black text-gray-100 leading-none">{step.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Why Think4BuySale</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Why Trust Our Agent Network?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_CHOOSE.map(item => (
              <div key={item.title} className={`${item.bg} border rounded-2xl p-5 flex gap-3`}>
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Client Stories</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">What Our Clients Say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 relative">
                <Quote className="w-7 h-7 text-gray-100 absolute top-4 right-4" />
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-black">
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-max max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2.5">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-100 transition-colors">
                  <span className="font-semibold text-gray-900 text-sm leading-snug">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-gray-100 bg-white">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial SEO content */}
      <section className="bg-gray-50 border-t border-gray-100 py-12 md:py-16">
        <div className="container-max max-w-4xl">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-5">
            {activeCity ? `Real Estate Agents in ${activeCity} — Complete Guide` : 'Real Estate Agents in India — Your Complete Guide'}
          </h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>Finding a reliable real estate agent in India is one of the most critical steps when buying, selling or renting property. A good agent doesn't just show you listings — they bring expert market knowledge, handle complex legal documentation, negotiate the best price on your behalf, and guide you every step of the way from shortlisting to final registration.</p>
            <p>All real estate brokers listed on Think4BuySale are required to register with their RERA (Real Estate Regulatory Authority) number during onboarding. RERA was established under the Real Estate (Regulation and Development) Act, 2016 to protect home buyers from fraud. Working with a RERA-registered agent gives you legal recourse if something goes wrong — making it the single most important credential to verify before engaging any broker.</p>
            {activeCity && (
              <p>The real estate market in {activeCity} is highly dynamic, with prices varying significantly by locality, floor level and project vintage. An experienced local agent in {activeCity} understands neighbourhood-level price trends, upcoming infrastructure projects, school zones, metro connectivity and micro-market dynamics that no national portal can capture in a database. They have relationships with builders, legal advocates and financial institutions that help you close deals faster and avoid costly mistakes.</p>
            )}
            <div>
              <h3 className="font-bold text-gray-900 mt-4 mb-2 text-base">How to Choose the Right Real Estate Agent</h3>
              <p>When choosing a real estate agent, look for: (1) <strong>RERA registration</strong> — legally required for all practicing agents; (2) <strong>Local market experience</strong> — an agent active in your target neighbourhood for at least 3 years; (3) <strong>Strong reviews</strong> — prioritise agents with 4+ star ratings and multiple verified client testimonials; (4) <strong>Responsive communication</strong> — your agent should respond promptly and explain every step clearly; (5) <strong>Transparent fee structure</strong> — brokerage should be discussed and agreed in writing before beginning.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mt-4 mb-2 text-base">What is the Brokerage Fee for Real Estate Agents in India?</h3>
              <p>In India, the standard brokerage fee is typically 1–2% of the property value for both buyer and seller in purchase transactions, or 1–2 months' rent for rental transactions. However, this varies significantly by city and property type. Always clarify and document the brokerage amount before engaging an agent. Think4BuySale encourages agents to disclose their fee structure upfront on their profile page to ensure complete transparency for both parties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary-800 py-12">
        <div className="container-max text-center">
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">Ready to Find Your Agent?</h2>
          <p className="text-primary-200 text-sm mb-5 max-w-md mx-auto">Search from {total > 0 ? `${total.toLocaleString('en-IN')}+` : 'thousands of'} verified agents. Free consultation. Zero hidden fees.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-extrabold px-7 py-3 rounded-2xl text-sm transition-colors shadow-lg">
            <Search className="w-4 h-4" /> Search Agents Now
          </button>
        </div>
      </section>
    </div>
  );
}
