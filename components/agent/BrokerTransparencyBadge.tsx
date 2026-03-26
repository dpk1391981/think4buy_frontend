'use client';

import { useEffect, useState } from 'react';
import {
  Star, Briefcase, Clock, AlertTriangle, CheckCircle2,
  Shield, Zap, TrendingUp, UserPlus, Activity,
} from 'lucide-react';
import { agencyApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrustProfile {
  label: string;
  rating: { value: number; text: string };
  deals: { count: number; text: string };
  response_time: { value: string; text: string };
  complaints: { count: number; text: string };
  trust_badges: string[];
}

// ── Badge icon map ────────────────────────────────────────────────────────────

const BADGE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'Highly Rated':        { icon: Star,        color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'  },
  'Fast Responder':      { icon: Zap,         color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200'    },
  'Experienced Agent':   { icon: Briefcase,   color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200' },
  'New Agent':           { icon: UserPlus,    color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  'Low Complaint Record':{ icon: Shield,      color: 'text-green-600',  bg: 'bg-green-50 border-green-200'  },
  'High Demand Agent':   { icon: TrendingUp,  color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200'},
};

const DEFAULT_BADGE = { icon: CheckCircle2, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' };

// ── Star renderer ─────────────────────────────────────────────────────────────

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={10}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Agent's user ID — the profile is fetched from the API */
  agentUserId: string;
  /** 'card' = compact inline strip  |  'full' = expanded panel */
  variant?: 'card' | 'full';
  /** Pre-fetched profile (skips the API call — use on SSR pages) */
  profile?: TrustProfile;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BrokerTransparencyBadge({
  agentUserId,
  variant = 'card',
  profile: prefetched,
  className = '',
}: Props) {
  const [profile, setProfile] = useState<TrustProfile | null>(prefetched ?? null);
  const [loading, setLoading] = useState(!prefetched);

  useEffect(() => {
    if (prefetched || !agentUserId) return;
    agencyApi.getTransparencyProfile(agentUserId)
      .then((r: any) => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [agentUserId, prefetched]);

  if (loading) return <TransparencySkeleton variant={variant} />;
  if (!profile) return null;

  if (variant === 'card') return <CardVariant profile={profile} className={className} />;
  return <FullVariant profile={profile} className={className} />;
}

// ── Card variant (compact strip for agent cards & listing pages) ──────────────

function CardVariant({ profile, className }: { profile: TrustProfile; className: string }) {
  const hasComplaints = profile.complaints.count > 0;

  return (
    <div className={`rounded-xl border bg-white/80 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* One-line label */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
        <Activity size={11} className="text-slate-400 flex-shrink-0" />
        <p className="text-[10px] font-semibold text-slate-600 leading-tight truncate">
          {profile.label}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        {/* Rating */}
        <div className="px-2.5 py-2 flex flex-col items-center gap-0.5">
          <MiniStars rating={profile.rating.value} />
          <span className="text-[11px] font-bold text-amber-600">
            {profile.rating.value.toFixed(1)}
          </span>
          <span className="text-[9px] text-slate-400">Rating</span>
        </div>

        {/* Deals */}
        <div className="px-2.5 py-2 flex flex-col items-center gap-0.5">
          <Briefcase size={12} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-slate-700">{profile.deals.count}</span>
          <span className="text-[9px] text-slate-400">Deals</span>
        </div>

        {/* Response */}
        <div className="px-2.5 py-2 flex flex-col items-center gap-0.5">
          <Clock size={12} className={profile.response_time.value === 'N/A' ? 'text-slate-300' : 'text-blue-500'} />
          <span className="text-[11px] font-bold text-slate-700 truncate max-w-[48px] text-center">
            {profile.response_time.value}
          </span>
          <span className="text-[9px] text-slate-400">Response</span>
        </div>
      </div>

      {/* Complaint warning (only shown if complaints > 0) */}
      {hasComplaints && (
        <div className="mx-2.5 mb-2 mt-1 flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
          <AlertTriangle size={10} className="text-orange-500 flex-shrink-0" />
          <span className="text-[10px] text-orange-700 font-medium">{profile.complaints.text}</span>
        </div>
      )}

      {/* Badges */}
      <div className="px-2.5 pb-2.5 flex flex-wrap gap-1">
        {profile.trust_badges.map(badge => {
          const meta = BADGE_META[badge] ?? DEFAULT_BADGE;
          const Icon = meta.icon;
          return (
            <span
              key={badge}
              className={`inline-flex items-center gap-1 text-[9px] font-semibold border rounded-full px-2 py-0.5 ${meta.bg} ${meta.color}`}
            >
              <Icon size={8} />
              {badge}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Full variant (agent detail page) ─────────────────────────────────────────

function FullVariant({ profile, className }: { profile: TrustProfile; className: string }) {
  const hasComplaints = profile.complaints.count > 0;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-slate-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Broker Transparency Profile</h3>
          <p className="text-xs text-slate-400 mt-0.5">{profile.label}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
        {/* Rating */}
        <StatBox
          icon={<Star size={14} className="text-amber-500 fill-amber-500" />}
          value={profile.rating.value.toFixed(1)}
          label="User Rating"
          sub={<MiniStars rating={profile.rating.value} />}
        />
        {/* Deals */}
        <StatBox
          icon={<Briefcase size={14} className="text-emerald-500" />}
          value={String(profile.deals.count)}
          label="Deals Closed"
          sub={<span className="text-[10px] text-slate-400">{profile.deals.text}</span>}
        />
        {/* Response */}
        <StatBox
          icon={<Clock size={14} className={profile.response_time.value === 'N/A' ? 'text-slate-300' : 'text-blue-500'} />}
          value={profile.response_time.value}
          label="Response Time"
          sub={<span className="text-[10px] text-slate-400">{profile.response_time.text}</span>}
        />
        {/* Complaints */}
        <StatBox
          icon={
            hasComplaints
              ? <AlertTriangle size={14} className="text-orange-500" />
              : <CheckCircle2 size={14} className="text-green-500" />
          }
          value={String(profile.complaints.count)}
          label="Complaints"
          sub={
            <span className={`text-[10px] font-medium ${hasComplaints ? 'text-orange-600' : 'text-green-600'}`}>
              {profile.complaints.text}
            </span>
          }
        />
      </div>

      {/* Complaint banner (only if > 0) */}
      {hasComplaints && (
        <div className="mx-4 mt-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
          <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-orange-800">Complaints on record</p>
            <p className="text-xs text-orange-600 mt-0.5">
              {profile.complaints.count} formal complaint{profile.complaints.count !== 1 ? 's have' : ' has'} been
              reported against this agent. Review their listing history carefully.
            </p>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Trust Signals
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.trust_badges.map(badge => {
            const meta = BADGE_META[badge] ?? DEFAULT_BADGE;
            const Icon = meta.icon;
            return (
              <span
                key={badge}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1 ${meta.bg} ${meta.color}`}
              >
                <Icon size={11} />
                {badge}
              </span>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-slate-300">
          Trust signals are computed from verified transaction records, user reviews, and platform activity.
          Profile completeness and complaint data are reviewed periodically.
        </p>
      </div>
    </div>
  );
}

// ── Shared stat box (full variant) ────────────────────────────────────────────

function StatBox({
  icon, value, label, sub,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="bg-white px-4 py-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">{icon}<span className="text-[10px] text-slate-400 font-medium">{label}</span></div>
      <span className="text-xl font-black text-slate-800 leading-none">{value}</span>
      {sub}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TransparencySkeleton({ variant }: { variant: 'card' | 'full' }) {
  if (variant === 'full') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-pulse">
        <div className="px-5 py-4 bg-slate-50 border-b h-16" />
        <div className="grid grid-cols-4 gap-px bg-slate-100">
          {[0,1,2,3].map(i => <div key={i} className="bg-white h-20" />)}
        </div>
        <div className="px-5 py-4 h-14" />
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-white animate-pulse">
      <div className="h-8 bg-slate-50 border-b" />
      <div className="grid grid-cols-3 divide-x h-16" />
      <div className="h-8 m-2 bg-slate-50 rounded-lg" />
    </div>
  );
}
