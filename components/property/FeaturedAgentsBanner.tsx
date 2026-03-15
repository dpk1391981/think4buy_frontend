'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Phone, MessageCircle, Star, Zap, ChevronRight,
  BadgeCheck, Users, MapPin, Briefcase, TrendingUp,
  Award, Gem, Shield,
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
  company?: string;
  agentRating?: number;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
  totalDeals?: number;
  agentExperience?: number;
  agentLicense?: string;
  agentBio?: string;
  city?: string;
  state?: string;
  isPremiumSlot?: boolean;
  slotNumber?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAgentSlug(a: FeaturedAgent, city: string) {
  const name = (a.name || a.agentName || 'agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const rawCity = city || a.city || '';
  if (!rawCity) return name;
  const c = rawCity.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${name}-in-${c}`;
}

function getInitials(name: string) {
  return (name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const TICK_CFG = {
  diamond: { label: 'Diamond',  cls: 'bg-violet-100 text-violet-700 border-violet-200', icon: <Gem className="w-3 h-3" /> },
  gold:    { label: 'Gold',     cls: 'bg-amber-100 text-amber-700 border-amber-200',    icon: <Star className="w-3 h-3 fill-amber-400" /> },
  blue:    { label: 'Verified', cls: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <BadgeCheck className="w-3 h-3" /> },
  none:    { label: '',         cls: '', icon: null },
} as const;

function StarRating({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, rating));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="text-xs font-bold text-gray-700 ml-1">{r.toFixed(1)}</span>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, city }: { agent: FeaturedAgent; city: string }) {
  const name   = agent.name || agent.agentName || 'Agent';
  const phone  = agent.phone || agent.agentPhone;
  const avatar = agent.avatar || agent.agentAvatar;
  const tick   = (agent.agentTick && agent.agentTick !== 'none') ? agent.agentTick : null;
  const tCfg   = tick ? TICK_CFG[tick] : null;
  const rating = Number(agent.agentRating ?? 0);
  const deals  = agent.totalDeals ?? 0;
  const exp    = agent.agentExperience ?? 0;
  const slug   = buildAgentSlug(agent, city);
  const waMsg  = `Hi ${name.split(' ')[0]}, I found your profile on Think4BuySale. Looking for property in ${city}.`;
  const clean  = phone?.replace(/[^0-9]/g, '') ?? '';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-200 overflow-hidden flex flex-col relative">

      {/* Sponsored pill */}
      {agent.isPremiumSlot && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          <Zap className="w-2.5 h-2.5" />FEATURED
        </div>
      )}

      {/* Top accent bar */}
      <div className={`h-1 w-full ${
        tick === 'diamond' ? 'bg-gradient-to-r from-violet-500 to-purple-600'
        : tick === 'gold'  ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
        : tick === 'blue'  ? 'bg-gradient-to-r from-blue-500 to-primary-600'
        : 'bg-gradient-to-r from-primary-400 to-primary-600'
      }`} />

      {/* Profile section */}
      <div className="p-4 flex gap-3 items-start">
        {/* Avatar */}
        <Link href={`/agents/${slug}`} className="flex-shrink-0">
          <div className={`relative w-16 h-16 rounded-2xl overflow-hidden ring-2 transition-all ${
            tick === 'diamond' ? 'ring-violet-200 group-hover:ring-violet-400'
            : tick === 'gold'  ? 'ring-amber-200 group-hover:ring-amber-400'
            : 'ring-primary-100 group-hover:ring-primary-300'
          }`}>
            {avatar ? (
              <img
                src={resolveImageUrl(avatar)}
                alt={name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${
                tick === 'diamond' ? 'bg-gradient-to-br from-violet-500 to-purple-700'
                : tick === 'gold'  ? 'bg-gradient-to-br from-amber-400 to-yellow-600'
                : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}>
                {getInitials(name)}
              </div>
            )}
            {/* Tick dot */}
            {tick && (
              <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                tick === 'diamond' ? 'bg-violet-500'
                : tick === 'gold'  ? 'bg-amber-400'
                : 'bg-blue-500'
              }`}>
                <BadgeCheck className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-6">
          <Link
            href={`/agents/${slug}`}
            className="block text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight"
          >
            {name}
          </Link>
          {agent.company && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.company}</p>
          )}
          {(agent.city || agent.state) && (
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {[agent.city, agent.state].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Tick badge */}
          {tCfg && tCfg.label && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${tCfg.cls}`}>
              {tCfg.icon}{tCfg.label}
            </span>
          )}

          {rating > 0 && (
            <div className="mt-1.5">
              <StarRating rating={rating} />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {(exp > 0 || deals > 0 || agent.agentLicense) && (
        <div className="flex items-stretch divide-x divide-gray-100 border-y border-gray-100 mx-4 mb-3 bg-gray-50/80 rounded-xl overflow-hidden">
          {exp > 0 && (
            <div className="flex-1 flex flex-col items-center py-2">
              <Briefcase className="w-3.5 h-3.5 text-primary-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{exp}+</span>
              <span className="text-[10px] text-gray-400">Yrs Exp</span>
            </div>
          )}
          {deals > 0 && (
            <div className="flex-1 flex flex-col items-center py-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{deals}</span>
              <span className="text-[10px] text-gray-400">Deals</span>
            </div>
          )}
          {agent.agentLicense && (
            <div className="flex-1 flex flex-col items-center py-2 min-w-0 px-1">
              <Award className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
              <span className="text-[10px] font-mono text-emerald-700 font-semibold truncate w-full text-center">
                {agent.agentLicense.slice(0, 10)}
              </span>
              <span className="text-[10px] text-gray-400">RERA</span>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {(agent as any).agentBio && (
        <p className="px-4 pb-3 text-[11px] text-gray-500 leading-relaxed line-clamp-2">
          {(agent as any).agentBio}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTAs */}
      <div className="px-4 pb-4 flex gap-2">
        {phone ? (
          <>
            <CallButton
              phone={phone}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />Call
            </CallButton>
            <WhatsAppButton
              phone={clean}
              message={waMsg}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />WhatsApp
            </WhatsAppButton>
          </>
        ) : null}
        <Link
          href={`/agents/${slug}`}
          className={`${phone ? '' : 'flex-1 '}flex items-center justify-center gap-1.5 py-2.5 px-3 border border-gray-200 hover:border-primary-300 text-gray-600 hover:text-primary-600 hover:bg-primary-50 text-xs font-semibold rounded-xl transition-colors`}
        >
          <Users className="w-3.5 h-3.5" />
          {!phone ? 'View Profile' : <ChevronRight className="w-3.5 h-3.5" />}
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse flex flex-col">
      <div className="h-1 bg-gray-100" />
      <div className="p-4 flex gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mt-2" />
        </div>
      </div>
      <div className="mx-4 mb-3 h-14 bg-gray-50 rounded-xl" />
      <div className="px-4 pb-4 flex gap-2">
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="w-10 h-9 bg-gray-100 rounded-xl" />
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
              agentPhone: s.agentPhone, city,
              isPremiumSlot: true, slotNumber: s.slotNumber,
            }))
          : [];

      const topRaw = topResult.status === 'fulfilled'
        ? (topResult.value.data?.agents ?? topResult.value.data?.items ?? topResult.value.data)
        : null;
      const top: FeaturedAgent[] = Array.isArray(topRaw)
        ? topRaw.filter((a: any) => !prem.find(p => p.agentId === a.id)).slice(0, Math.max(0, 6 - prem.length))
        : [];

      setAgents([...prem, ...top]);
    }).finally(() => setLoading(false));
  }, [city]);

  if (!loading && agents.length === 0) return null;

  const cityDisplay = city.charAt(0).toUpperCase() + city.slice(1);
  const citySlug    = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <section className="mt-6 mb-2 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-200">
            <Users className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Top Agents in {cityDisplay}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Featured & verified local experts</p>
          </div>
        </div>
        <Link
          href={`/property-agents-in-${citySlug}`}
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          : agents.map((agent, i) => <AgentCard key={agent.id || i} agent={agent} city={city} />)
        }
      </div>

      {/* Mobile view all + trust bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { icon: <Shield className="w-3.5 h-3.5 text-emerald-500" />, text: 'RERA Verified' },
            { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, text: 'Avg 4.5+ Rating' },
            { icon: <Zap className="w-3.5 h-3.5 text-primary-400" />, text: 'Instant Response' },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500 whitespace-nowrap flex-shrink-0">
              {item.icon}{item.text}
            </span>
          ))}
        </div>
        <Link
          href={`/property-agents-in-${citySlug}`}
          className="sm:hidden flex items-center gap-1 text-xs font-semibold text-primary-600 border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors whitespace-nowrap"
        >
          View all Agents in {cityDisplay} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
