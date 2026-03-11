'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Phone, MapPin, Building2, ArrowRight } from 'lucide-react';
import { usersApi } from '@/lib/api';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  company?: string;
  agentLicense?: string;
  agentBio?: string;
  agentExperience?: number;
  agentRating?: number;
  totalDeals?: number;
}

function AgentCard({ agent }: { agent: Agent }) {
  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{agent.name}</h3>
          {agent.company && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{agent.company}</span>
            </div>
          )}
          {agent.city && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{agent.city}</span>
            </div>
          )}
        </div>
        {agent.agentRating && (
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-700">{agent.agentRating}</span>
          </div>
        )}
      </div>

      {/* Bio */}
      {agent.agentBio && (
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{agent.agentBio}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 py-3 border-y border-gray-50">
        {agent.agentExperience && (
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{agent.agentExperience}+</div>
            <div className="text-xs text-gray-400">Yrs Exp.</div>
          </div>
        )}
        {agent.totalDeals && (
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{agent.totalDeals}</div>
            <div className="text-xs text-gray-400">Deals</div>
          </div>
        )}
        {agent.agentLicense && (
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 mb-0.5">RERA</div>
            <div className="text-xs font-mono text-primary-600 truncate">{agent.agentLicense}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {agent.phone && (
          <a
            href={`tel:${agent.phone}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
        )}
        <Link
          href={`/properties?agentId=${agent.id}`}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          View Listings
        </Link>
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
      .then((r) => setAgents(r.data?.agents || []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && agents.length === 0) return null;

  return (
    <section className="py-14 bg-gray-50">
      <div className="container-max">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Real Estate Agents</h2>
            <p className="text-gray-500 mt-1">Connect with verified RERA-certified agents</p>
          </div>
          <Link
            href="/agents"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View All Agents <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
