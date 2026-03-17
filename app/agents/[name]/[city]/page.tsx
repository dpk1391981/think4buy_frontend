import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, Star, Award, Building2, ArrowLeft,
  CheckCircle, TrendingUp, Home, Users,
  Calendar, Mail, Shield, ChevronRight, Sparkles,
} from 'lucide-react';
import AgentContactForm from '@/components/agent/AgentContactForm';
import AgentListings from '@/components/agent/AgentListings';
import AgentAnalyticsTracker from '@/components/agent/AgentAnalyticsTracker';
import AgentFeedbackSection from '@/components/agent/AgentFeedbackSection';
import AgentCallCTA from '@/components/agent/AgentCallCTA';

type Params = { name: string; city: string };

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/** Lookup agent by name slug + optional city slug, returns first match */
async function fetchAgentBySlug(nameSlug: string, citySlug: string) {
  try {
    const search = nameSlug.replace(/-/g, ' ');
    const city   = citySlug ? citySlug.replace(/-/g, ' ') : '';

    const params = new URLSearchParams({ search, limit: '5' });
    if (city) params.set('city', city);

    const res = await fetch(`${BASE}/users/agents?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const agents: any[] = json?.agents ?? json?.data?.agents ?? json?.data ?? [];
    if (!Array.isArray(agents) || agents.length === 0) return null;

    const normalize = (s: string) =>
      (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return agents.find(a => normalize(a.name) === nameSlug) ?? agents[0];
  } catch { return null; }
}

async function fetchListingCount(agentId: string): Promise<number> {
  try {
    const url = `${BASE}/properties?agentId=${agentId}&approvalStatus=approved&status=active&limit=1&page=1`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return 0;
    const json = await res.json();
    return json?.total ?? json?.meta?.total ?? 0;
  } catch { return 0; }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const agent = await fetchAgentBySlug(params.name, params.city);
  if (!agent) return { title: 'Agent Not Found | Think4BuySale' };

  const city = agent.city || params.city;
  const name = agent.name || 'Agent';
  const slug = `${params.name}-in-${params.city}`;
  return {
    title: `${name} – Real Estate Agent in ${city} | Think4BuySale`,
    description: `${agent.agentBio || `${name} is a verified real estate agent in ${city} with ${agent.agentExperience || 0}+ years of experience and ${agent.totalDeals || 0} successful deals.`}`,
    keywords: `${name} real estate agent ${city}, property agent ${city}, buy sell rent property ${city}`,
    alternates: { canonical: `https://think4buysale.com/agents/${slug}` },
    openGraph: {
      title: `${name} – Real Estate Agent | Think4BuySale`,
      description: agent.agentBio || `Verified real estate agent in ${city}`,
      type: 'profile',
    },
  };
}

// ── Tier config — mirrors AgentsListingClient TIER_STYLE ──────────────────────
const TIER_CONFIG: Record<string, {
  heroBg: string;           // hero banner gradient classes
  heroShine: string;        // subtle shimmer overlay on hero
  avatarGrad: string;
  avatarRing: string;
  avatarShadow: string;
  badgeGrad: string | null;
  badgeShadow: string | null;
  badgeColor: string | null;
  badgeIcon: string;
  badgeLabel: string;
  badgeCls: string;
  cardBorder: string;
  cardShadow: string;
  headerGrad: string;       // metallic bar at top of sidebar card
  breadcrumbCls: string;
  subTextCls: string;
}> = {
  none: {
    heroBg:       'from-primary-900 via-primary-800 to-primary-700',
    heroShine:    'from-white/0 via-white/5 to-black/10',
    avatarGrad:   'from-gray-400 to-gray-600',
    avatarRing:   'ring-4 ring-white/20',
    avatarShadow: '0 4px 16px rgba(0,0,0,0.35)',
    badgeGrad:    null,
    badgeShadow:  null,
    badgeColor:   null,
    badgeIcon:    '✓',
    badgeLabel:   'Verified',
    badgeCls:     'bg-blue-100 text-blue-700 border-blue-300',
    cardBorder:   'border-gray-100',
    cardShadow:   '0 2px 8px rgba(0,0,0,0.07)',
    headerGrad:   'from-primary-900 via-primary-700 to-primary-500',
    breadcrumbCls:'text-primary-300',
    subTextCls:   'text-primary-200',
  },
  verified: {
    heroBg:       'from-blue-900 via-blue-700 to-blue-500',
    heroShine:    'from-white/0 via-white/5 to-black/15',
    avatarGrad:   'from-blue-500 to-blue-800',
    avatarRing:   'ring-4 ring-blue-300/40',
    avatarShadow: '0 4px 16px rgba(29,78,216,0.5)',
    badgeGrad:    'linear-gradient(135deg,#1e3a8a,#1d4ed8,#60a5fa,#bfdbfe,#60a5fa,#1d4ed8)',
    badgeShadow:  '0 2px 8px rgba(29,78,216,0.45)',
    badgeColor:   '#eff6ff',
    badgeIcon:    '✓',
    badgeLabel:   'VERIFIED',
    badgeCls:     'bg-blue-100 text-blue-700 border-blue-300',
    cardBorder:   'border-blue-200/70',
    cardShadow:   '0 2px 6px rgba(29,78,216,0.1), 0 8px 20px rgba(29,78,216,0.12)',
    headerGrad:   'from-[#1e3a8a] via-[#1d4ed8] to-[#60a5fa]',
    breadcrumbCls:'text-blue-200',
    subTextCls:   'text-blue-100',
  },
  bronze: {
    heroBg:       'from-[#431407] via-[#c2410c] to-[#f97316]',
    heroShine:    'from-white/0 via-orange-200/10 to-black/20',
    avatarGrad:   'from-orange-500 to-red-700',
    avatarRing:   'ring-4 ring-orange-300/50',
    avatarShadow: '0 4px 16px rgba(194,65,12,0.55)',
    badgeGrad:    'linear-gradient(135deg,#431407,#7c2d12,#c2410c,#fdba74,#fb923c,#c2410c,#7c2d12)',
    badgeShadow:  '0 2px 8px rgba(124,45,18,0.55)',
    badgeColor:   '#fff7ed',
    badgeIcon:    '◉',
    badgeLabel:   'BRONZE',
    badgeCls:     'bg-orange-50 text-orange-700 border-orange-300',
    cardBorder:   'border-orange-200/70',
    cardShadow:   '0 2px 6px rgba(124,45,18,0.1), 0 8px 20px rgba(124,45,18,0.18)',
    headerGrad:   'from-[#431407] via-[#c2410c] to-[#fb923c]',
    breadcrumbCls:'text-orange-200',
    subTextCls:   'text-orange-100',
  },
  silver: {
    heroBg:       'from-[#0f172a] via-[#334155] to-[#64748b]',
    heroShine:    'from-white/0 via-slate-300/10 to-black/20',
    avatarGrad:   'from-slate-400 to-slate-800',
    avatarRing:   'ring-4 ring-slate-300/50',
    avatarShadow: '0 4px 16px rgba(100,116,139,0.55)',
    badgeGrad:    'linear-gradient(135deg,#0f172a,#334155,#94a3b8,#f1f5f9,#cbd5e1,#64748b,#1e293b)',
    badgeShadow:  '0 2px 8px rgba(30,41,59,0.5)',
    badgeColor:   '#f8fafc',
    badgeIcon:    '◈',
    badgeLabel:   'SILVER',
    badgeCls:     'bg-slate-50 text-slate-600 border-slate-300',
    cardBorder:   'border-slate-300/70',
    cardShadow:   '0 2px 6px rgba(30,41,59,0.1), 0 8px 20px rgba(100,116,139,0.18)',
    headerGrad:   'from-[#1e293b] via-[#64748b] to-[#e2e8f0]',
    breadcrumbCls:'text-slate-300',
    subTextCls:   'text-slate-200',
  },
  gold: {
    heroBg:       'from-[#713f12] via-[#b45309] to-[#d97706]',
    heroShine:    'from-white/0 via-amber-200/15 to-black/20',
    avatarGrad:   'from-amber-400 to-orange-700',
    avatarRing:   'ring-4 ring-amber-300/60',
    avatarShadow: '0 4px 20px rgba(161,98,7,0.65)',
    badgeGrad:    'linear-gradient(135deg,#92400e,#b45309,#d97706,#fde68a,#fbbf24,#d97706,#b45309,#92400e)',
    badgeShadow:  '0 2px 8px rgba(161,98,7,0.6)',
    badgeColor:   '#fff7ed',
    badgeIcon:    '♛',
    badgeLabel:   'GOLD',
    badgeCls:     'bg-amber-50 text-amber-700 border-amber-300',
    cardBorder:   'border-amber-300/70',
    cardShadow:   '0 2px 6px rgba(161,98,7,0.12), 0 8px 20px rgba(161,98,7,0.22)',
    headerGrad:   'from-[#713f12] via-[#d97706] to-[#fde68a]',
    breadcrumbCls:'text-amber-200',
    subTextCls:   'text-amber-100',
  },
};

const TIER_TAGLINE: Record<string, string> = {
  gold:     '♛ Trusted Gold-Tier Agent',
  silver:   '◈ Elite Silver-Tier Agent',
  bronze:   '◉ Certified Bronze Agent',
  verified: '✓ Verified Real Estate Agent',
};

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default async function AgentProfilePage({ params }: { params: Params }) {
  const agent = await fetchAgentBySlug(params.name, params.city);
  if (!agent) notFound();

  const listingCount = await fetchListingCount(agent.id);

  const tickKey = (agent.agentTick && agent.agentTick !== 'none') ? agent.agentTick : 'none';
  const tier    = TIER_CONFIG[tickKey] ?? TIER_CONFIG.none;
  const isPremium = tickKey !== 'none';

  const initials = agent.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'AG';

  const slug = `${params.name}-in-${params.city}`;
  const profileUrl = `https://think4buysale.com/agents/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    telephone: agent.phone ? `+91${agent.phone}` : undefined,
    email: agent.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: agent.city,
      addressRegion: agent.state,
      addressCountry: 'IN',
    },
    description: agent.agentBio,
    url: profileUrl,
    aggregateRating: agent.agentRating ? {
      '@type': 'AggregateRating',
      ratingValue: agent.agentRating,
      bestRating: 5,
    } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AgentAnalyticsTracker agentId={agent.id} city={agent.city} state={agent.state} />

      <div className="min-h-screen bg-gray-50 pt-16">

        {/* ── Hero Banner ──────────────────────────────────────────── */}
        <div className={`relative overflow-hidden bg-gradient-to-r text-white ${tier.heroBg}`}>
          {/* Depth shimmer overlay */}
          <div className={`absolute inset-0 bg-gradient-to-b ${tier.heroShine} pointer-events-none`} />
          {/* 3D light gloss — top-left diagonal shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

          {/* Metallic tier badge — top-right corner */}
          {isPremium && tier.badgeGrad && (
            <div
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest z-10 select-none"
              style={{
                background:  tier.badgeGrad,
                boxShadow:   tier.badgeShadow ?? undefined,
                color:       tier.badgeColor ?? undefined,
                letterSpacing: '0.1em',
              }}
            >
              <span>{tier.badgeIcon}</span>
              <span>{tier.badgeLabel}</span>
            </div>
          )}

          <div className="container-max py-8 md:py-12 relative z-10">
            {/* Breadcrumb */}
            <nav className={`flex items-center gap-2 text-xs mb-6 ${tier.breadcrumbCls}`}>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/agents" className="hover:text-white transition-colors">Agents</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">{agent.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                {agent.avatar ? (
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className={`w-28 h-28 md:w-36 md:h-36 rounded-3xl object-cover shadow-2xl border-2 border-white/20 ${tier.avatarRing}`}
                    style={{ boxShadow: tier.avatarShadow }}
                  />
                ) : (
                  <div
                    className={`w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br ${tier.avatarGrad} flex items-center justify-center text-white text-4xl md:text-5xl font-black border-2 border-white/20 ${tier.avatarRing}`}
                    style={{ boxShadow: tier.avatarShadow }}
                  >
                    {initials}
                  </div>
                )}
                {/* Verified dot */}
                {agent.isVerified && (
                  <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    <CheckCircle className="w-4 h-4 text-white fill-white" />
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">{agent.name}</h1>
                  {isPremium && (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full border"
                      style={tier.badgeGrad ? {
                        background:  tier.badgeGrad,
                        boxShadow:   tier.badgeShadow ?? undefined,
                        color:       tier.badgeColor ?? undefined,
                        borderColor: 'transparent',
                      } : undefined}
                    >
                      {tier.badgeIcon} {tickKey.charAt(0).toUpperCase() + tickKey.slice(1)} Agent
                    </span>
                  )}
                </div>

                {/* Tier tagline */}
                {isPremium && TIER_TAGLINE[tickKey] && (
                  <p className={`text-xs font-semibold mb-2 flex items-center gap-1 ${tier.subTextCls}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {TIER_TAGLINE[tickKey]}
                  </p>
                )}

                {agent.company && (
                  <p className={`font-medium mb-2 ${tier.subTextCls}`}>{agent.company}</p>
                )}

                <div className={`flex flex-wrap items-center gap-4 text-sm mb-4 ${tier.subTextCls}`}>
                  {(agent.city || agent.state) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 opacity-80" />
                      {[agent.city, agent.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {agent.agentLicense && (
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      RERA: {agent.agentLicense}
                    </span>
                  )}
                  {agent.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Member since {new Date(agent.createdAt).getFullYear()}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {agent.agentRating && (
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={Number(agent.agentRating)} size="md" />
                    <span className="text-white font-bold text-lg">{Number(agent.agentRating).toFixed(1)}</span>
                    <span className={`text-sm ${tier.subTextCls}`}>/ 5.0</span>
                  </div>
                )}

                {/* Quick stats row */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{agent.totalDeals ?? 0}</div>
                    <div className={`text-xs uppercase tracking-wider ${tier.subTextCls}`}>Deals Closed</div>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{agent.agentExperience ?? 0}+</div>
                    <div className={`text-xs uppercase tracking-wider ${tier.subTextCls}`}>Years Exp.</div>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{listingCount}</div>
                    <div className={`text-xs uppercase tracking-wider ${tier.subTextCls}`}>Active Listings</div>
                  </div>
                </div>
              </div>

              {/* CTA buttons — visible on desktop in hero */}
              <AgentCallCTA phone={agent.phone} email={agent.email} variant="desktop-hero" />
            </div>
          </div>
        </div>

        {/* ── Mobile CTA bar ──────────────────────────────────────── */}
        <AgentCallCTA phone={agent.phone} email={agent.email} variant="mobile-bar" />

        {/* ── Main Content ────────────────────────────────────────── */}
        <div className="container-max py-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── Left column ─────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* About */}
              {agent.agentBio && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    About {agent.name?.split(' ')[0]}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{agent.agentBio}</p>
                </section>
              )}

              {/* Trust indicators */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Credentials & Expertise
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {agent.agentLicense && (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-0.5">RERA Registered</div>
                        <div className="text-sm font-bold text-emerald-900">{agent.agentLicense}</div>
                      </div>
                    </div>
                  )}
                  {agent.agentExperience > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <Award className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-0.5">Experience</div>
                        <div className="text-sm font-bold text-blue-900">{agent.agentExperience}+ Years</div>
                      </div>
                    </div>
                  )}
                  {agent.totalDeals > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-0.5">Deals Closed</div>
                        <div className="text-sm font-bold text-amber-900">{agent.totalDeals} Successful</div>
                      </div>
                    </div>
                  )}
                  {agent.isVerified && (
                    <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-violet-700 font-semibold uppercase tracking-wide mb-0.5">Verified By</div>
                        <div className="text-sm font-bold text-violet-900">Think4BuySale</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Active Listings */}
              <AgentListings agentId={agent.id} agentName={agent.name} initialTotal={listingCount} />

              {/* Reviews & Ratings */}
              <AgentFeedbackSection agentId={agent.id} />

              {/* Location coverage */}
              {(agent.city || agent.state) && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    Area of Operation
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.city && (
                      <Link
                        href={`/properties?city=${encodeURIComponent(agent.city)}&agentId=${agent.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 border border-primary-200 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {agent.city}
                      </Link>
                    )}
                    {agent.state && (
                      <Link
                        href={`/properties?state=${encodeURIComponent(agent.state)}&agentId=${agent.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        <Home className="w-3.5 h-3.5" />
                        {agent.state}
                      </Link>
                    )}
                  </div>
                </section>
              )}

              {/* Back */}
              <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to all agents
              </Link>
            </div>

            {/* ── Right sidebar (sticky) ─────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">

                {/* Mini profile card — tier-styled */}
                <div
                  className={`bg-white rounded-2xl overflow-hidden border ${tier.cardBorder}`}
                  style={{ boxShadow: tier.cardShadow }}
                >
                  {/* Metallic header bar */}
                  <div
                    className={`h-2 bg-gradient-to-r ${tier.headerGrad}`}
                    style={isPremium ? { boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.12)' } : {}}
                  />

                  <div className="p-5">
                    {/* Metallic tier badge inside card — top right */}
                    {isPremium && tier.badgeGrad && (
                      <div className="flex justify-end mb-2 -mt-1">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest"
                          style={{
                            background:    tier.badgeGrad,
                            boxShadow:     tier.badgeShadow ?? undefined,
                            color:         tier.badgeColor ?? undefined,
                            letterSpacing: '0.1em',
                          }}
                        >
                          {tier.badgeIcon} {tier.badgeLabel}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      {agent.avatar ? (
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className={`w-16 h-16 rounded-2xl object-cover border-2 border-white flex-shrink-0 ${tier.avatarRing}`}
                          style={{ boxShadow: tier.avatarShadow }}
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.avatarGrad} flex items-center justify-center text-white text-xl font-black border-2 border-white flex-shrink-0 ${tier.avatarRing}`}
                          style={{ boxShadow: tier.avatarShadow }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{agent.name}</h3>
                        {isPremium && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${tier.badgeCls}`}>
                            {tier.badgeIcon} {tickKey.charAt(0).toUpperCase() + tickKey.slice(1)}
                          </span>
                        )}
                        {agent.company && <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.company}</p>}
                        {(agent.city || agent.state) && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {[agent.city, agent.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-1 py-3 border-y border-gray-100 mb-3">
                      <div className="text-center">
                        <div className="text-base font-black text-gray-900">{agent.totalDeals ?? 0}</div>
                        <div className="text-[10px] text-gray-400">Deals</div>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <div className="text-base font-black text-gray-900">{agent.agentExperience ?? 0}+</div>
                        <div className="text-[10px] text-gray-400">Yrs Exp</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base font-black text-gray-900">{listingCount}</div>
                        <div className="text-[10px] text-gray-400">Listings</div>
                      </div>
                    </div>

                    {/* Rating + RERA */}
                    {agent.agentRating && (
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={Number(agent.agentRating)} />
                        <span className="text-sm font-bold text-gray-700">{Number(agent.agentRating).toFixed(1)}</span>
                      </div>
                    )}
                    {agent.agentLicense && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl mb-3">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                        RERA: {agent.agentLicense}
                      </div>
                    )}

                    <Link
                      href={`/properties?agentId=${agent.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      View All Listings
                    </Link>

                    {/* Trust indicators */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                      {agent.isVerified && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          Verified by Think4BuySale
                        </div>
                      )}
                      {agent.agentLicense && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          RERA registered agent
                        </div>
                      )}
                      {(agent.agentExperience ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          {agent.agentExperience}+ years experience
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact form */}
                <AgentContactForm
                  agentId={agent.id}
                  agentName={agent.name}
                  agentPhone={agent.phone}
                  agentEmail={agent.email}
                />

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
