'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Phone, Star, Award, MessageCircle, ChevronDown, Users } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { locationsApi } from '@/lib/api';
import Link from 'next/link';
import { AgentGridSkeleton, InlineLoader } from '@/components/skeleton';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  company?: string;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
  dealsCount?: number;
  experience?: number;
  reraNumber?: string;
  rating?: number;
  listingsCount?: number;
  bio?: string;
}

const TICK_BADGE: Record<string, { label: string; cls: string; icon: string }> = {
  blue:    { label: 'Verified',   cls: 'bg-blue-100 text-blue-700 border-blue-200',     icon: '✓' },
  gold:    { label: 'Gold',       cls: 'bg-amber-100 text-amber-700 border-amber-200',   icon: '★' },
  diamond: { label: 'Diamond',    cls: 'bg-violet-100 text-violet-700 border-violet-200', icon: '◆' },
};

const TOP_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Noida', 'Kolkata', 'Ahmedabad'];

interface Props {
  searchParams: Record<string, string>;
}

export default function AgentsListingClient({ searchParams }: Props) {
  const router = useRouter();
  const urlParams = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [cityQuery, setCityQuery] = useState(urlParams.get('city') || '');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySug, setShowCitySug] = useState(false);

  const city = urlParams.get('city') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (city) params.city = city;
      const r = await usersApi.getAgents(params);
      const data = r.data;
      setAgents(data?.agents || data?.items || data || []);
      setTotal(data?.total || (data?.agents || data?.items || data || []).length);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [page, city]);

  useEffect(() => { load(); }, [load]);

  const searchCity = async (q: string) => {
    if (q.length < 2) { setCitySuggestions([]); return; }
    try {
      const { data } = await locationsApi.getCities();
      const cities: string[] = (data || []).map((c: any) => c.name || c);
      setCitySuggestions(cities.filter((c: string) => c.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
    } catch { setCitySuggestions([]); }
  };

  const applyCity = (c: string) => {
    setCityQuery(c);
    setShowCitySug(false);
    const p = new URLSearchParams();
    if (c) p.set('city', c);
    router.push(`/agents?${p.toString()}`);
    setPage(1);
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const tickColors = ['none', 'blue', 'gold', 'diamond'];
  const avatarBg: Record<string, string> = { none: 'bg-gray-400', blue: 'bg-blue-500', gold: 'bg-amber-500', diamond: 'bg-violet-600' };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-600 text-white">
        <div className="container-max py-10">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-blue-200" />
            <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">Real Estate Professionals</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            Find Top {city ? `Agents in ${city}` : 'Real Estate Agents'}
          </h1>
          <p className="text-blue-100 text-base max-w-xl">
            Connect with verified agents and brokers across India. Get expert guidance for buying, selling, or renting.
          </p>

          {/* Search bar */}
          <div className="flex gap-3 mt-6 max-w-xl">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setShowCitySug(true);
                  searchCity(e.target.value);
                }}
                onFocus={() => setShowCitySug(true)}
                placeholder="Search by city..."
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-gray-900 text-sm outline-none shadow-lg"
              />
              {showCitySug && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  {citySuggestions.map((c) => (
                    <button key={c} onClick={() => applyCity(c)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 text-left">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />{c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => applyCity(cityQuery)}
              className="px-5 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* City Quick Filters */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container-max py-3 flex gap-2 overflow-x-auto pb-3 no-scrollbar">
          <button
            onClick={() => applyCity('')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!city ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All India
          </button>
          {TOP_CITIES.map((c) => (
            <button
              key={c}
              onClick={() => applyCity(c)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${city === c ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="container-max py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {loading ? (
                <><InlineLoader className="text-gray-400" /><span className="text-gray-400 font-normal text-sm">Finding agents...</span></>
              ) : (
                `${total.toLocaleString('en-IN')} Agents Found`
              )}
            </h2>
            {city && <p className="text-sm text-gray-500">in {city}</p>}
          </div>
        </div>

        {/* Agent Grid */}
        {loading ? (
          <AgentGridSkeleton count={12} />
        ) : agents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Agents Found</h3>
            <p className="text-gray-500 text-sm mb-6">Try searching in a different city or browse all India agents.</p>
            <button
              onClick={() => applyCity('')}
              className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Browse All Agents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => {
              const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK_BADGE[agent.agentTick] : null;
              const bg = avatarBg[agent.agentTick || 'none'];
              return (
                <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 p-5 group">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm ${bg}`}>
                      {getInitials(agent.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{agent.name}</h3>
                        {tick && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tick.cls}`}>
                            {tick.icon} {tick.label}
                          </span>
                        )}
                      </div>
                      {agent.company && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{agent.company}</p>
                      )}
                      {agent.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3" />{agent.city}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-gray-100">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{agent.dealsCount ?? 0}</div>
                      <div className="text-[10px] text-gray-400">Deals</div>
                    </div>
                    <div className="text-center border-x border-gray-100">
                      <div className="text-sm font-bold text-gray-900">{agent.experience ?? 0}+</div>
                      <div className="text-[10px] text-gray-400">Yrs Exp</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">{agent.listingsCount ?? 0}</div>
                      <div className="text-[10px] text-gray-400">Listings</div>
                    </div>
                  </div>

                  {/* Rating */}
                  {agent.rating && (
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(agent.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{agent.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* RERA */}
                  {agent.reraNumber && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-3 w-fit">
                      <Award className="w-3 h-3" />
                      RERA: {agent.reraNumber}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {agent.phone && (
                      <a
                        href={`tel:+91${agent.phone}`}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                    <Link
                      href={`/agents/${agent.name.toLowerCase().replace(/\s+/g, '-')}-in-${(agent.city || 'india').toLowerCase().replace(/\s+/g, '-')}-${agent.id.replace(/-/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors bg-white"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 12)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 12 >= total}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors bg-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
