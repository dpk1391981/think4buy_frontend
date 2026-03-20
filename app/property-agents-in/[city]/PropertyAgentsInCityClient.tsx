'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Phone, Star, Shield, Briefcase, Zap,
  ChevronRight, MapPin, CheckCircle, Users, TrendingUp,
  Award, Search,
} from 'lucide-react';
import { agencyApi, usersApi, leadsApi } from '@/lib/api';
import { resolveImageUrl } from '@/lib/imageUtils';
import { WhatsAppButton, WhatsAppIcon } from '@/components/common/PhoneRevealButton';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  isPremiumSlot?: boolean;
  authorityScore?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TICK: Record<string, { label: string; cls: string; icon: string }> = {
  diamond: { label: 'Diamond', cls: 'bg-violet-100 text-violet-700 border-violet-300', icon: '◆' },
  gold:    { label: 'Gold',    cls: 'bg-amber-100 text-amber-700 border-amber-300',    icon: '★' },
  blue:    { label: 'Verified',cls: 'bg-blue-100 text-blue-700 border-blue-300',       icon: '✓' },
};

function buildSlug(a: Agent) {
  const n = (a.name || 'agent').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!a.city) return n;
  const c = a.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${n}-in-${c}`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Lead Capture Modal ───────────────────────────────────────────────────────

function LeadModal({
  agent,
  city,
  onClose,
}: {
  agent: Agent;
  city: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', phone: '', requirement: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      await leadsApi.capturePublic({
        contactName: form.name,
        contactPhone: form.phone,
        city,
        requirement: form.requirement || `Looking for property in ${city}`,
        source: 'featured_agent_click',
        sourceRef: agent.id,
      });
      setSent(true);
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Contact {agent.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">We'll send your details to the agent</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-bold text-gray-900 mb-1">Request Sent!</h4>
            <p className="text-sm text-gray-500">{agent.name} will contact you shortly.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {[
              { key: 'name',   label: 'Your Name *',  type: 'text', placeholder: 'Full name' },
              { key: 'phone',  label: 'Phone Number *',type: 'tel',  placeholder: '+91 9876543210' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.label.includes('*')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Requirement (optional)</label>
              <textarea
                value={form.requirement}
                onChange={e => setForm(p => ({ ...p, requirement: e.target.value }))}
                placeholder={`2BHK flat in ${city} under 80 lakh...`}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !form.name || !form.phone}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, city, onContact }: { agent: Agent; city: string; onContact: (a: Agent) => void }) {
  const rating = Number(agent.agentRating ?? 0);
  const tick = agent.agentTick || 'none';
  const tickConf = TICK[tick];
  const slug = buildSlug(agent);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${agent.isPremiumSlot ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100 hover:border-primary-200'}`}>
      {/* Premium banner */}
      {agent.isPremiumSlot && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-1.5 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-white" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wide">Featured Agent — Sponsored</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {agent.avatar ? (
              <img
                src={resolveImageUrl(agent.avatar)}
                alt={agent.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                {getInitials(agent.name)}
              </div>
            )}
            {agent.isVerified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white fill-white" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/agents/${slug}`} className="font-bold text-gray-900 hover:text-primary-600 transition-colors">
                  {agent.company || agent.name}
                </Link>
                {agent.company && (
                  <p className="text-xs text-gray-500 mt-0.5">{agent.name}</p>
                )}
              </div>
              {tickConf && (
                <span className={`flex-shrink-0 flex items-center gap-0.5 text-[10px] font-semibold border px-2 py-0.5 rounded-full ${tickConf.cls}`}>
                  {tickConf.icon} {tickConf.label}
                </span>
              )}
            </div>

            {/* Rating + location */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
                </div>
              )}
              {agent.agentExperience !== undefined && agent.agentExperience > 0 && (
                <span className="text-xs text-gray-500">{agent.agentExperience} yrs exp</span>
              )}
              {agent.totalDeals !== undefined && agent.totalDeals > 0 && (
                <span className="text-xs text-gray-500">{agent.totalDeals}+ deals</span>
              )}
              {agent.city && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />{agent.city}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Stats */}
        {(agent.agentUsedQuota || agent.totalDeals || agent.agentExperience) ? (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Listings', value: agent.agentUsedQuota || 0 },
              { label: 'Deals', value: agent.totalDeals || 0 },
              { label: 'Exp (yrs)', value: agent.agentExperience || 0 },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                <div className="text-sm font-bold text-gray-800">{s.value}+</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onContact(agent)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />Contact
          </button>
          {agent.phone && (
            <WhatsAppButton
              phone={agent.phone}
              message={`Hi, I found your profile on Think4BuySale. Looking for property in ${city}.`}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />WhatsApp
            </WhatsAppButton>
          )}
          <Link
            href={`/agents/${slug}`}
            className="flex items-center justify-center px-4 py-2.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Profile <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Client Component ───────────────────────────────────────────────

interface Props {
  city: string;
  citySlug: string;
}

export default function PropertyAgentsInCityClient({ city, citySlug }: Props) {
  const [premiumAgents, setPremiumAgents] = useState<any[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [contactAgent, setContactAgent] = useState<Agent | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      agencyApi.getPremiumAgents(city),
      usersApi.getAgents({ city, limit: 50 }),
    ]).then(([premRes, agentsRes]) => {
      if (premRes.status === 'fulfilled' && Array.isArray(premRes.value.data)) {
        setPremiumAgents(premRes.value.data);
      }
      if (agentsRes.status === 'fulfilled') {
        const items = agentsRes.value.data?.items || agentsRes.value.data || [];
        setAllAgents(Array.isArray(items) ? items : []);
      }
    }).finally(() => setLoading(false));
  }, [city]);

  const filtered = allAgents
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.company || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'rating')     return (Number(b.agentRating) || 0) - (Number(a.agentRating) || 0);
      if (sortBy === 'deals')      return (b.totalDeals || 0) - (a.totalDeals || 0);
      if (sortBy === 'experience') return (b.agentExperience || 0) - (a.agentExperience || 0);
      if (sortBy === 'listings')   return (b.agentUsedQuota || 0) - (a.agentUsedQuota || 0);
      return 0;
    });

  // Map premium slot agentIds to full agent objects
  const premiumEnriched: Agent[] = premiumAgents.map(slot => {
    const full = allAgents.find(a => a.id === slot.agentId);
    return full
      ? { ...full, isPremiumSlot: true }
      : {
          id: slot.id,
          name: slot.agentName || 'Featured Agent',
          avatar: slot.agentAvatar,
          phone: slot.agentPhone,
          city,
          isPremiumSlot: true,
        } as Agent;
  });

  const organicAgents = filtered.filter(a => !premiumAgents.find(s => s.agentId === a.id));

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white py-12">
        <div className="container-max max-w-5xl">
          <div className="flex items-center gap-2 text-primary-400 text-sm mb-3">
            <Link href="/agents" className="hover:text-white transition-colors">Find Agents</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{city}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Property Agents in {city}
          </h1>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl">
            Connect with RERA-certified real estate agents and brokers in {city}.
            Experts for buying, selling & renting — free consultation.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { icon: <Users className="w-4 h-4" />, label: `${allAgents.length}+ Active Agents` },
              { icon: <Shield className="w-4 h-4" />, label: 'RERA Verified' },
              { icon: <Award className="w-4 h-4" />, label: 'Free Consultation' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-gray-300">
                <span className="text-primary-400">{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-max max-w-5xl py-8">

        {/* ── PREMIUM FEATURED AGENTS ── */}
        {(loading || premiumEnriched.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 text-xs font-bold uppercase tracking-wider">Top Featured Agents</span>
              </div>
              <span className="text-gray-400 text-xs">Sponsored · Highest ranked in {city}</span>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {premiumEnriched.map(agent => (
                  <AgentCard key={agent.id} agent={agent} city={city} onContact={setContactAgent} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SEARCH + SORT BAR ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents by name or agency..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="rating">Top Rated</option>
            <option value="deals">Most Deals</option>
            <option value="experience">Most Experienced</option>
            <option value="listings">Most Listings</option>
          </select>
          <span className="text-xs text-gray-400 font-medium">{organicAgents.length} agents found</span>
        </div>

        {/* ── ORGANIC AGENT LIST ── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : organicAgents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">No agents found in {city}</p>
            <Link href="/agents" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
              View all agents across India
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {organicAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} city={city} onContact={setContactAgent} />
            ))}
          </div>
        )}

        {/* ── SEO CONTENT BLOCK ── */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Why Use a Real Estate Agent in {city}?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600 leading-relaxed">
            {[
              `Buying or renting property in ${city} can be complex. A verified agent knows market prices, locality trends, and negotiation tactics that save you lakhs.`,
              `Our ${city} agents are RERA-certified and verified by Think4BuySale. They have in-depth knowledge of ${city}'s top localities, project launches, and resale hotspots.`,
              `Agents handle documentation, legal checks, home loans, and possession formalities — saving you dozens of hours and avoiding costly mistakes.`,
              `Whether it's a 1BHK flat, luxury villa, or commercial office in ${city}, our agents specialize across all property types and price ranges.`,
            ].map((text, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/property-for-sale-in-${citySlug}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors"
            >
              🏠 Buy Property in {city}
            </Link>
            <Link
              href={`/property-for-rent-in-${citySlug}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              🔑 Rent Property in {city}
            </Link>
            <Link
              href={`/new-projects-in-${citySlug}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
            >
              🏗️ New Projects in {city}
            </Link>
          </div>
        </div>
      </div>

      {/* Lead capture modal */}
      {contactAgent && (
        <LeadModal
          agent={contactAgent}
          city={city}
          onClose={() => setContactAgent(null)}
        />
      )}
    </div>
  );
}
