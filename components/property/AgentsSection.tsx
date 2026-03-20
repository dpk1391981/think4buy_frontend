'use client';

/**
 * AgentsSection — unified diamond + featured agents block shown below listings.
 *
 * Deduplication rules:
 *  - Diamond coverage agents are fetched first and take absolute priority.
 *  - If a sponsored/premium slot agent is also in diamond coverage → shown only
 *    in the Diamond block (with an extra "Sponsored" pill) — never duplicated.
 *  - If a top-agents result is already in diamond → excluded from Featured block.
 *  - Diamond agents sorted by authorityScore desc; Featured by sponsored first → rating.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Gem, MapPin, Star, BadgeCheck, Phone, ChevronRight,
  Award, Briefcase, TrendingUp, Users, Shield, Zap, Crown,
} from 'lucide-react';
import { agencyApi, usersApi } from '@/lib/api';
import { resolveImageUrl } from '@/lib/imageUtils';
import { CallButton, WhatsAppButton, WhatsAppIcon } from '@/components/common/PhoneRevealButton';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Agent {
  /** Normalised user-level ID (used for dedup) */
  userId: string;
  /** Agent profile ID */
  agentProfileId?: string;
  name: string;
  phone?: string;
  avatar?: string;
  company?: string;
  city?: string;
  state?: string;
  tick?: 'none' | 'verified' | 'bronze' | 'silver' | 'gold';
  rating: number;
  deals: number;
  experience: number;
  license?: string;
  bio?: string;
  coverageAreas?: string[];
  authorityScore: number;
  /** true = this agent came from coverage (gold/silver/bronze/verified) */
  isDiamond: boolean;
  /** true = occupies a paid premium slot */
  isSponsored: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slug(name: string, city?: string) {
  const n = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!city) return n;
  const c = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${n}/${c}`;
}

function initials(name: string) {
  return (name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const TICK = {
  gold:     { label: 'Gold',     bg: 'bg-amber-100 text-amber-700 border-amber-200',     dot: 'bg-amber-400'   },
  silver:   { label: 'Silver',   bg: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400'   },
  bronze:   { label: 'Bronze',   bg: 'bg-orange-100 text-orange-700 border-orange-200',  dot: 'bg-orange-400'  },
  verified: { label: 'Verified', bg: 'bg-blue-100 text-blue-700 border-blue-200',        dot: 'bg-blue-500'    },
  none:     { label: '',         bg: '',                                                  dot: 'bg-gray-300'    },
};

function Stars({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, rating));
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="ml-1 text-xs font-bold text-gray-700">{r.toFixed(1)}</span>
    </span>
  );
}

// ── Gold/coverage card (formerly DiamondCard) ──────────────────────────────────

function DiamondCard({ agent, city }: { agent: Agent; city: string }) {
  const agentSlug = slug(agent.name, agent.city);
  const phone     = agent.phone?.replace(/[^0-9]/g, '') ?? '';
  const waMsg     = `Hi ${agent.name.split(' ')[0]}, I found your profile on Think4BuySale. Looking for property in ${city}.`;
  const tick      = agent.tick && agent.tick !== 'none' ? agent.tick : 'gold';
  const ribbonCls = tick === 'gold'
    ? 'from-amber-500 via-yellow-500 to-amber-600'
    : tick === 'silver' ? 'from-slate-500 via-slate-400 to-slate-600'
    : tick === 'bronze' ? 'from-orange-500 via-orange-400 to-orange-600'
    : 'from-blue-500 via-blue-400 to-blue-600';
  const ringCls   = tick === 'gold' ? 'ring-amber-200 group-hover:ring-amber-400'
    : tick === 'silver' ? 'ring-slate-200 group-hover:ring-slate-400'
    : tick === 'bronze' ? 'ring-orange-200 group-hover:ring-orange-400'
    : 'ring-blue-200 group-hover:ring-blue-400';
  const avatarBg  = tick === 'gold' ? 'from-amber-400 to-yellow-600'
    : tick === 'silver' ? 'from-slate-400 to-slate-600'
    : tick === 'bronze' ? 'from-orange-400 to-orange-600'
    : 'from-blue-400 to-blue-600';
  const badgeBg   = tick === 'gold' ? 'bg-amber-500' : tick === 'silver' ? 'bg-slate-400' : tick === 'bronze' ? 'bg-orange-500' : 'bg-blue-500';
  const tickLabel = tick === 'gold' ? 'Gold Agent' : tick === 'silver' ? 'Silver Agent' : tick === 'bronze' ? 'Bronze Agent' : 'Verified Agent';
  const scoreColor = tick === 'gold' ? 'text-amber-200' : tick === 'silver' ? 'text-slate-200' : tick === 'bronze' ? 'text-orange-200' : 'text-blue-200';
  const hoverCls  = tick === 'gold' ? 'border-amber-200 hover:shadow-amber-100 hover:border-amber-400'
    : tick === 'silver' ? 'border-slate-200 hover:shadow-slate-100 hover:border-slate-400'
    : tick === 'bronze' ? 'border-orange-200 hover:shadow-orange-100 hover:border-orange-400'
    : 'border-blue-200 hover:shadow-blue-100 hover:border-blue-400';
  const coverageTagCls = tick === 'gold' ? 'bg-amber-50 text-amber-700 border-amber-100'
    : tick === 'silver' ? 'bg-slate-50 text-slate-600 border-slate-100'
    : tick === 'bronze' ? 'bg-orange-50 text-orange-700 border-orange-100'
    : 'bg-blue-50 text-blue-700 border-blue-100';
  const profileHoverCls = tick === 'gold' ? 'group-hover:text-amber-700' : tick === 'silver' ? 'group-hover:text-slate-700' : tick === 'bronze' ? 'group-hover:text-orange-700' : 'group-hover:text-blue-700';

  return (
    <div className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${hoverCls}`}>

      {/* Sponsored overlay badge */}
      {agent.isSponsored && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          <Zap className="w-2.5 h-2.5" />SPONSORED
        </div>
      )}

      {/* Top ribbon */}
      <div className={`bg-gradient-to-r ${ribbonCls} px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-white/70" />
          <span className="text-[11px] font-bold text-white tracking-wide uppercase">{tickLabel}</span>
        </div>
        {agent.authorityScore > 0 && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${scoreColor}`}>
            <Crown className="w-3 h-3" />Score {agent.authorityScore}
          </span>
        )}
      </div>

      {/* Profile */}
      <div className="p-4 flex gap-3 items-start">
        <Link href={`/agents/${agentSlug}`} className="flex-shrink-0">
          <div className={`relative w-[68px] h-[68px] rounded-2xl overflow-hidden ring-2 ${ringCls} transition-all duration-300`}>
            {agent.avatar
              ? <img src={resolveImageUrl(agent.avatar)} alt={agent.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <div className={`w-full h-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-xl`}>{initials(agent.name)}</div>
            }
            <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white ${badgeBg} flex items-center justify-center`}>
              <BadgeCheck className="w-3 h-3 text-white" />
            </span>
          </div>
        </Link>

        <div className="flex-1 min-w-0 pt-0.5" style={{ paddingRight: agent.isSponsored ? '72px' : '0' }}>
          <Link href={`/agents/${agentSlug}`} className={`block text-sm font-bold text-gray-900 ${profileHoverCls} transition-colors leading-snug`}>
            {agent.company || agent.name}
          </Link>
          {agent.company && <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.name}</p>}
          {(agent.city || agent.state) && (
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              {[agent.city, agent.state].filter(Boolean).join(', ')}
            </p>
          )}
          {agent.rating > 0 && <div className="mt-1.5"><Stars rating={agent.rating} /></div>}
        </div>
      </div>

      {/* Stats */}
      {(agent.experience > 0 || agent.deals > 0 || agent.license) && (
        <div className="flex items-stretch divide-x divide-gray-100 border-y border-gray-100 mx-4 mb-3 bg-gray-50/60 rounded-xl overflow-hidden">
          {agent.experience > 0 && (
            <div className="flex-1 flex flex-col items-center py-2.5">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{agent.experience}+</span>
              <span className="text-[10px] text-gray-500">Yrs Exp</span>
            </div>
          )}
          {agent.deals > 0 && (
            <div className="flex-1 flex flex-col items-center py-2.5">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{agent.deals}</span>
              <span className="text-[10px] text-gray-500">Deals</span>
            </div>
          )}
          {agent.license && (
            <div className="flex-1 flex flex-col items-center py-2.5 min-w-0 px-1">
              <Award className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
              <span className="text-[10px] font-mono text-emerald-700 font-semibold truncate w-full text-center">{agent.license.slice(0, 10)}</span>
              <span className="text-[10px] text-gray-500">RERA</span>
            </div>
          )}
        </div>
      )}

      {/* Coverage areas */}
      {(agent.coverageAreas?.length ?? 0) > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />Coverage
          </p>
          <div className="flex flex-wrap gap-1">
            {agent.coverageAreas!.slice(0, 4).map((a, i) => (
              <span key={i} className={`text-[11px] border px-2 py-0.5 rounded-full font-medium ${coverageTagCls}`}>{a}</span>
            ))}
            {agent.coverageAreas!.length > 4 && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{agent.coverageAreas!.length - 4}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* CTAs */}
      <div className="px-4 pb-4 flex gap-2">
        {agent.phone && (
          <>
            <CallButton phone={agent.phone} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors">
              <Phone className="w-3.5 h-3.5" />Call
            </CallButton>
            <WhatsAppButton phone={phone} message={waMsg} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold rounded-xl transition-colors">
              <WhatsAppIcon className="w-3.5 h-3.5" />WhatsApp
            </WhatsAppButton>
          </>
        )}
        <Link href={`/agents/${agentSlug}`} className={`${agent.phone ? '' : 'flex-1 '}flex items-center justify-center gap-1 py-2.5 px-3 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-colors`}>
          <Users className="w-3.5 h-3.5" />{agent.phone ? <ChevronRight className="w-3.5 h-3.5" /> : 'View Profile'}
        </Link>
      </div>
    </div>
  );
}

// ── Featured card ──────────────────────────────────────────────────────────────

function FeaturedCard({ agent, city }: { agent: Agent; city: string }) {
  const agentSlug = slug(agent.name, agent.city);
  const phone     = agent.phone?.replace(/[^0-9]/g, '') ?? '';
  const waMsg     = `Hi ${agent.name.split(' ')[0]}, I found your profile on Think4BuySale. Looking for property in ${city}.`;
  const tick      = agent.tick && agent.tick !== 'none' ? agent.tick : null;
  const tCfg      = tick ? TICK[tick] : null;

  const accentCls = tick === 'gold'     ? 'from-amber-400 to-yellow-500'
    : tick === 'silver'  ? 'from-slate-400 to-slate-500'
    : tick === 'bronze'  ? 'from-orange-400 to-orange-500'
    : tick === 'verified' ? 'from-blue-500 to-primary-600'
    : 'from-primary-400 to-primary-600';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-200 overflow-hidden flex flex-col relative">

      {agent.isSponsored && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          <Zap className="w-2.5 h-2.5" />FEATURED
        </div>
      )}

      {/* Accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accentCls}`} />

      {/* Profile */}
      <div className="p-4 flex gap-3 items-start">
        <Link href={`/agents/${agentSlug}`} className="flex-shrink-0">
          <div className={`relative w-[68px] h-[68px] rounded-2xl overflow-hidden ring-2 transition-all duration-200 ${
            tick === 'gold'    ? 'ring-amber-200 group-hover:ring-amber-400'
            : tick === 'silver'  ? 'ring-slate-200 group-hover:ring-slate-400'
            : tick === 'bronze'  ? 'ring-orange-200 group-hover:ring-orange-400'
            : tick === 'verified' ? 'ring-blue-200 group-hover:ring-blue-400'
            : 'ring-primary-100 group-hover:ring-primary-300'
          }`}>
            {agent.avatar
              ? <img src={resolveImageUrl(agent.avatar)} alt={agent.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br ${
                  tick === 'gold'   ? 'from-amber-400 to-yellow-600'
                  : tick === 'silver' ? 'from-slate-400 to-slate-600'
                  : tick === 'bronze' ? 'from-orange-400 to-orange-600'
                  : 'from-primary-500 to-primary-700'
                }`}>{initials(agent.name)}</div>
            }
            {tick && (
              <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${tCfg!.dot}`}>
                <BadgeCheck className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0 pt-0.5" style={{ paddingRight: agent.isSponsored ? '72px' : '0' }}>
          <Link href={`/agents/${agentSlug}`} className="block text-sm font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
            {agent.company || agent.name}
          </Link>
          {agent.company && <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.name}</p>}
          {(agent.city || agent.state) && (
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {[agent.city, agent.state].filter(Boolean).join(', ')}
            </p>
          )}
          {tick && tCfg?.label && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${tCfg.bg}`}>
              <BadgeCheck className="w-3 h-3" />{tCfg.label}
            </span>
          )}
          {agent.rating > 0 && <div className="mt-1.5"><Stars rating={agent.rating} /></div>}
        </div>
      </div>

      {/* Stats */}
      {(agent.experience > 0 || agent.deals > 0 || agent.license) && (
        <div className="flex items-stretch divide-x divide-gray-100 border-y border-gray-100 mx-4 mb-3 bg-gray-50/80 rounded-xl overflow-hidden">
          {agent.experience > 0 && (
            <div className="flex-1 flex flex-col items-center py-2.5">
              <Briefcase className="w-3.5 h-3.5 text-primary-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{agent.experience}+</span>
              <span className="text-[10px] text-gray-500">Yrs Exp</span>
            </div>
          )}
          {agent.deals > 0 && (
            <div className="flex-1 flex flex-col items-center py-2.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{agent.deals}</span>
              <span className="text-[10px] text-gray-500">Deals</span>
            </div>
          )}
          {agent.license && (
            <div className="flex-1 flex flex-col items-center py-2.5 min-w-0 px-1">
              <Award className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
              <span className="text-[10px] font-mono text-emerald-700 font-semibold truncate w-full text-center">{agent.license.slice(0, 10)}</span>
              <span className="text-[10px] text-gray-500">RERA</span>
            </div>
          )}
        </div>
      )}


      <div className="flex-1" />

      {/* CTAs */}
      <div className="px-4 pb-4 flex gap-2">
        {agent.phone && (
          <>
            <CallButton phone={agent.phone} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors">
              <Phone className="w-3.5 h-3.5" />Call
            </CallButton>
            <WhatsAppButton phone={phone} message={waMsg} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold rounded-xl transition-colors">
              <WhatsAppIcon className="w-3.5 h-3.5" />WhatsApp
            </WhatsAppButton>
          </>
        )}
        <Link href={`/agents/${agentSlug}`} className={`${agent.phone ? '' : 'flex-1 '}flex items-center justify-center gap-1 py-2.5 px-3 border border-gray-200 hover:border-primary-300 text-gray-600 hover:text-primary-600 hover:bg-primary-50 text-xs font-semibold rounded-xl transition-colors`}>
          <Users className="w-3.5 h-3.5" />{agent.phone ? <ChevronRight className="w-3.5 h-3.5" /> : 'View Profile'}
        </Link>
      </div>
    </div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard({ diamond = false }: { diamond?: boolean }) {
  return (
    <div className={`rounded-2xl border overflow-hidden animate-pulse flex flex-col bg-white ${diamond ? 'border-amber-100' : 'border-gray-100'}`}>
      <div className={`h-9 ${diamond ? 'bg-amber-100' : 'h-1 bg-gray-100'}`} />
      <div className="p-4 flex gap-3">
        <div className="w-[68px] h-[68px] rounded-2xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mt-2" />
        </div>
      </div>
      <div className="mx-4 mb-3 h-[58px] bg-gray-50 rounded-xl" />
      <div className="px-4 pb-4 flex gap-2">
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="w-10 h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  locality?: string;
  city?: string;
  state?: string;
}

export default function AgentsSection({ locality, city, state }: Props) {
  const [diamondAgents,  setDiamondAgents]  = useState<Agent[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locality && !city && !state) { setLoading(false); return; }
    setLoading(true);

    Promise.allSettled([
      // 1. Diamond coverage agents
      agencyApi.getDiamondAgents({ locality, city, state, limit: 9 }),
      // 2. Premium (sponsored) slot agents
      city ? agencyApi.getPremiumAgents(city) : Promise.resolve({ data: [] }),
      // 3. General top agents
      city ? usersApi.getAgents({ city, limit: 12 } as any) : Promise.resolve({ data: [] }),
    ]).then(([diamondRes, premRes, topRes]) => {

      // ── Normalise diamond agents ──
      const rawDiamond: any[] =
        diamondRes.status === 'fulfilled' && Array.isArray(diamondRes.value.data)
          ? diamondRes.value.data : [];

      const diamond: Agent[] = rawDiamond.map(a => ({
        userId:         a.id,
        agentProfileId: a.agentProfileId,
        name:           a.name || 'Agent',
        phone:          a.phone,
        avatar:         a.avatar,
        company:        a.company,
        city:           a.city,
        state:          a.state,
        tick:           a.agentTick ?? 'gold',
        rating:         Number(a.agentRating ?? 0),
        deals:          a.totalDeals ?? 0,
        experience:     a.agentExperience ?? 0,
        license:        a.agentLicense,
        coverageAreas:  a.coverageAreas
          ? a.coverageAreas.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        authorityScore: Number(a.authorityScore ?? 0),
        isDiamond:      true,
        isSponsored:    false,
      }));

      // ── Normalise premium slot agents ──
      const rawPrem: any[] =
        premRes.status === 'fulfilled' && Array.isArray(premRes.value.data)
          ? premRes.value.data : [];

      // ── Normalise top agents ──
      const topRaw = topRes.status === 'fulfilled'
        ? (topRes.value.data?.agents ?? topRes.value.data?.items ?? topRes.value.data)
        : null;
      const rawTop: any[] = Array.isArray(topRaw) ? topRaw : [];

      // ── Build dedup set from diamond (by userId) ──
      const diamondIds = new Set(diamond.map(a => a.userId));

      // ── Process premium slots: if already in diamond → mark diamond as sponsored ──
      const premIds = new Set<string>();
      for (const p of rawPrem) {
        const uid = p.agentId || p.id;
        if (diamondIds.has(uid)) {
          // Upgrade the diamond agent with sponsored flag
          const da = diamond.find(a => a.userId === uid);
          if (da) da.isSponsored = true;
        } else {
          premIds.add(uid);
        }
      }

      // Build featured list from premium slots (non-diamond)
      const featuredMap = new Map<string, Agent>();
      for (const p of rawPrem) {
        const uid = p.agentId || p.id;
        if (diamondIds.has(uid)) continue; // already in diamond
        if (featuredMap.has(uid)) continue;
        featuredMap.set(uid, {
          userId:         uid,
          agentProfileId: p.agentId,
          name:           p.agentName || p.name || 'Agent',
          phone:          p.agentPhone || p.phone,
          avatar:         p.agentAvatar || p.avatar,
          company:        p.company,
          city:           p.city || city,
          state:          p.state,
          tick:           p.agentTick ?? 'none',
          rating:         Number(p.agentRating ?? 0),
          deals:          p.totalDeals ?? 0,
          experience:     p.agentExperience ?? 0,
          license:        p.agentLicense,
          bio:            p.agentBio,
          coverageAreas:  [],
          authorityScore: Number(p.authorityScore ?? 0),
          isDiamond:      false,
          isSponsored:    true,
        });
      }

      // Add top agents (non-diamond, non-premium)
      for (const a of rawTop) {
        const uid = a.id;
        if (diamondIds.has(uid) || featuredMap.has(uid)) continue;
        featuredMap.set(uid, {
          userId:         uid,
          agentProfileId: a.agentProfileId,
          name:           a.name || 'Agent',
          phone:          a.phone,
          avatar:         a.avatar,
          company:        a.company,
          city:           a.city,
          state:          a.state,
          tick:           a.agentTick ?? 'none',
          rating:         Number(a.agentRating ?? 0),
          deals:          a.totalDeals ?? 0,
          experience:     a.agentExperience ?? 0,
          license:        a.agentLicense,
          bio:            a.agentBio,
          coverageAreas:  [],
          authorityScore: Number(a.authorityScore ?? 0),
          isDiamond:      false,
          isSponsored:    false,
        });
      }

      // ── Sort ──
      // Diamond: sponsored first, then authorityScore desc
      diamond.sort((a, b) => {
        if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
        return b.authorityScore - a.authorityScore;
      });

      // Featured: sponsored first, then badge tier, then rating
      const featured = Array.from(featuredMap.values()).sort((a, b) => {
        if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
        const tickOrder: Record<string, number> = { gold: 4, silver: 3, bronze: 2, verified: 1, none: 0 };
        const ta = tickOrder[a.tick ?? 'none'] ?? 0, tb = tickOrder[b.tick ?? 'none'] ?? 0;
        if (ta !== tb) return tb - ta;
        return b.rating - a.rating;
      });

      setDiamondAgents(diamond.slice(0, 6));
      setFeaturedAgents(featured.slice(0, 6));
    }).finally(() => setLoading(false));
  }, [locality, city, state]);

  const hasDiamond  = loading || diamondAgents.length > 0;
  const hasFeatured = loading || featuredAgents.length > 0;
  if (!hasDiamond && !hasFeatured) return null;

  const areaLabel  = locality || city || state || '';
  const cityDisp   = city ? city.charAt(0).toUpperCase() + city.slice(1) : '';
  const citySlug   = (city || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const diamondUrl = `/agents?tick=gold${city ? `&city=${encodeURIComponent(city)}` : ''}`;
  const allUrl     = `/property-agents-in-${citySlug}`;

  return (
    <div className="mt-6 space-y-8 px-4 sm:px-0">

      {/* ── Coverage agents section ─────────────────────────────────── */}
      {hasDiamond && (
        <section>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md shadow-amber-200 flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  Top Agents
                  {areaLabel && <span className="text-amber-600 font-semibold">in {areaLabel}</span>}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Gold · Silver · Bronze · Verified — Area coverage experts</p>
              </div>
            </div>
            <Link href={diamondUrl} className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors whitespace-nowrap">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? [0,1,2].map(i => <SkeletonCard key={i} diamond />)
              : diamondAgents.map(a => <DiamondCard key={a.userId} agent={a} city={city || ''} />)
            }
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-5 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
              {[
                { icon: <Gem className="w-3.5 h-3.5 text-violet-500" />, text: 'Diamond Certified' },
                { icon: <MapPin className="w-3.5 h-3.5 text-violet-400" />, text: 'Multi-locality Coverage' },
                { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, text: 'Priority Lead Routing' },
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500 whitespace-nowrap flex-shrink-0">
                  {item.icon}{item.text}
                </span>
              ))}
            </div>
            <Link href={diamondUrl} className="sm:hidden flex items-center gap-1 text-xs font-semibold text-amber-600 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors whitespace-nowrap">
              View all Top Agents <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Featured / Top agents section ──────────────────────────── */}
      {hasFeatured && (
        <section>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-200 flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Top Agents{cityDisp ? ` in ${cityDisp}` : ''}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Featured & verified local property experts</p>
              </div>
            </div>
            {citySlug && (
              <Link href={allUrl} className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? [0,1,2].map(i => <SkeletonCard key={i} />)
              : featuredAgents.map(a => <FeaturedCard key={a.userId} agent={a} city={city || ''} />)
            }
          </div>

          {citySlug && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-5 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
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
              <Link href={allUrl} className="sm:hidden flex items-center gap-1 text-xs font-semibold text-primary-600 border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors whitespace-nowrap">
                View all Agents{cityDisp ? ` in ${cityDisp}` : ''} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
