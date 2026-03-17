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
  agentTick?: 'none' | 'verified' | 'bronze' | 'silver' | 'gold';
}

function buildAgentSlug(agent: Agent): string {
  const name = agent.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!agent.city) return name;
  const city = agent.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${name}-in-${city}`;
}

const TICK: Record<string, { label: string; cls: string; avatarCls: string }> = {
  verified: { label: '✓ Verified', cls: 'bg-blue-100 text-blue-700 border-blue-200',       avatarCls: 'from-blue-500 to-blue-700'     },
  bronze:   { label: '◉ Bronze',   cls: 'bg-orange-100 text-orange-700 border-orange-200', avatarCls: 'from-orange-400 to-orange-600' },
  silver:   { label: '◈ Silver',   cls: 'bg-slate-100 text-slate-600 border-slate-200',    avatarCls: 'from-slate-400 to-slate-600'   },
  gold:     { label: '★ Gold',     cls: 'bg-amber-100 text-amber-700 border-amber-200',    avatarCls: 'from-amber-400 to-amber-600'   },
};

function AgentCard({ agent }: { agent: Agent }) {
  const initials = agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const slug     = buildAgentSlug(agent);
  const tick     = agent.agentTick && agent.agentTick !== 'none' ? TICK[agent.agentTick] : null;
  const gradient = tick?.avatarCls ?? 'from-primary-500 to-primary-700';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-300 flex flex-col h-full group">
      <Link href={`/agents/${slug}`} className="block p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden shadow-sm relative`}>
            {agent.avatar ? (
              <OptimizedImage src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="48px" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-primary-700 transition-colors leading-tight">
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
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {agent.agentBio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 py-2.5 border-y border-gray-50">
          {(agent.agentExperience ?? 0) > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{agent.agentExperience}+</div>
              <div className="text-[10px] text-gray-400">Yrs Exp</div>
            </div>
          )}
          {(agent.totalDeals ?? 0) > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{agent.totalDeals}</div>
              <div className="text-[10px] text-gray-400">Deals</div>
            </div>
          )}
          {agent.agentLicense && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 mb-0.5">RERA</div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 truncate">
                <Award className="w-2.5 h-2.5 flex-shrink-0" />
                {agent.agentLicense}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 flex-shrink-0">
        {agent.phone && (
          <CallButton
            phone={`+91${agent.phone}`}
            className="flex items-center justify-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
          </CallButton>
        )}
        <Link
          href={`/agents/${slug}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          View Profile
        </Link>
        <Link
          href={`/properties?agentId=${agent.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors flex-shrink-0"
        >
          <Building2 className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function TopAgents() {
  const scrollRef       = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const selectedState   = useAppSelector(s => s.ui.selectedState);
  const selectedStateId = useAppSelector(s => s.ui.selectedStateId);
  const selectedCity    = useAppSelector(s => s.ui.selectedCity);
  const selectedCityId  = useAppSelector(s => s.ui.selectedCityId);

  useEffect(() => { setMounted(true); }, []);

  // Same priority as FeaturedProperties: cityId > city > stateId > state name
  const agentParams: Parameters<typeof usersApi.getAgents>[0] = { limit: 8 };
  if (selectedCityId)       agentParams.cityId  = selectedCityId;
  else if (selectedCity)    agentParams.city    = selectedCity;
  else if (selectedStateId) agentParams.stateId = selectedStateId;
  else if (selectedState)   agentParams.state   = selectedState;

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['home-top-agents', selectedStateId || selectedState, selectedCityId || selectedCity],
    queryFn: () =>
      usersApi.getAgents(agentParams).then(r => r.data?.agents || []),
    staleTime: 3 * 60 * 1000,
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };

  if (!isLoading && agents.length === 0) return null;

  const locationLabel = mounted
    ? (selectedCity ? `in ${selectedCity}` : selectedState ? `in ${selectedState}` : 'across India')
    : 'across India';
  const viewAllHref = mounted && selectedCity
    ? `/agents?city=${encodeURIComponent(selectedCity)}`
    : mounted && selectedState
    ? `/agents?state=${encodeURIComponent(selectedState)}`
    : '/agents';

  return (
    <section className="py-5 sm:py-14 bg-gray-50">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-6 px-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Top Real Estate Agents</h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Verified RERA-certified agents {locationLabel}
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
            <span>📍 Showing agents in <strong>{selectedCity || selectedState}</strong></span>
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
            View All Agents <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
