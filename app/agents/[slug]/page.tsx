import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, Star, Award, Building2, ArrowLeft,
  CheckCircle, TrendingUp, Home, Users,
  Calendar, Mail, Shield, ChevronRight,
} from 'lucide-react';
import AgentContactForm from '@/components/agent/AgentContactForm';
import AgentListings from '@/components/agent/AgentListings';
import AgentAnalyticsTracker from '@/components/agent/AgentAnalyticsTracker';
import AgentFeedbackSection from '@/components/agent/AgentFeedbackSection';

type Params = { slug: string };

// Slug format: rahul-verma-in-delhi-{uuidNoHyphens}
// or legacy: rahul-verma-delhi-{last4}
function parseSlug(slug: string): string {
  // New format: last segment is 32-char hex UUID without hyphens
  const parts = slug.split('-');
  const last = parts[parts.length - 1];

  if (last.length === 32 && /^[a-f0-9]+$/i.test(last)) {
    // Reformat to UUID: 8-4-4-4-12
    return `${last.slice(0, 8)}-${last.slice(8, 12)}-${last.slice(12, 16)}-${last.slice(16, 20)}-${last.slice(20)}`;
  }

  // Legacy: try last 5 parts as UUID segments
  if (parts.length >= 5) {
    const candidate = parts.slice(-5).join('-');
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(candidate)) {
      return candidate;
    }
  }

  return last;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchAgent(id: string) {
  try {
    const res = await fetch(`${BASE}/users/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}


export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = parseSlug(params.slug);
  const agent = await fetchAgent(id);
  if (!agent) return { title: 'Agent Not Found | Think4BuySale' };

  const city = agent.city || 'India';
  const name = agent.name || 'Agent';
  return {
    title: `${name} – Real Estate Agent in ${city} | Think4BuySale`,
    description: `${agent.agentBio || `${name} is a verified real estate agent in ${city} with ${agent.agentExperience || 0}+ years of experience and ${agent.totalDeals || 0} successful deals.`}`,
    keywords: `${name} real estate agent ${city}, property agent ${city}, buy sell rent property ${city}`,
    alternates: { canonical: `https://think4buysale.com/agents/${params.slug}` },
    openGraph: {
      title: `${name} – Real Estate Agent | Think4BuySale`,
      description: agent.agentBio || `Verified real estate agent in ${city}`,
      type: 'profile',
    },
  };
}

const TICK_CONFIG: Record<string, { label: string; badgeCls: string; avatarCls: string; icon: string }> = {
  blue:    { label: 'Verified',  badgeCls: 'bg-blue-100 text-blue-700 border-blue-300',       avatarCls: 'from-blue-500 to-blue-700',     icon: '✓' },
  gold:    { label: 'Gold',      badgeCls: 'bg-amber-100 text-amber-700 border-amber-300',     avatarCls: 'from-amber-400 to-amber-600',   icon: '★' },
  diamond: { label: 'Diamond',   badgeCls: 'bg-violet-100 text-violet-700 border-violet-300',  avatarCls: 'from-violet-500 to-violet-700', icon: '◆' },
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
  const id = parseSlug(params.slug);
  const agent = await fetchAgent(id);

  if (!agent) notFound();

  const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK_CONFIG[agent.agentTick] : null;
  const initials = agent.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'AG';
  const avatarGradient = tick?.avatarCls ?? 'from-gray-400 to-gray-600';

  const profileUrl = `https://think4buysale.com/agents/${params.slug}`;

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
        <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
          <div className="container-max py-8 md:py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-primary-300 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/agents" className="hover:text-white transition-colors">Agents</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">{agent.name}</span>
            </nav>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl ring-4 ring-white/20`}>
                  {initials}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">{agent.name}</h1>
                  {tick && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${tick.badgeCls}`}>
                      {tick.icon} {tick.label} Agent
                    </span>
                  )}
                </div>

                {agent.company && (
                  <p className="text-primary-200 font-medium mb-2">{agent.company}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-primary-200 mb-4">
                  {(agent.city || agent.state) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary-300" />
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
                    <span className="text-primary-300 text-sm">/ 5.0</span>
                  </div>
                )}

                {/* Quick stats row */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{agent.totalDeals ?? 0}</div>
                    <div className="text-xs text-primary-300 uppercase tracking-wider">Deals Closed</div>
                  </div>
                  <div className="w-px bg-primary-600" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{agent.agentExperience ?? 0}+</div>
                    <div className="text-xs text-primary-300 uppercase tracking-wider">Years Exp.</div>
                  </div>
                  <div className="w-px bg-primary-600" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-white">{agent.agentUsedQuota ?? 0}</div>
                    <div className="text-xs text-primary-300 uppercase tracking-wider">Active Listings</div>
                  </div>
                </div>
              </div>

              {/* CTA buttons — visible on desktop in hero */}
              <div className="hidden md:flex flex-col gap-3 min-w-48">
                {agent.phone && (
                  <a
                    href={`tel:+91${agent.phone}`}
                    className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-primary-700 rounded-2xl font-bold hover:bg-primary-50 transition-colors shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                )}
                {agent.email && (
                  <a
                    href={`mailto:${agent.email}`}
                    className="flex items-center justify-center gap-2 py-3.5 px-6 bg-primary-600/40 border border-primary-400/50 text-white rounded-2xl font-bold hover:bg-primary-600/60 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Send Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile CTA bar ──────────────────────────────────────── */}
        <div className="md:hidden sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex gap-3 p-3">
            {agent.phone && (
              <a
                href={`tel:+91${agent.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm"
              >
                <Phone className="w-4 h-4" /> Call Agent
              </a>
            )}
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm"
              >
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
          </div>
        </div>

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

              {/* Active Listings — dynamic client component */}
              <AgentListings agentId={agent.id} agentName={agent.name} />

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

                {/* Mini profile card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xl font-black shadow-md flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{agent.name}</h3>
                      {tick && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${tick.badgeCls}`}>
                          {tick.icon} {tick.label}
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
                      <div className="text-base font-black text-gray-900">{agent.agentUsedQuota ?? 0}</div>
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
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      Verified by Think4BuySale
                    </div>
                    {agent.agentLicense && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        RERA registered agent
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {agent.agentExperience ?? 0}+ years experience
                    </div>
                  </div>
                </div>

                {/* Contact form — public to view, login required only on submit */}
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
