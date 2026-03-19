'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Gem, MapPin, Star, BadgeCheck, Phone, MessageCircle,
  ChevronRight, Award, Briefcase, TrendingUp, Users,
} from 'lucide-react';
import { agencyApi } from '@/lib/api';
import { resolveImageUrl } from '@/lib/imageUtils';
import { CallButton, WhatsAppButton } from '@/components/common/PhoneRevealButton';

interface DiamondAgent {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  company?: string;
  city?: string;
  state?: string;
  agentRating?: number;
  totalDeals?: number;
  agentExperience?: number;
  agentLicense?: string;
  coverageAreas?: string;
  authorityScore?: number;
}

function buildSlug(a: DiamondAgent) {
  const n = (a.name || 'agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!a.city) return n;
  const c = a.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${n}-in-${c}`;
}

function getInitials(name: string) {
  return (name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

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

function AgentCard({ agent }: { agent: DiamondAgent }) {
  const slug    = buildSlug(agent);
  const phone   = agent.phone?.replace(/[^0-9]/g, '');
  const waMsg   = `Hi ${agent.name.split(' ')[0]}, I found your profile on Think4BuySale. I'm looking for a property.`;
  const rating  = Number(agent.agentRating ?? 0);
  const deals   = agent.totalDeals ?? 0;
  const exp     = agent.agentExperience ?? 0;
  const areas   = agent.coverageAreas
    ? agent.coverageAreas.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="group bg-white rounded-2xl border border-violet-100 shadow-sm hover:shadow-lg hover:border-violet-300 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Top ribbon */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5 text-white" />
          <span className="text-[11px] font-bold text-white tracking-wide uppercase">Diamond Agent</span>
        </div>
        {(agent.authorityScore ?? 0) > 0 && (
          <span className="text-[10px] font-semibold text-violet-200 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />Score {agent.authorityScore}
          </span>
        )}
      </div>

      {/* Profile section */}
      <div className="p-4 flex gap-3 items-start">
        {/* Avatar */}
        <Link href={`/agents/${slug}`} className="flex-shrink-0">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-violet-200 group-hover:ring-violet-400 transition-all">
            {agent.avatar ? (
              <img
                src={resolveImageUrl(agent.avatar)}
                alt={agent.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
                {getInitials(agent.name)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white bg-violet-500 flex items-center justify-center">
              <BadgeCheck className="w-3 h-3 text-white" />
            </span>
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/agents/${slug}`}
            className="block text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors leading-tight truncate"
          >
            {agent.company || agent.name}
          </Link>
          {agent.company && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.name}</p>
          )}
          {(agent.city || agent.state) && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-violet-400 flex-shrink-0" />
              {[agent.city, agent.state].filter(Boolean).join(', ')}
            </p>
          )}
          {rating > 0 && (
            <div className="mt-1.5">
              <StarRating rating={rating} />
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      {(exp > 0 || deals > 0 || agent.agentLicense) && (
        <div className="flex items-stretch divide-x divide-gray-100 border-t border-gray-100 mx-4 mb-3 bg-gray-50 rounded-xl overflow-hidden">
          {exp > 0 && (
            <div className="flex-1 flex flex-col items-center py-2 px-1">
              <Briefcase className="w-3.5 h-3.5 text-violet-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{exp}+</span>
              <span className="text-[10px] text-gray-400">Yrs Exp</span>
            </div>
          )}
          {deals > 0 && (
            <div className="flex-1 flex flex-col items-center py-2 px-1">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400 mb-0.5" />
              <span className="text-sm font-bold text-gray-800">{deals}</span>
              <span className="text-[10px] text-gray-400">Deals</span>
            </div>
          )}
          {agent.agentLicense && (
            <div className="flex-1 flex flex-col items-center py-2 px-1 min-w-0">
              <Award className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
              <span className="text-[10px] font-mono text-emerald-700 font-semibold truncate w-full text-center px-1">
                {agent.agentLicense.slice(0, 10)}
              </span>
              <span className="text-[10px] text-gray-400">RERA</span>
            </div>
          )}
        </div>
      )}

      {/* Coverage areas */}
      {areas.length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-violet-400" />Coverage Areas
          </p>
          <div className="flex flex-wrap gap-1">
            {areas.slice(0, 4).map((area, i) => (
              <span key={i} className="text-[11px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
                {area}
              </span>
            ))}
            {areas.length > 4 && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                +{areas.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Spacer to push CTAs to bottom */}
      <div className="flex-1" />

      {/* CTA buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {phone ? (
          <>
            <CallButton
              phone={agent.phone!}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />Call
            </CallButton>
            <WhatsAppButton
              phone={phone}
              message={waMsg}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />WhatsApp
            </WhatsAppButton>
          </>
        ) : null}
        <Link
          href={`/agents/${slug}`}
          className={`${phone ? '' : 'flex-1 '}flex items-center justify-center gap-1.5 py-2.5 px-3 border border-violet-200 text-violet-700 hover:bg-violet-50 text-xs font-semibold rounded-xl transition-colors`}
        >
          <Users className="w-3.5 h-3.5" />
          {phone ? '' : 'View Profile'}
          {phone && <ChevronRight className="w-3.5 h-3.5" />}
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden animate-pulse">
      <div className="h-8 bg-violet-100" />
      <div className="p-4 flex gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          <div className="h-2.5 bg-gray-100 rounded w-2/3" />
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

interface Props {
  locality?: string;
  city?: string;
  state?: string;
}

export default function DiamondAgentsBanner({ locality, city, state }: Props) {
  const [agents, setAgents]   = useState<DiamondAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locality && !city && !state) { setLoading(false); return; }
    setLoading(true);
    agencyApi.getDiamondAgents({ locality, city, state, limit: 6 })
      .then(r => { const d = r.data; setAgents(Array.isArray(d) ? d : []); })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, [locality, city, state]);

  if (!loading && agents.length === 0) return null;

  const areaLabel   = locality || city || state || '';
  const citySlug    = (city || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const viewAllHref = `/agents?tick=gold${city ? `&city=${encodeURIComponent(city)}` : ''}`;

  return (
    <section className="mt-6 mb-2 px-4 sm:px-0">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-200">
            <Gem className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              Top Diamond Agents
              {areaLabel && <span className="text-violet-600">in {areaLabel}</span>}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Premium verified agents · Highest deal priority</p>
          </div>
        </div>
        <Link
          href={viewAllHref}
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          : agents.map(agent => <AgentCard key={agent.id} agent={agent} />)
        }
      </div>

      {/* Mobile view all + trust bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
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
        <Link
          href={viewAllHref}
          className="sm:hidden flex items-center gap-1 text-xs font-semibold text-violet-600 border border-violet-200 px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors whitespace-nowrap"
        >
          View all Diamond Agents <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
