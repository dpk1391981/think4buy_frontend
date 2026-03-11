import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Star, Award, Building2, ArrowLeft, MessageCircle } from 'lucide-react';

type Params = { slug: string };

// Slug format: rahul-verma-delhi-542  (name-city-id)
function parseSlug(slug: string) {
  const parts = slug.split('-');
  const id = parts[parts.length - 1];
  return { id };
}

async function fetchAgent(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${base}/users/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchAgentListings(agentId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${base}/properties?agentId=${agentId}&limit=6&approvalStatus=approved`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || data?.properties || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = parseSlug(params.slug);
  const agent = await fetchAgent(id);
  if (!agent) return { title: 'Agent Not Found | Think4BuySale' };

  const city = agent.city || 'India';
  const name = agent.name || 'Agent';
  return {
    title: `${name} – Real Estate Agent in ${city} | Think4BuySale`,
    description: `Contact ${name}, a verified real estate agent in ${city}. ${agent.agentBio || `${name} specializes in property buying, selling and renting in ${city}.`}`,
    keywords: `${name} real estate agent ${city}, property agent ${city}, buy sell property ${city}`,
    alternates: { canonical: `https://think4buysale.com/agent/${params.slug}` },
    openGraph: {
      title: `${name} – Real Estate Agent | Think4BuySale`,
      description: agent.agentBio || `Verified real estate agent in ${city}`,
      type: 'profile',
    },
  };
}

const TICK_BADGE: Record<string, { label: string; cls: string; icon: string }> = {
  blue:    { label: 'Verified',  cls: 'bg-blue-100 text-blue-700 border-blue-200',      icon: '✓' },
  gold:    { label: 'Gold',      cls: 'bg-amber-100 text-amber-700 border-amber-200',    icon: '★' },
  diamond: { label: 'Diamond',   cls: 'bg-violet-100 text-violet-700 border-violet-200', icon: '◆' },
};

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default async function AgentProfilePage({ params }: { params: Params }) {
  const { id } = parseSlug(params.slug);
  const [agent, listings] = await Promise.all([fetchAgent(id), fetchAgentListings(id)]);

  if (!agent) notFound();

  const tick = agent.agentTick && agent.agentTick !== 'none' ? TICK_BADGE[agent.agentTick] : null;
  const initials = agent.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'AG';
  const avatarBg: Record<string, string> = { none: 'bg-gray-400', blue: 'bg-blue-500', gold: 'bg-amber-500', diamond: 'bg-violet-600' };
  const bg = avatarBg[agent.agentTick || 'none'];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    telephone: agent.phone ? `+91${agent.phone}` : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: agent.city,
      addressCountry: 'IN',
    },
    description: agent.agentBio,
    url: `https://think4buysale.com/agent/${params.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-max py-3 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/agents" className="hover:text-primary-600 transition-colors">Agents</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{agent.name}</span>
          </div>
        </div>

        <div className="container-max py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
                {/* Avatar */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md ${bg}`}>
                    {initials}
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">{agent.name}</h1>
                  {tick && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border mb-2 ${tick.cls}`}>
                      {tick.icon} {tick.label} Agent
                    </span>
                  )}
                  {agent.company && <p className="text-sm text-gray-500">{agent.company}</p>}
                  {agent.city && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <MapPin className="w-3.5 h-3.5" />{agent.city}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 py-4 border-y border-gray-100">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{agent.totalDeals ?? 0}</div>
                    <div className="text-xs text-gray-400">Deals</div>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <div className="text-xl font-bold text-gray-900">{agent.agentExperience ?? 0}+</div>
                    <div className="text-xs text-gray-400">Yrs Exp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{listings.length}</div>
                    <div className="text-xs text-gray-400">Listings</div>
                  </div>
                </div>

                {/* Rating */}
                {agent.agentRating && (
                  <div className="flex items-center justify-center gap-1 mb-5">
                    {[1,2,3,4,5].map((s: number) => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(agent.agentRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                    ))}
                    <span className="text-sm text-gray-600 ml-1 font-semibold">{Number(agent.agentRating).toFixed(1)}</span>
                  </div>
                )}

                {/* RERA */}
                {agent.agentLicense && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl mb-5 border border-emerald-100">
                    <Award className="w-3.5 h-3.5" />
                    RERA: {agent.agentLicense}
                  </div>
                )}

                {/* CTA */}
                {agent.phone && (
                  <a
                    href={`tel:+91${agent.phone}`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors mb-3"
                  >
                    <Phone className="w-4 h-4" />
                    Call {agent.name?.split(' ')[0]}
                  </a>
                )}
                <Link
                  href={`/properties?agentId=${agent.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  <Building2 className="w-4 h-4" />
                  View All Listings
                </Link>
              </div>
            </div>

            {/* Right: Bio + Listings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {agent.agentBio && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-3 text-lg">About {agent.name}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{agent.agentBio}</p>
                </div>
              )}

              {/* Active Listings */}
              {listings.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 text-lg">Active Listings</h2>
                    <Link
                      href={`/properties?agentId=${agent.id}`}
                      className="text-sm text-primary-600 font-medium hover:underline"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {listings.slice(0, 6).map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/properties/${p.slug}`}
                        className="group block border border-gray-100 rounded-xl overflow-hidden hover:border-primary-200 hover:shadow-md transition-all"
                      >
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt={p.title} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <div className="p-3">
                          <div className="text-xs text-primary-600 font-semibold uppercase tracking-wide mb-1">{p.type?.replace(/_/g, ' ')}</div>
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{p.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin className="w-3 h-3" />{p.locality}, {p.city}
                          </div>
                          <div className="text-sm font-bold text-primary-700 mt-2">{formatPrice(p.price)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back link */}
              <Link href="/agents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to all agents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
