'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, MapPin, Phone, Star, Shield, CheckCircle, Building2,
  Briefcase, TrendingUp, ChevronRight, ChevronDown, ChevronLeft,
  X, Users, MessageCircle, SlidersHorizontal, BadgeCheck,
  Home, Handshake, Quote, Sparkles,
} from 'lucide-react';
import { usersApi, locationsApi } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  company?: string;
  isVerified?: boolean;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
  agentRating?: number;
  agentExperience?: number;
  agentLicense?: string;
  agentBio?: string;
  totalDeals?: number;
  agentUsedQuota?: number;
  createdAt?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TICK: Record<string, { label: string; cls: string; icon: string; grad: string; dot: string }> = {
  blue:    { label: 'Verified',  cls: 'bg-blue-50 text-blue-700 border-blue-200',      icon: '✓', grad: 'from-blue-500 to-blue-700',    dot: 'bg-blue-500'   },
  gold:    { label: 'Gold',      cls: 'bg-amber-50 text-amber-700 border-amber-200',    icon: '★', grad: 'from-amber-400 to-amber-600',   dot: 'bg-amber-400'  },
  diamond: { label: 'Diamond',   cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: '◆', grad: 'from-violet-500 to-violet-700', dot: 'bg-violet-500' },
};

const SORT_OPTIONS = [
  { value: 'rating',     label: 'Top Rated'        },
  { value: 'deals',      label: 'Most Deals'        },
  { value: 'experience', label: 'Most Experienced'  },
  { value: 'listings',   label: 'Most Listings'     },
  { value: 'newest',     label: 'Recently Joined'   },
];

const BADGE_OPTIONS = [
  { value: 'blue',    label: '✓ Verified' },
  { value: 'gold',    label: '★ Gold'     },
  { value: 'diamond', label: '◆ Diamond'  },
];

const EXP_OPTIONS = [
  { value: '',   label: 'Any'     },
  { value: '1',  label: '1+ yrs'  },
  { value: '3',  label: '3+ yrs'  },
  { value: '5',  label: '5+ yrs'  },
  { value: '10', label: '10+ yrs' },
];

const DEALS_OPTIONS = [
  { value: '',   label: 'Any'   },
  { value: '5',  label: '5+'    },
  { value: '10', label: '10+'   },
  { value: '25', label: '25+'   },
  { value: '50', label: '50+'   },
];

const TOP_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Noida', 'Kolkata', 'Ahmedabad'];

const LIMIT = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSlug(a: Agent) {
  const n = (a.name || 'agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const c = (a.city || 'india').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${n}-in-${c}-${a.id.replace(/-/g, '')}`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function clientSort(agents: Agent[], by: string) {
  return [...agents].sort((a, b) => {
    if (by === 'rating')     return (b.agentRating ?? 0) - (a.agentRating ?? 0);
    if (by === 'deals')      return (b.totalDeals ?? 0) - (a.totalDeals ?? 0);
    if (by === 'experience') return (b.agentExperience ?? 0) - (a.agentExperience ?? 0);
    if (by === 'listings')   return (b.agentUsedQuota ?? 0) - (a.agentUsedQuota ?? 0);
    if (by === 'newest')     return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    return 0;
  });
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  );
}

function Avatar({ agent, size = 'lg' }: { agent: Agent; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-11 h-11 text-sm rounded-xl', md: 'w-14 h-14 text-base rounded-2xl', lg: 'w-[72px] h-[72px] text-lg rounded-2xl' }[size];
  const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK[agent.agentTick] : null;
  const grad = tick?.grad ?? 'from-slate-400 to-slate-600';
  if (agent.avatar) return <img src={agent.avatar} alt={agent.name} className={`${sz} object-cover flex-shrink-0 shadow-sm`} />;
  return (
    <div className={`${sz} bg-gradient-to-br ${grad} flex items-center justify-center text-white font-extrabold flex-shrink-0 shadow-sm`}>
      {getInitials(agent.name)}
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, rank }: { agent: Agent; rank?: number }) {
  const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK[agent.agentTick] : null;
  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-200 overflow-hidden">
      <div className={`h-0.5 ${tick ? `bg-gradient-to-r ${tick.grad}` : 'bg-gray-100'}`} />
      <div className="p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar agent={agent} />
            {rank && rank <= 3 && (
              <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow ${rank === 1 ? 'bg-amber-400' : rank === 2 ? 'bg-gray-400' : 'bg-amber-700'}`}>
                #{rank}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <h2 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-primary-600 transition-colors">
                <Link href={`/agents/${buildSlug(agent)}`} className="hover:underline underline-offset-2">
                  {agent.name}
                </Link>
              </h2>
              {agent.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  <CheckCircle className="w-2.5 h-2.5" />Verified
                </span>
              )}
              {tick && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${tick.cls}`}>
                  {tick.icon} {tick.label}
                </span>
              )}
            </div>

            {/* Company + Location */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mb-2 text-xs text-gray-400">
              {agent.company && <span className="text-gray-600 font-medium">{agent.company}</span>}
              {(agent.city || agent.state) && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {[agent.city, agent.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-xs">
                <TrendingUp className="w-3 h-3 text-primary-500 flex-shrink-0" />
                <b className="text-gray-800">{agent.totalDeals ?? 0}</b><span className="text-gray-400">deals</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-xs">
                <Briefcase className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <b className="text-gray-800">{agent.agentExperience ?? 0}+</b><span className="text-gray-400">yrs</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-xs">
                <Building2 className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <b className="text-gray-800">{agent.agentUsedQuota ?? 0}</b><span className="text-gray-400">listings</span>
              </span>
              {(agent.agentRating ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-xs">
                  <Stars rating={Number(agent.agentRating)} size="xs" />
                  <b className="text-amber-700">{Number(agent.agentRating).toFixed(1)}</b>
                </span>
              )}
            </div>

            {/* RERA */}
            {agent.agentLicense && (
              <p className="flex items-center gap-1 text-xs text-emerald-700 font-medium mb-1.5">
                <Shield className="w-3 h-3 flex-shrink-0" />
                RERA: <span className="font-mono">{agent.agentLicense}</span>
              </p>
            )}

            {/* Bio */}
            {agent.agentBio && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{agent.agentBio}</p>
            )}
          </div>

          {/* Right CTA — desktop */}
          <div className="hidden sm:flex flex-col gap-2 flex-shrink-0 w-[108px]">
            {agent.phone ? (
              <a href={`tel:+91${agent.phone}`} onClick={e => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors">
                <Phone className="w-3.5 h-3.5" /> Call Now
              </a>
            ) : (
              <Link href={`/agents/${buildSlug(agent)}`}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Contact
              </Link>
            )}
            <Link href={`/agents/${buildSlug(agent)}`}
              className="flex items-center justify-center gap-1 py-2.5 border border-gray-200 hover:border-primary-300 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl text-xs font-semibold transition-colors">
              Profile <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Mobile CTA strip */}
        <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {agent.phone && (
            <a href={`tel:+91${agent.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          )}
          <Link href={`/agents/${buildSlug(agent)}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50">
            View Profile <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-[72px] h-[72px] bg-gray-200 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex gap-2"><div className="h-4 bg-gray-200 rounded w-36" /><div className="h-4 bg-gray-200 rounded w-14" /></div>
          <div className="h-3 bg-gray-200 rounded w-44" />
          <div className="flex gap-1.5">
            <div className="h-6 bg-gray-200 rounded-lg w-20" />
            <div className="h-6 bg-gray-200 rounded-lg w-20" />
            <div className="h-6 bg-gray-200 rounded-lg w-20" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-full max-w-xs" />
        </div>
        <div className="hidden sm:flex flex-col gap-2 w-[108px]">
          <div className="h-9 bg-gray-200 rounded-xl" />
          <div className="h-9 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Filter Sidebar Section ────────────────────────────────────────────────────

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-800">
        {title}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-4 h-10 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 hover:text-primary-600 bg-white transition-colors">
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
          : (
            <button key={p} onClick={() => onChange(p as number)}
              className={cn('w-10 h-10 rounded-xl text-sm font-medium transition-colors', p === page
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600')}>
              {p}
            </button>
          )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="px-4 h-10 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 hover:text-primary-600 bg-white transition-colors">
        Next →
      </button>
    </div>
  );
}

// ── SEO bottom sections ───────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: '01', icon: <Search className="w-5 h-5" />, title: 'Search by City', desc: 'Enter your city or locality to discover top-rated agents in your area.' },
  { step: '02', icon: <Users className="w-5 h-5" />, title: 'Compare Profiles', desc: 'Review agent ratings, deals closed, experience years, RERA numbers and verified reviews.' },
  { step: '03', icon: <Phone className="w-5 h-5" />, title: 'Connect for Free', desc: 'Call or message the agent directly at zero cost. No middlemen, no hidden fees.' },
  { step: '04', icon: <Handshake className="w-5 h-5" />, title: 'Close Your Deal', desc: 'Expert guidance from shortlisting to registration. Your agent handles everything.' },
];

const WHY_CHOOSE = [
  { icon: <BadgeCheck className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100', title: 'RERA Verified Agents', desc: 'Every agent must submit their RERA registration. We verify credentials before granting the Verified badge.' },
  { icon: <Star className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50 border-amber-100', title: 'Authentic Reviews', desc: 'Ratings come only from verified clients who have actually worked with the agent. Zero fake reviews.' },
  { icon: <Shield className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 border-blue-100', title: 'Transparent Fees', desc: 'Agent brokerage details are disclosed upfront. No shock fees at the time of registration.' },
  { icon: <Sparkles className="w-5 h-5 text-violet-600" />, bg: 'bg-violet-50 border-violet-100', title: 'All Property Types', desc: 'Whether buying a flat, renting an office or selling a plot — find specialists for every category.' },
];

const TESTIMONIALS = [
  { text: 'Found my dream 3BHK in Pune in 2 weeks. The agent was professional and super responsive.', name: 'Priya Sharma', city: 'Pune', rating: 5 },
  { text: 'Sold my property at the best price. The agent handled all documentation and negotiations perfectly.', name: 'Rajesh Kumar', city: 'Mumbai', rating: 5 },
  { text: 'As a first-time buyer, the agent guided me through every step. Complete transparency, no hidden charges.', name: 'Ananya Singh', city: 'Bangalore', rating: 5 },
];

const FAQ = [
  { q: 'How do I find a verified real estate agent in India?', a: 'Use the search bar to filter agents by city. Look for the Verified (✓) or RERA badge on profiles, which confirms the agent has been background-checked by Think4BuySale.' },
  { q: 'Are agents on Think4BuySale RERA registered?', a: 'Yes. All listed agents must submit their RERA number during registration. Agents with the Verified badge have had their documents reviewed by our team. The RERA number is visible on every agent profile.' },
  { q: 'Is it free to contact a real estate agent?', a: 'Absolutely. Connecting with any agent on Think4BuySale is completely free. Simply call or message them directly from their profile. No subscription or inquiry fees for buyers and sellers.' },
  { q: 'How are agent ratings calculated?', a: 'Agent ratings are based on reviews submitted by verified clients — buyers, sellers and renters who have actually worked with the agent. Each review includes a 1–5 star rating and the average is updated automatically after every new review.' },
  { q: 'Can I find agents for commercial properties?', a: 'Yes. Think4BuySale agents cover all categories including apartments, villas, plots, commercial offices, shops, warehouses and PG accommodations. Browse agent profiles to find specialists for your requirement.' },
  { q: 'What is the difference between Verified, Gold and Diamond agents?', a: 'Verified agents have confirmed RERA registration. Gold agents additionally have a proven track record of high deal volume and strong ratings. Diamond is the highest tier, awarded to agents with exceptional performance, tenure and reviews.' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function AgentsListingClient({
  searchParams: _sp,
  city: serverCity = '',
}: {
  searchParams: Record<string, string>;
  city?: string;
}) {
  const router = useRouter();
  const urlP = useSearchParams();

  // URL param helpers
  const param = (key: string, fallback = '') => urlP.get(key) ?? fallback;

  const activeCity  = param('city', serverCity);
  const activeBadge = param('badge');
  const activeSort  = param('sort', 'rating');
  const activeMinExp    = param('minExp');
  const activeMinDeals  = param('minDeals');
  const activePage  = parseInt(param('page', '1'), 10) || 1;
  const activeSearch = param('search');

  // Local UI state
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // City search autocomplete (purely local — not a filter until applied)
  const [cityQuery, setCityQuery]     = useState(activeCity);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const searchWrap = useRef<HTMLDivElement>(null);

  // Sync city input if URL changes externally
  useEffect(() => { setCityQuery(activeCity); }, [activeCity]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // City autocomplete
  const searchCity = useCallback(async (q: string) => {
    if (q.length < 2) { setCitySuggestions([]); return; }
    try {
      const { data } = await locationsApi.getCities();
      const all: string[] = (data || []).map((c: any) => c.name || c);
      setCitySuggestions(all.filter(c => c.toLowerCase().includes(q.toLowerCase())).slice(0, 7));
    } catch { setCitySuggestions([]); }
  }, []);

  // Push updated filters to URL (resets page to 1)
  const pushFilter = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(urlP.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '') p.delete(k); else p.set(k, v);
    });
    p.set('page', '1');
    router.push(`/agents?${p.toString()}`, { scroll: false });
  }, [urlP, router]);

  const pushPage = (pg: number) => {
    const p = new URLSearchParams(urlP.toString());
    p.set('page', String(pg));
    router.push(`/agents?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyCity = (c: string) => {
    setCityQuery(c); setShowSug(false);
    pushFilter({ city: c || null });
  };

  const clearAllFilters = () => {
    setCityQuery('');
    router.push('/agents', { scroll: false });
  };

  // Fetch ALL agents from API (server-side filters: city, badge only).
  // minExp / minDeals / sort are applied client-side so they always work
  // across all results, not just the current page's 15 items.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 500 };
      if (activeCity)  params.city = activeCity;
      if (activeBadge) params.agentTick = activeBadge;
      const r = await usersApi.getAgents(params);
      const data = r.data;
      const items: Agent[] = data?.agents || data?.items || (Array.isArray(data) ? data : []);
      setAllAgents(items);
    } catch {
      setAllAgents([]);
    } finally {
      setLoading(false);
    }
  }, [activeCity, activeBadge]); // only refetch when server-supported filters change

  useEffect(() => { load(); }, [load]);

  // Client-side filter + sort — instant, no API call
  const filteredAgents = useMemo(() => {
    const result = allAgents.filter(a => {
      if (activeMinExp   && (a.agentExperience ?? 0) < parseInt(activeMinExp))  return false;
      if (activeMinDeals && (a.totalDeals ?? 0)      < parseInt(activeMinDeals)) return false;
      return true;
    });
    return clientSort(result, activeSort);
  }, [allAgents, activeMinExp, activeMinDeals, activeSort]);

  // Client-side pagination
  const total      = filteredAgents.length;
  const totalPages = Math.ceil(total / LIMIT);
  const agents     = useMemo(
    () => filteredAgents.slice((activePage - 1) * LIMIT, activePage * LIMIT),
    [filteredAgents, activePage],
  );

  const verifiedCount = filteredAgents.filter(a => a.isVerified || (a.agentTick && a.agentTick !== 'none')).length;

  // Active filter chips
  const activeFilterChips: { key: string; label: string }[] = [];
  if (activeCity)     activeFilterChips.push({ key: 'city',     label: `City: ${activeCity}` });
  if (activeBadge)    activeFilterChips.push({ key: 'badge',    label: BADGE_OPTIONS.find(b => b.value === activeBadge)?.label ?? activeBadge });
  if (activeMinExp)   activeFilterChips.push({ key: 'minExp',   label: `${activeMinExp}+ yrs exp` });
  if (activeMinDeals) activeFilterChips.push({ key: 'minDeals', label: `${activeMinDeals}+ deals` });

  const hasActiveFilters = !!(activeCity || activeBadge || activeMinExp || activeMinDeals || (activeSort !== 'rating'));

  // Chip removal — also clears local cityQuery state for city chip
  const removeChip = useCallback((key: string) => {
    if (key === 'city') setCityQuery('');
    pushFilter({ [key]: null });
  }, [pushFilter]);

  // ── Sidebar content ────────────────────────────────────────────────────────

  const makeSidebar = (idPrefix: string) => (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
          Filter Agents
        </h3>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
            Clear All
          </button>
        )}
      </div>

      {/* Sort By */}
      <SidebarSection title="Sort By">
        <div className="space-y-1">
          {SORT_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-sort`} value={o.value} checked={activeSort === o.value}
                onChange={() => pushFilter({ sort: o.value })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm transition-colors ${activeSort === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Agent Badge */}
      <SidebarSection title="Agent Badge">
        <div className="space-y-1">
          <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
            <input type="radio" name={`${idPrefix}-badge`} value="" checked={!activeBadge}
              onChange={() => pushFilter({ badge: null })}
              className="accent-primary-600 w-3.5 h-3.5" />
            <span className={`text-sm ${!activeBadge ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>All Agents</span>
          </label>
          {BADGE_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-badge`} value={o.value} checked={activeBadge === o.value}
                onChange={() => pushFilter({ badge: o.value })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm flex items-center gap-1 ${activeBadge === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TICK[o.value]?.dot}`} />
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Experience */}
      <SidebarSection title="Min. Experience">
        <div className="space-y-1">
          {EXP_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-minExp`} value={o.value}
                checked={activeMinExp === o.value}
                onChange={() => pushFilter({ minExp: o.value || null })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm ${activeMinExp === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Deals Closed */}
      <SidebarSection title="Min. Deals Closed">
        <div className="space-y-1">
          {DEALS_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input type="radio" name={`${idPrefix}-minDeals`} value={o.value}
                checked={activeMinDeals === o.value}
                onChange={() => pushFilter({ minDeals: o.value || null })}
                className="accent-primary-600 w-3.5 h-3.5" />
              <span className={`text-sm ${activeMinDeals === o.value ? 'text-primary-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Popular Cities */}
      <SidebarSection title="Browse by City" defaultOpen={false}>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => { setCityQuery(''); pushFilter({ city: null }); }}
            className={cn('text-left text-sm py-1.5 px-2 rounded-lg transition-colors', !activeCity ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}>
            🇮🇳 All India
          </button>
          {TOP_CITIES.map(c => (
            <button key={c} onClick={() => pushFilter({ city: c })}
              className={cn('text-left text-sm py-1.5 px-2 rounded-lg flex items-center gap-1.5 transition-colors', activeCity === c ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}>
              <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />{c}
            </button>
          ))}
        </div>
      </SidebarSection>
    </aside>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* ── Sticky search bar (same as property listing) ─────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="container-max py-3">
          <div ref={searchWrap} className="relative flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); setShowSug(true); searchCity(e.target.value); }}
                onFocus={() => { setShowSug(true); if (cityQuery.length >= 2) searchCity(cityQuery); }}
                onKeyDown={e => { if (e.key === 'Enter') applyCity(cityQuery); }}
                placeholder="Search agents by city (e.g. Mumbai, Delhi)…"
                className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
              />
              {cityQuery && (
                <button onClick={() => applyCity('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {showSug && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  {citySuggestions.map(c => (
                    <button key={c} onClick={() => applyCity(c)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 text-left border-b border-gray-50 last:border-0 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />{c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => applyCity(cityQuery)}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Search className="w-3.5 h-3.5" /> Search
            </button>
            {/* Mobile filter toggle */}
            <button onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white">
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && <span className="w-2 h-2 bg-primary-600 rounded-full" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb + city banner ──────────────────────────────────────── */}
      {activeCity && (
        <div className="bg-primary-50 border-b border-primary-100">
          <div className="container-max py-2.5 flex items-center gap-1.5 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link href="/agents" className="hover:text-primary-600 transition-colors">Agents</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold">{activeCity}</span>
          </div>
        </div>
      )}

      {/* ── Page body: sidebar + content ─────────────────────────────────── */}
      <div className="container-max py-5">
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0 sticky top-36 self-start max-h-[calc(100vh-160px)] overflow-y-auto">
            {makeSidebar('d')}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {activeCity
                    ? `Real Estate Agents in ${activeCity}`
                    : 'Find Top Real Estate Agents in India'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading…' : (
                    <>
                      <span className="font-semibold text-gray-700">{total.toLocaleString('en-IN')}</span> agents found
                      {verifiedCount > 0 && <span className="text-emerald-600"> · {verifiedCount} verified</span>}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilterChips.map(chip => (
                  <button key={chip.key} onClick={() => removeChip(chip.key)}
                    className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors">
                    {chip.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-600 underline px-1 transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Agent list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Agents Found</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  {activeCity ? `No agents in ${activeCity} yet.` : 'Try adjusting your filters.'}
                </p>
                <button onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm">
                  Browse All Agents
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {agents.map((a, i) => (
                    <AgentCard key={a.id} agent={a} rank={activePage === 1 ? i + 1 : undefined} />
                  ))}
                </div>

                {/* Count line */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  Showing {(activePage - 1) * LIMIT + 1}–{Math.min(activePage * LIMIT, total)} of {total.toLocaleString('en-IN')} agents
                </p>

                {/* Pagination */}
                <Pagination page={activePage} totalPages={totalPages} onChange={pushPage} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-y-0 left-0 w-[300px] bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Filter Agents</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {makeSidebar('m')}
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors">
                Show {total} Agents
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SEO CONTENT — BELOW THE FOLD
      ══════════════════════════════════════════════════════════════════ */}

      {/* City SEO links */}
      <section className="bg-white border-t border-gray-100 py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Explore by City</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Find Agents in Your City</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto">Browse RERA-certified real estate agents in all major cities across India.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {[...TOP_CITIES, 'Chandigarh', 'Lucknow', 'Kochi', 'Indore', 'Nagpur', 'Bhopal', 'Coimbatore', 'Vadodara', 'Patna', 'Bhubaneswar', 'Visakhapatnam', 'Mangalore'].map(c => (
              <Link key={c} href={`/agents?city=${encodeURIComponent(c)}`}
                className="flex items-center justify-between gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all group">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-400 group-hover:text-primary-500 flex-shrink-0" />{c}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-primary-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">How to Find the Right Agent</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-lg mx-auto">Finding a trustworthy real estate agent in India has never been easier.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-primary-200 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-sm">{step.icon}</div>
                  <span className="text-3xl font-black text-gray-100 leading-none">{step.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Why Think4BuySale</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Why Trust Our Agent Network?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_CHOOSE.map(item => (
              <div key={item.title} className={`${item.bg} border rounded-2xl p-5 flex gap-3`}>
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16">
        <div className="container-max">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Client Stories</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">What Our Clients Say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 relative">
                <Quote className="w-7 h-7 text-gray-100 absolute top-4 right-4" />
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-black">
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-max max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2.5">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-100 transition-colors">
                  <span className="font-semibold text-gray-900 text-sm leading-snug">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-gray-100 bg-white">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial SEO content */}
      <section className="bg-gray-50 border-t border-gray-100 py-12 md:py-16">
        <div className="container-max max-w-4xl">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-5">
            {activeCity ? `Real Estate Agents in ${activeCity} — Complete Guide` : 'Real Estate Agents in India — Your Complete Guide'}
          </h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>Finding a reliable real estate agent in India is one of the most critical steps when buying, selling or renting property. A good agent doesn't just show you listings — they bring expert market knowledge, handle complex legal documentation, negotiate the best price on your behalf, and guide you every step of the way from shortlisting to final registration.</p>
            <p>All real estate brokers listed on Think4BuySale are required to register with their RERA (Real Estate Regulatory Authority) number during onboarding. RERA was established under the Real Estate (Regulation and Development) Act, 2016 to protect home buyers from fraud. Working with a RERA-registered agent gives you legal recourse if something goes wrong — making it the single most important credential to verify before engaging any broker.</p>
            {activeCity && (
              <p>The real estate market in {activeCity} is highly dynamic, with prices varying significantly by locality, floor level and project vintage. An experienced local agent in {activeCity} understands neighbourhood-level price trends, upcoming infrastructure projects, school zones, metro connectivity and micro-market dynamics that no national portal can capture in a database. They have relationships with builders, legal advocates and financial institutions that help you close deals faster and avoid costly mistakes.</p>
            )}
            <div>
              <h3 className="font-bold text-gray-900 mt-4 mb-2 text-base">How to Choose the Right Real Estate Agent</h3>
              <p>When choosing a real estate agent, look for: (1) <strong>RERA registration</strong> — legally required for all practicing agents; (2) <strong>Local market experience</strong> — an agent active in your target neighbourhood for at least 3 years; (3) <strong>Strong reviews</strong> — prioritise agents with 4+ star ratings and multiple verified client testimonials; (4) <strong>Responsive communication</strong> — your agent should respond promptly and explain every step clearly; (5) <strong>Transparent fee structure</strong> — brokerage should be discussed and agreed in writing before beginning.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mt-4 mb-2 text-base">What is the Brokerage Fee for Real Estate Agents in India?</h3>
              <p>In India, the standard brokerage fee is typically 1–2% of the property value for both buyer and seller in purchase transactions, or 1–2 months' rent for rental transactions. However, this varies significantly by city and property type. Always clarify and document the brokerage amount before engaging an agent. Think4BuySale encourages agents to disclose their fee structure upfront on their profile page to ensure complete transparency for both parties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary-800 py-12">
        <div className="container-max text-center">
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">Ready to Find Your Agent?</h2>
          <p className="text-primary-200 text-sm mb-5 max-w-md mx-auto">Search from {total > 0 ? `${total.toLocaleString('en-IN')}+` : 'thousands of'} verified agents. Free consultation. Zero hidden fees.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-extrabold px-7 py-3 rounded-2xl text-sm transition-colors shadow-lg">
            <Search className="w-4 h-4" /> Search Agents Now
          </button>
        </div>
      </section>
    </div>
  );
}
