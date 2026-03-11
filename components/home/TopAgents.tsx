'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Phone, MapPin, Building2, ArrowRight, Award, Users } from 'lucide-react';
import { usersApi } from '@/lib/api';
import OptimizedImage, { resolveImageSrc } from '@/components/common/OptimizedImage';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  state?: string;
  company?: string;
  agentLicense?: string;
  agentBio?: string;
  agentExperience?: number;
  agentRating?: number;
  totalDeals?: number;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
}

// Build correct slug — matches AgentsListingClient and profile page parser
function buildAgentSlug(agent: Agent): string {
  const name = agent.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const city = (agent.city || 'india').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const uid  = agent.id.replace(/-/g, ''); // 32-char hex, parseable on profile page
  return `${name}-in-${city}-${uid}`;
}

const TICK: Record<string, { label: string; cls: string; avatarCls: string }> = {
  blue:    { label: '✓ Verified', cls: 'bg-blue-100 text-blue-700 border-blue-200',       avatarCls: 'from-blue-500 to-blue-700'     },
  gold:    { label: '★ Gold',     cls: 'bg-amber-100 text-amber-700 border-amber-200',     avatarCls: 'from-amber-400 to-amber-600'   },
  diamond: { label: '◆ Diamond',  cls: 'bg-violet-100 text-violet-700 border-violet-200',  avatarCls: 'from-violet-500 to-violet-700' },
};

function AgentCard({ agent }: { agent: Agent }) {
  const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const slug     = buildAgentSlug(agent);
  const tick     = agent.agentTick && agent.agentTick !== 'none' ? TICK[agent.agentTick] : null;
  const gradient = tick?.avatarCls ?? 'from-primary-500 to-primary-700';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-300 flex flex-col h-full group">
      {/* Clickable top area → profile */}
      <Link href={`/agents/${slug}`} className="block p-4 sm:p-5 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 overflow-hidden shadow-sm relative`}>
            {agent.avatar ? (
              <OptimizedImage src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="56px" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-primary-700 transition-colors">
                {agent.name}
              </h3>
              {tick && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tick.cls}`}>
                  {tick.label}
                </span>
              )}
            </div>
            {agent.company && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{agent.company}</span>
              </div>
            )}
            {agent.city && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{agent.city}{agent.state ? `, ${agent.state}` : ''}</span>
              </div>
            )}
          </div>
          {agent.agentRating && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-700">{Number(agent.agentRating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {agent.agentBio && (
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {agent.agentBio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 py-2 sm:py-3 border-y border-gray-50">
          {(agent.agentExperience ?? 0) > 0 && (
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-gray-900">{agent.agentExperience}+</div>
              <div className="text-xs text-gray-400">Yrs Exp.</div>
            </div>
          )}
          {(agent.totalDeals ?? 0) > 0 && (
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-gray-900">{agent.totalDeals}</div>
              <div className="text-xs text-gray-400">Deals</div>
            </div>
          )}
          {agent.agentLicense && (
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-0.5">RERA</div>
              <div className="flex items-center gap-1 text-xs font-mono text-emerald-600 truncate">
                <Award className="w-3 h-3 flex-shrink-0" />
                {agent.agentLicense}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Action buttons */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2 flex-shrink-0">
        {agent.phone && (
          <a
            href={`tel:+91${agent.phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs sm:text-sm font-medium px-3 py-2.5 rounded-xl transition-colors flex-shrink-0"
            title={`Call ${agent.name}`}
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
        )}
        {/* View Profile — prominent */}
        <Link
          href={`/agents/${slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          View Profile
        </Link>
        {/* Listings */}
        <Link
          href={`/properties?agentId=${agent.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs sm:text-sm font-medium px-3 py-2.5 rounded-xl transition-colors flex-shrink-0"
          title="View listings"
        >
          <Building2 className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 animate-pulse flex-shrink-0">
      <div className="flex gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
      </div>
      <div className="h-px bg-gray-100 mb-4" />
      <div className="flex gap-2">
        <div className="h-9 bg-gray-200 rounded-xl w-16" />
        <div className="h-9 bg-gray-200 rounded-xl flex-1" />
      </div>
    </div>
  );
}

export default function TopAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi
      .getAgents({ limit: 6 })
      .then(r => setAgents(r.data?.agents || []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && agents.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-gray-50">
      <div className="container-max">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Top Real Estate Agents</h2>
            <p className="text-gray-500 mt-1 text-sm">Connect with verified RERA-certified agents across India</p>
          </div>
          <Link
            href="/agents"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <>
            <div className="sm:hidden -mx-4">
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[72vw]">
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : (
          <>
            {/* Mobile: horizontal snap scroll */}
            <div className="sm:hidden -mx-4">
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory pb-2">
                {agents.map(agent => (
                  <div key={agent.id} className="flex-shrink-0 w-[78vw] snap-start">
                    <AgentCard agent={agent} />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5">
              {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
            </div>
          </>
        )}

        <div className="text-center mt-5 sm:hidden">
          <Link href="/agents" className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors">
            View All Agents <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
