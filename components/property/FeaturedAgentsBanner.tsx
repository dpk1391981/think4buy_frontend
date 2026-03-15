'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Phone, MessageCircle, Star, Zap, ChevronRight,
  BadgeCheck, Users, MapPin, Briefcase, TrendingUp,
  Award, Gem, Shield, Clock, ArrowUpRight, Calendar,
  Home, CheckCircle, Mail,
} from 'lucide-react';
import { agencyApi, usersApi } from '@/lib/api';
import { resolveImageUrl } from '@/lib/imageUtils';
import { CallButton, WhatsAppButton } from '@/components/common/PhoneRevealButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedAgent {
  id: string;
  agentId?: string;
  name?: string;
  agentName?: string;
  agentAvatar?: string;
  agentPhone?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  company?: string;
  agentRating?: number;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
  totalDeals?: number;
  agentExperience?: number;
  agentLicense?: string;
  agentBio?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
  coverageAreas?: string | string[];
  authorityScore?: number;
  createdAt?: string;
  isPremiumSlot?: boolean;
  slotNumber?: number;
}

// ─── Tier config ──────────────────────────────────────────────────────────────

const TICK = {
  diamond: {
    label:     'Diamond Agent',
    short:     'Diamond',
    panelFrom: '#6d28d9',
    panelTo:   '#4c1d95',
    avatarGrd: 'from-violet-400 via-purple-500 to-violet-700',
    ring:      'ring-violet-300/60',
    badge:     'bg-violet-100 text-violet-800 border-violet-200',
    dotBg:     'bg-violet-500',
    statIcon:  'text-violet-500',
    areaChip:  'bg-violet-50 text-violet-700 border-violet-200',
    score:     'bg-violet-800/40 text-violet-100',
    icon:      <Gem className="w-3 h-3" />,
  },
  gold: {
    label:     'Gold Agent',
    short:     'Gold',
    panelFrom: '#d97706',
    panelTo:   '#92400e',
    avatarGrd: 'from-amber-300 via-yellow-400 to-amber-600',
    ring:      'ring-amber-300/60',
    badge:     'bg-amber-100 text-amber-800 border-amber-200',
    dotBg:     'bg-amber-400',
    statIcon:  'text-amber-500',
    areaChip:  'bg-amber-50 text-amber-700 border-amber-200',
    score:     'bg-amber-800/40 text-amber-100',
    icon:      <Star className="w-3 h-3 fill-amber-400" />,
  },
  blue: {
    label:     'Verified Agent',
    short:     'Verified',
    panelFrom: '#1d4ed8',
    panelTo:   '#1e3a8a',
    avatarGrd: 'from-blue-400 via-blue-500 to-blue-700',
    ring:      'ring-blue-300/60',
    badge:     'bg-blue-100 text-blue-800 border-blue-200',
    dotBg:     'bg-blue-500',
    statIcon:  'text-blue-500',
    areaChip:  'bg-blue-50 text-blue-700 border-blue-200',
    score:     'bg-blue-800/40 text-blue-100',
    icon:      <BadgeCheck className="w-3 h-3" />,
  },
  none: {
    label:     'Agent',
    short:     '',
    panelFrom: '#334155',
    panelTo:   '#1e293b',
    avatarGrd: 'from-slate-400 via-slate-500 to-slate-600',
    ring:      'ring-slate-300/50',
    badge:     '',
    dotBg:     'bg-slate-400',
    statIcon:  'text-slate-400',
    areaChip:  'bg-slate-50 text-slate-600 border-slate-200',
    score:     'bg-slate-700/40 text-slate-200',
    icon:      null,
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSlug(a: FeaturedAgent, city: string) {
  const n  = (a.name || a.agentName || 'agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const rc = city || a.city || '';
  if (!rc) return n;
  return `${n}-in-${rc.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function getInitials(name: string) {
  return (name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function parseAreas(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, rating));
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, city }: { agent: FeaturedAgent; city: string }) {
  const name    = agent.name || agent.agentName || 'Agent';
  const phone   = agent.phone || agent.agentPhone;
  const avatar  = agent.avatar || agent.agentAvatar;
  const tick    = (agent.agentTick && agent.agentTick !== 'none') ? agent.agentTick : 'none';
  const cfg     = TICK[tick];
  const rating  = Number(agent.agentRating ?? 0);
  const deals   = agent.totalDeals ?? 0;
  const exp     = agent.agentExperience ?? 0;
  const score   = agent.authorityScore ?? 0;
  const areas   = parseAreas(agent.coverageAreas);
  const since   = agent.createdAt ? new Date(agent.createdAt).getFullYear() : null;
  const slug    = buildSlug(agent, city);
  const clean   = phone?.replace(/[^0-9]/g, '') ?? '';
  const waMsg   = `Hi ${name.split(' ')[0]}, I found your profile on Think4BuySale. I'm looking for a property in ${city}.`;

  return (
    <article className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 flex flex-col">

      {/* ══ HEADER BANNER ════════════════════════════════════════════════════ */}
      <div
        className="relative h-28 flex-shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${cfg.panelFrom}, ${cfg.panelTo})` }}
      >
        {/* Dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`p-${agent.id}`} width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-${agent.id})`} />
        </svg>
        {/* Glow orbs */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-4 left-1/3 w-16 h-16 rounded-full bg-white/10 blur-lg" />

        {/* Top badges row */}
        <div className="relative flex items-start justify-between px-4 pt-3">
          {/* Tier pill */}
          {tick !== 'none' && (
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/30">
              {cfg.icon}{cfg.short}
            </span>
          )}
          {tick === 'none' && <span />}

          {/* Right badges */}
          <div className="flex items-center gap-1.5">
            {agent.isPremiumSlot && (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow">
                <Zap className="w-2.5 h-2.5" />FEATURED
              </span>
            )}
            {score > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.score}`}>
                <TrendingUp className="w-2.5 h-2.5" />{score}
              </span>
            )}
          </div>
        </div>

        {/* Avatar — positioned to overflow banner bottom */}
        <div className="absolute -bottom-9 left-5">
          <Link href={`/agents/${slug}`}>
            <div className={`w-[72px] h-[72px] rounded-2xl overflow-hidden ring-3 ring-white shadow-lg ${cfg.ring}`}>
              {avatar ? (
                <img
                  src={resolveImageUrl(avatar)}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${cfg.avatarGrd} flex items-center justify-center text-white font-extrabold text-xl`}>
                  {getInitials(name)}
                </div>
              )}
            </div>
            {/* Verified dot */}
            <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${cfg.dotBg} flex items-center justify-center shadow`}>
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
            </span>
          </Link>
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div className="pt-11 px-5 pb-5 flex flex-col gap-3 flex-1">

        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/agents/${slug}`}
              className="block text-base font-extrabold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight truncate"
            >
              {name}
            </Link>
            {agent.company && (
              <p className="text-xs text-gray-500 mt-0.5 truncate font-medium">{agent.company}</p>
            )}
            {(agent.city || agent.state) && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin className="w-3 h-3 text-primary-400 flex-shrink-0" />
                {[agent.city, agent.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <Link
            href={`/agents/${slug}`}
            className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-xl transition-colors border border-primary-100"
          >
            Profile <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Rating + member since */}
        <div className="flex items-center justify-between gap-2">
          {rating > 0 ? (
            <div className="flex items-center gap-2">
              <Stars rating={rating} />
              <span className="text-sm font-extrabold text-gray-800">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">/ 5.0</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">No rating yet</span>
          )}
          {since && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium flex-shrink-0">
              <Calendar className="w-3 h-3" />Since {since}
            </span>
          )}
        </div>

        {/* ── Stats grid ── */}
        {(exp > 0 || deals > 0 || agent.agentLicense || agent.isVerified) && (
          <div className="grid grid-cols-4 gap-1.5">
            {exp > 0 && (
              <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 border border-gray-100">
                <Briefcase className={`w-4 h-4 mb-1 ${cfg.statIcon}`} />
                <span className="text-sm font-extrabold text-gray-900 leading-none">{exp}+</span>
                <span className="text-[9px] text-gray-400 mt-0.5 font-medium tracking-tight">Yrs Exp</span>
              </div>
            )}
            {deals > 0 && (
              <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 border border-gray-100">
                <TrendingUp className={`w-4 h-4 mb-1 ${cfg.statIcon}`} />
                <span className="text-sm font-extrabold text-gray-900 leading-none">{deals}</span>
                <span className="text-[9px] text-gray-400 mt-0.5 font-medium tracking-tight">Deals</span>
              </div>
            )}
            {agent.agentLicense && (
              <div className="flex flex-col items-center bg-emerald-50 rounded-xl py-2.5 border border-emerald-100 col-span-1">
                <Award className="w-4 h-4 mb-1 text-emerald-600" />
                <span className="text-[9px] font-mono text-emerald-700 font-bold truncate w-full text-center px-1 leading-none">
                  {agent.agentLicense.slice(0, 8)}
                </span>
                <span className="text-[9px] text-emerald-500 mt-0.5 font-medium">RERA</span>
              </div>
            )}
            {(agent.isVerified || tick !== 'none') && (
              <div className="flex flex-col items-center bg-blue-50 rounded-xl py-2.5 border border-blue-100">
                <Shield className="w-4 h-4 mb-1 text-blue-500" />
                <span className="text-[9px] text-blue-700 font-bold leading-none text-center px-1">KYC</span>
                <span className="text-[9px] text-blue-400 mt-0.5 font-medium">Done</span>
              </div>
            )}
          </div>
        )}

        {/* ── Coverage areas ── */}
        {areas.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />Coverage Areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {areas.slice(0, 5).map((area, i) => (
                <span
                  key={i}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${cfg.areaChip}`}
                >
                  {area}
                </span>
              ))}
              {areas.length > 5 && (
                <span className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-semibold">
                  +{areas.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Bio ── */}
        {agent.agentBio && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 border-t border-gray-100 pt-3">
            {agent.agentBio}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Trust microtext ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <Clock className="w-3 h-3 text-emerald-400" />Fast response
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <CheckCircle className="w-3 h-3 text-blue-400" />Background verified
          </span>
          {agent.email && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                <Mail className="w-3 h-3 text-primary-400" />Email available
              </span>
            </>
          )}
        </div>

        {/* ── CTA Buttons ── */}
        <div className="grid gap-2">
          {phone ? (
            <div className="grid grid-cols-2 gap-2">
              <CallButton
                phone={phone}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-primary-200 hover:shadow-primary-300 hover:-translate-y-px"
              >
                <Phone className="w-3.5 h-3.5" />Call Now
              </CallButton>
              <WhatsAppButton
                phone={clean}
                message={waMsg}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-100 hover:-translate-y-px"
              >
                <MessageCircle className="w-3.5 h-3.5" />WhatsApp
              </WhatsAppButton>
            </div>
          ) : null}
          <Link
            href={`/agents/${slug}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 hover:border-primary-300 text-gray-600 hover:text-primary-700 hover:bg-primary-50 text-xs font-bold rounded-xl transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            View Full Profile & Listings
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse flex flex-col">
      {/* Banner */}
      <div className="h-28 bg-gray-100" />
      {/* Body */}
      <div className="pt-11 px-5 pb-5 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-2/5" />
          </div>
          <div className="h-7 w-16 bg-gray-100 rounded-xl" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-3 bg-gray-100 rounded w-28" />
          <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl" />)}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[1,2,3].map(i => <div key={i} className="h-5 w-16 bg-gray-100 rounded-full" />)}
        </div>
        <div className="space-y-1.5 pt-3 border-t border-gray-100">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="h-9 bg-gray-100 rounded-xl" />
            <div className="h-9 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-9 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export default function FeaturedAgentsBanner({ city }: { city: string }) {
  const [agents, setAgents]   = useState<FeaturedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) { setLoading(false); return; }
    setLoading(true);

    Promise.allSettled([
      agencyApi.getPremiumAgents(city),
      usersApi.getAgents({ city, limit: 6 } as any),
    ]).then(([premResult, topResult]) => {
      const prem: FeaturedAgent[] =
        premResult.status === 'fulfilled' && Array.isArray(premResult.value.data)
          ? premResult.value.data.map((s: any) => ({
              id: s.id, agentId: s.agentId, name: s.agentName, agentName: s.agentName,
              avatar: s.agentAvatar, agentAvatar: s.agentAvatar, phone: s.agentPhone,
              agentPhone: s.agentPhone, city, isPremiumSlot: true, slotNumber: s.slotNumber,
            }))
          : [];

      const topRaw = topResult.status === 'fulfilled'
        ? (topResult.value.data?.agents ?? topResult.value.data?.items ?? topResult.value.data)
        : null;
      const top: FeaturedAgent[] = Array.isArray(topRaw)
        ? topRaw
            .filter((a: any) => !prem.find(p => p.agentId === a.id))
            .slice(0, Math.max(0, 6 - prem.length))
        : [];

      setAgents([...prem, ...top]);
    }).finally(() => setLoading(false));
  }, [city]);

  if (!loading && agents.length === 0) return null;

  const cityDisplay = city ? city.charAt(0).toUpperCase() + city.slice(1) : '';
  const citySlug    = city ? city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';

  return (
    <section className="mt-6 mb-2 px-4 sm:px-0">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-200 flex-shrink-0">
            <Users className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 leading-tight">
              Top Agents in{' '}
              {cityDisplay && <span className="text-primary-600">{cityDisplay}</span>}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <BadgeCheck className="w-3 h-3 text-emerald-500" />RERA Verified
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock className="w-3 h-3 text-primary-400" />Quick Response
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />4.5+ Rated
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Home className="w-3 h-3 text-primary-400" />Active Listings
              </span>
            </div>
          </div>
        </div>

        {citySlug && (
          <Link
            href={`/property-agents-in-${citySlug}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-100 hover:border-primary-300 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* ── Cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          : agents.map((agent, i) => <AgentCard key={agent.id || i} agent={agent} city={city} />)
        }
      </div>

      {/* ── Footer ── */}
      {!loading && agents.length > 0 && citySlug && (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5">
            {[
              { icon: <Shield      className="w-3.5 h-3.5 text-emerald-500" />, label: 'RERA Certified' },
              { icon: <Gem         className="w-3.5 h-3.5 text-violet-500"  />, label: 'Diamond & Gold Tiers' },
              { icon: <CheckCircle className="w-3.5 h-3.5 text-blue-500"   />, label: 'Background Verified' },
              { icon: <TrendingUp  className="w-3.5 h-3.5 text-primary-400"/>, label: 'Best Deal Guarantee' },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                {item.icon}{item.label}
              </span>
            ))}
          </div>

          <Link
            href={`/property-agents-in-${citySlug}`}
            className="sm:hidden w-full flex items-center justify-center gap-2 text-sm font-bold text-primary-700 bg-primary-50 border-2 border-primary-200 hover:bg-primary-100 px-4 py-3 rounded-2xl transition-colors"
          >
            <Users className="w-4 h-4" />
            View all Agents in {cityDisplay}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
