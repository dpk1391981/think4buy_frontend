'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Phone, MapPin, Building2, ArrowRight, Award, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { CallButton } from '@/components/common/PhoneRevealButton';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useAppSelector } from '@/lib/store';
import OptimizedImage from '@/components/common/OptimizedImage';
import { AgentCardSkeleton } from '@/components/skeleton';
import BrokerTransparencyBadge from '@/components/agent/BrokerTransparencyBadge';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  locality?: string;
  company?: string;
  agentLicense?: string;
  agentBio?: string;
  agentExperience?: number;
  agentRating?: number;
  totalDeals?: number;
  agentTick?: 'none' | 'verified' | 'bronze' | 'silver' | 'gold';
}

function buildAgentSlug(agent: Agent): string {
  const name = agent.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!agent.city) return name;
  const city = agent.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${name}/${city}`;
}

// ── 3D Metallic tier themes ────────────────────────────────────────────────────
const TIER_THEME: Record<string, {
  headerGrad: string; cardBg: string; cardBorder: string;
  shadow: string; hoverShadow: string; glow: string;
  badgeGrad: string; badgeShadow: string; badgeColor: string;
  avatarBorder: string; avatarShadow: string;
  shimmer: string; icon: string; label: string;
  statColor: string; divider: string; btnGrad: string; btnShadow: string;
}> = {
  gold: {
    headerGrad:   'linear-gradient(135deg, #713f12 0%, #a16207 18%, #ca8a04 35%, #fde68a 52%, #eab308 68%, #a16207 84%, #713f12 100%)',
    cardBg:       'linear-gradient(180deg, #fffbeb 0%, #ffffff 55%, #fffbeb 100%)',
    cardBorder:   '2px solid rgba(234,179,8,0.55)',
    shadow:       '0 2px 4px rgba(0,0,0,0.06), 0 8px 16px rgba(161,98,7,0.18), 0 20px 40px rgba(113,63,18,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
    hoverShadow:  '0 4px 8px rgba(0,0,0,0.08), 0 16px 36px rgba(161,98,7,0.32), 0 36px 60px rgba(113,63,18,0.18)',
    glow:         '0 0 28px rgba(234,179,8,0.35)',
    badgeGrad:    'linear-gradient(135deg, #92400e, #b45309, #d97706, #fde68a, #fbbf24, #d97706, #b45309, #92400e)',
    badgeShadow:  '0 2px 8px rgba(161,98,7,0.6), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15)',
    badgeColor:   '#fff7ed',
    avatarBorder: '3px solid rgba(253,230,138,0.9)',
    avatarShadow: '0 4px 16px rgba(161,98,7,0.5), 0 0 0 1px rgba(234,179,8,0.3)',
    shimmer:      'linear-gradient(105deg, transparent 35%, rgba(254,243,199,0.7) 50%, transparent 65%)',
    icon:         '♛',
    label:        'GOLD',
    statColor:    '#92400e',
    divider:      'rgba(234,179,8,0.2)',
    btnGrad:      'linear-gradient(135deg, #b45309, #d97706, #eab308)',
    btnShadow:    '0 2px 8px rgba(161,98,7,0.4)',
  },
  silver: {
    headerGrad:   'linear-gradient(135deg, #1e293b 0%, #334155 18%, #64748b 35%, #e2e8f0 52%, #94a3b8 68%, #475569 84%, #1e293b 100%)',
    cardBg:       'linear-gradient(180deg, #f8fafc 0%, #ffffff 55%, #f8fafc 100%)',
    cardBorder:   '2px solid rgba(148,163,184,0.5)',
    shadow:       '0 2px 4px rgba(0,0,0,0.06), 0 8px 16px rgba(100,116,139,0.16), 0 20px 40px rgba(30,41,59,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
    hoverShadow:  '0 4px 8px rgba(0,0,0,0.08), 0 16px 36px rgba(100,116,139,0.3), 0 36px 60px rgba(30,41,59,0.14)',
    glow:         '0 0 28px rgba(148,163,184,0.4)',
    badgeGrad:    'linear-gradient(135deg, #0f172a, #334155, #94a3b8, #f1f5f9, #cbd5e1, #64748b, #1e293b)',
    badgeShadow:  '0 2px 8px rgba(30,41,59,0.55), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.15)',
    badgeColor:   '#f8fafc',
    avatarBorder: '3px solid rgba(226,232,240,0.9)',
    avatarShadow: '0 4px 16px rgba(100,116,139,0.45), 0 0 0 1px rgba(148,163,184,0.4)',
    shimmer:      'linear-gradient(105deg, transparent 35%, rgba(241,245,249,0.8) 50%, transparent 65%)',
    icon:         '◈',
    label:        'SILVER',
    statColor:    '#334155',
    divider:      'rgba(148,163,184,0.25)',
    btnGrad:      'linear-gradient(135deg, #334155, #475569, #64748b)',
    btnShadow:    '0 2px 8px rgba(30,41,59,0.35)',
  },
  bronze: {
    headerGrad:   'linear-gradient(135deg, #431407 0%, #7c2d12 18%, #c2410c 35%, #fb923c 52%, #ea580c 68%, #9a3412 84%, #431407 100%)',
    cardBg:       'linear-gradient(180deg, #fff7ed 0%, #ffffff 55%, #fff7ed 100%)',
    cardBorder:   '2px solid rgba(194,65,12,0.4)',
    shadow:       '0 2px 4px rgba(0,0,0,0.06), 0 8px 16px rgba(124,45,18,0.16), 0 20px 40px rgba(67,20,7,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
    hoverShadow:  '0 4px 8px rgba(0,0,0,0.08), 0 16px 36px rgba(124,45,18,0.28), 0 36px 60px rgba(67,20,7,0.16)',
    glow:         '0 0 28px rgba(251,146,60,0.35)',
    badgeGrad:    'linear-gradient(135deg, #431407, #7c2d12, #c2410c, #fdba74, #fb923c, #c2410c, #7c2d12)',
    badgeShadow:  '0 2px 8px rgba(124,45,18,0.55), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.15)',
    badgeColor:   '#fff7ed',
    avatarBorder: '3px solid rgba(253,186,116,0.9)',
    avatarShadow: '0 4px 16px rgba(194,65,12,0.45), 0 0 0 1px rgba(251,146,60,0.35)',
    shimmer:      'linear-gradient(105deg, transparent 35%, rgba(254,215,170,0.6) 50%, transparent 65%)',
    icon:         '◉',
    label:        'BRONZE',
    statColor:    '#7c2d12',
    divider:      'rgba(251,146,60,0.2)',
    btnGrad:      'linear-gradient(135deg, #9a3412, #c2410c, #ea580c)',
    btnShadow:    '0 2px 8px rgba(124,45,18,0.4)',
  },
  verified: {
    headerGrad:   'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 30%, #3b82f6 52%, #93c5fd 65%, #60a5fa 78%, #1d4ed8 100%)',
    cardBg:       'linear-gradient(180deg, #eff6ff 0%, #ffffff 55%, #eff6ff 100%)',
    cardBorder:   '2px solid rgba(59,130,246,0.35)',
    shadow:       '0 2px 4px rgba(0,0,0,0.06), 0 8px 16px rgba(29,78,216,0.14), 0 20px 40px rgba(30,58,138,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
    hoverShadow:  '0 4px 8px rgba(0,0,0,0.08), 0 16px 36px rgba(29,78,216,0.26), 0 36px 60px rgba(30,58,138,0.14)',
    glow:         '0 0 28px rgba(59,130,246,0.3)',
    badgeGrad:    'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6, #bfdbfe, #60a5fa, #1d4ed8)',
    badgeShadow:  '0 2px 8px rgba(29,78,216,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
    badgeColor:   '#eff6ff',
    avatarBorder: '3px solid rgba(147,197,253,0.9)',
    avatarShadow: '0 4px 16px rgba(29,78,216,0.4), 0 0 0 1px rgba(59,130,246,0.3)',
    shimmer:      'linear-gradient(105deg, transparent 35%, rgba(219,234,254,0.7) 50%, transparent 65%)',
    icon:         '✓',
    label:        'VERIFIED',
    statColor:    '#1e3a8a',
    divider:      'rgba(59,130,246,0.15)',
    btnGrad:      'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)',
    btnShadow:    '0 2px 8px rgba(29,78,216,0.35)',
  },
};

function AgentCard({ agent }: { agent: Agent }) {
  const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const slug     = buildAgentSlug(agent);
  const tick     = agent.agentTick && agent.agentTick !== 'none' ? agent.agentTick : null;
  const T        = tick ? TIER_THEME[tick] : null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 ease-out group"
      style={{
        background:  T ? T.cardBg  : '#ffffff',
        border:      T ? T.cardBorder : '1.5px solid #e2e8f0',
        boxShadow:   T ? T.shadow  : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.07)',
        transform:   'translateY(0) scale(1)',
        willChange:  'transform, box-shadow',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform  = 'translateY(-6px) scale(1.015)';
        el.style.boxShadow  = T ? `${T.hoverShadow}, ${T.glow}` : '0 4px 12px rgba(0,0,0,0.1), 0 16px 32px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform  = 'translateY(0) scale(1)';
        el.style.boxShadow  = T ? T.shadow : '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)';
      }}
    >
      {/* ── Header band ── */}
      {T ? (
        <div
          className="relative h-[76px] overflow-hidden flex-shrink-0"
          style={{ background: T.headerGrad }}
        >
          {/* Shimmer sweep on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: T.shimmer, backgroundSize: '200% 100%' }}
          />
          {/* Top-right badge */}
          <div
            className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest select-none"
            style={{
              background: T.badgeGrad,
              boxShadow:  T.badgeShadow,
              color:      T.badgeColor,
              letterSpacing: '0.1em',
            }}
          >
            <span style={{ fontSize: 11 }}>{T.icon}</span>
            <span>{T.label}</span>
          </div>
          {/* Subtle corner reflection */}
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        </div>
      ) : (
        /* Clean header for untiered agents */
        <div
          className="relative h-[56px] overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f8fafc 100%)' }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.6) 50%, transparent 65%)' }} />
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 border border-gray-200/80">
            <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Agent</span>
          </div>
        </div>
      )}

      {/* ── Avatar row (overlaps header) ── */}
      <div className="px-4 flex items-end gap-3" style={{ marginTop: T ? -28 : -20 }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden relative"
          style={{
            background: T ? T.headerGrad : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            border:     T ? T.avatarBorder : '2.5px solid #ffffff',
            boxShadow:  T ? T.avatarShadow : '0 2px 10px rgba(0,0,0,0.14), 0 0 0 1px rgba(226,232,240,0.8)',
          }}
        >
          {agent.avatar
            ? <OptimizedImage src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="56px" />
            : initials
          }
        </div>
        {/* Rating chip */}
        {agent.agentRating && (
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm mb-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-700">{Number(agent.agentRating).toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <Link href={`/agents/${slug}`} className="block px-4 pt-2 pb-3 flex-1">
        {/* Agency name only */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary-700 transition-colors">
          {agent.company || agent.name}
        </h3>
        {(agent.city || (agent.agentExperience ?? 0) > 0) && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 flex-wrap">
            {agent.city && (
              <>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{agent.city}{agent.locality ? `, ${agent.locality}` : ''}</span>
              </>
            )}
            {(agent.agentExperience ?? 0) > 0 && (
              <>
                {agent.city && <span className="text-gray-200">·</span>}
                <span className="font-semibold text-gray-500">{agent.agentExperience}+ yrs exp</span>
              </>
            )}
          </div>
        )}

        {/* Stats row — RERA license only (Deals shown in transparency badge below) */}
        {agent.agentLicense && (
          <div
            className="flex items-center gap-3 mt-3 pt-3"
            style={{ borderTop: `1px solid ${T ? T.divider : '#f3f4f6'}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 truncate">
                <Award className="w-2.5 h-2.5 flex-shrink-0" />
                {agent.agentLicense}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">RERA Licensed</div>
            </div>
          </div>
        )}
      </Link>

      {/* Transparency badge */}
      <div className="px-4 pb-2">
        <BrokerTransparencyBadge agentUserId={agent.id} variant="card" />
      </div>

      {/* ── Actions ── */}
      <div className="px-4 pb-4 flex gap-2 flex-shrink-0">
        {agent.phone && (
          <CallButton
            phone={`+91${agent.phone}`}
            className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors flex-shrink-0 border border-gray-200"
          >
            <Phone className="w-3.5 h-3.5" />
          </CallButton>
        )}
        <Link
          href={`/agents/${slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-95"
          style={{
            background:  T ? T.btnGrad   : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow:   T ? T.btnShadow : '0 2px 8px rgba(37,99,235,0.35)',
          }}
        >
          <Users className="w-3.5 h-3.5" />
          View Profile
        </Link>
        <Link
          href={`/properties?agentId=${agent.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs px-3 py-2.5 rounded-xl transition-colors flex-shrink-0 border border-gray-200"
          title="View Listings"
        >
          <Building2 className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function TopAgents({ city: cityProp }: { city?: string }) {
  const scrollRef       = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const selectedState   = useAppSelector(s => s.ui.selectedState);
  const selectedStateId = useAppSelector(s => s.ui.selectedStateId);
  const selectedCity    = useAppSelector(s => s.ui.selectedCity);
  const selectedCityId  = useAppSelector(s => s.ui.selectedCityId);

  useEffect(() => { setMounted(true); }, []);

  const effectiveCity = cityProp ?? selectedCity;

  const agentParams: Parameters<typeof usersApi.getAgents>[0] = { limit: 8 };
  if (effectiveCity)        agentParams.city    = effectiveCity;
  else if (selectedCityId)  agentParams.cityId  = selectedCityId;
  else if (selectedStateId) agentParams.stateId = selectedStateId;
  else if (selectedState)   agentParams.state   = selectedState;

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['home-top-agents', selectedStateId || selectedState, effectiveCity || selectedCityId],
    queryFn: () =>
      usersApi.getAgents(agentParams).then(r => r.data?.agents || []),
    staleTime: 3 * 60 * 1000,
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };

  if (!isLoading && agents.length === 0) return null;

  const locationLabel = cityProp
    ? (effectiveCity ? `in ${effectiveCity}` : 'across India')
    : (mounted ? (effectiveCity ? `in ${effectiveCity}` : selectedState ? `in ${selectedState}` : 'across India') : 'across India');

  const viewAllHref = cityProp && effectiveCity
    ? `/agents?city=${encodeURIComponent(effectiveCity)}`
    : mounted && effectiveCity
    ? `/agents?city=${encodeURIComponent(effectiveCity)}`
    : mounted && selectedState
    ? `/agents?state=${encodeURIComponent(selectedState)}`
    : '/agents';

  return (
    <section className="py-5 sm:py-14 bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-6 px-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Top Real Estate Agencies</h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Verified RERA-certified agencies {locationLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop scroll arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-primary-300 transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-primary-300 transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <Link
              href={viewAllHref}
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Location indicator */}
        {mounted && (selectedCity || selectedState) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-xl w-fit">
            <span>📍 Showing agencies in <strong>{selectedCity || selectedState}</strong></span>
          </div>
        )}

        {/* Scroll container — same on mobile + desktop */}
        <div className="-mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-2"
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[78vw] sm:w-[260px] snap-start">
                    <AgentCardSkeleton />
                  </div>
                ))
              : agents.map((agent: Agent) => (
                  <div key={agent.id} className="flex-shrink-0 w-[78vw] sm:w-[260px] snap-start">
                    <AgentCard agent={agent} />
                  </div>
                ))
            }
          </div>
        </div>

        {/* Mobile view-all */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            View All Agencies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
