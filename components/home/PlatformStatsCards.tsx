'use client';

import Link from 'next/link';
import {
  Home, Users, MapPin, Search,
  ArrowRight, BadgeCheck, Gem, Star,
  TrendingUp, Building2, ChevronRight,
} from 'lucide-react';

// ─── Card definitions ─────────────────────────────────────────────────────────

const CARDS = [
  {
    id:       'post',
    href:     '/post-property',
    tag:      'FREE LISTING',
    tagColor: 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30',
    gradient: 'from-[#1a56db] via-[#1e429f] to-[#1a3a8f]',
    glow:     'shadow-blue-500/20',
    accent:   '#60a5fa',
    icon:     <Home className="w-6 h-6 text-white" />,
    iconBg:   'bg-white/15',
    title:    'Post Your Property Ads for Free !!',
    desc:     'List Your Property and reach lakhs of buyers across India — no hidden charges.',
    cta:      'Post Now',
    ctaCls:   'bg-white text-blue-700 hover:bg-blue-50',
    stats:    [
      { icon: <TrendingUp className="w-3 h-3" />, label: '50K+ Active Listings' },
      { icon: <BadgeCheck className="w-3 h-3" />, label: 'Verified Buyers' },
    ],
    pattern:  'circles',
  },
  {
    id:       'agents',
    href:     '/agents',
    tag:      'TOP AGENTS',
    tagColor: 'bg-violet-400/20 text-violet-100 border border-violet-400/30',
    gradient: 'from-[#7c3aed] via-[#6d28d9] to-[#5b21b6]',
    glow:     'shadow-violet-500/20',
    accent:   '#c4b5fd',
    icon:     <Users className="w-6 h-6 text-white" />,
    iconBg:   'bg-white/15',
    title:    'Top Real Estate Agents & Property Dealers in India',
    desc:     'Find RERA-certified, Diamond & Gold verified agents in your city.',
    cta:      'Explore Agents',
    ctaCls:   'bg-white text-violet-700 hover:bg-violet-50',
    stats:    [
      { icon: <Gem className="w-3 h-3" />,        label: 'Diamond Certified' },
      { icon: <BadgeCheck className="w-3 h-3" />, label: '10K+ Verified Agents' },
    ],
    pattern:  'grid',
  },
  {
    id:       'cities',
    href:     '/properties',
    tag:      'EXPLORE',
    tagColor: 'bg-teal-400/20 text-teal-100 border border-teal-400/30',
    gradient: 'from-[#047857] via-[#065f46] to-[#064e3b]',
    glow:     'shadow-emerald-500/20',
    accent:   '#6ee7b7',
    icon:     <MapPin className="w-6 h-6 text-white" />,
    iconBg:   'bg-white/15',
    title:    "Explore India's Top Residential Cities",
    desc:     'Discover properties in 50+ cities — from metro apartments to luxury villas.',
    cta:      'Browse Cities',
    ctaCls:   'bg-white text-emerald-700 hover:bg-emerald-50',
    stats:    [
      { icon: <Building2 className="w-3 h-3" />,  label: '50+ Cities' },
      { icon: <Star className="w-3 h-3" />,       label: 'Curated Listings' },
    ],
    pattern:  'dots',
  },
  {
    id:       'find',
    href:     '/find-property',
    tag:      'FREE HELP',
    tagColor: 'bg-amber-400/20 text-amber-100 border border-amber-400/30',
    gradient: 'from-[#b45309] via-[#92400e] to-[#78350f]',
    glow:     'shadow-amber-500/20',
    accent:   '#fcd34d',
    icon:     <Search className="w-6 h-6 text-white" />,
    iconBg:   'bg-white/15',
    title:    'Helping You Find Your Dream Property',
    desc:     'Share your buying requirement — our experts match you with the best options.',
    cta:      'Get Started Free',
    ctaCls:   'bg-white text-amber-700 hover:bg-amber-50',
    stats:    [
      { icon: <Users className="w-3 h-3" />,      label: 'Expert Matching' },
      { icon: <BadgeCheck className="w-3 h-3" />, label: 'No Brokerage' },
    ],
    pattern:  'waves',
  },
] as const;

// ─── Background pattern SVGs ──────────────────────────────────────────────────

function PatternCircles() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80%" cy="10%" r="60" fill="white" />
      <circle cx="90%" cy="60%" r="90" fill="white" />
      <circle cx="60%" cy="90%" r="40" fill="white" />
    </svg>
  );
}
function PatternGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
function PatternDots() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}
function PatternWaves() {
  return (
    <svg className="absolute bottom-0 left-0 w-full opacity-10" viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,40 Q100,10 200,40 T400,40 V80 H0Z" fill="white"/>
    </svg>
  );
}

const PATTERNS: Record<string, React.ReactNode> = {
  circles: <PatternCircles />,
  grid:    <PatternGrid />,
  dots:    <PatternDots />,
  waves:   <PatternWaves />,
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlatformStatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map(card => (
        <Link
          key={card.id}
          href={card.href}
          className={`group relative bg-gradient-to-br ${card.gradient} rounded-2xl overflow-hidden shadow-lg ${card.glow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col min-h-[200px] p-5`}
        >
          {/* Background pattern */}
          {PATTERNS[card.pattern]}

          {/* Glow orb */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />

          <div className="relative flex flex-col h-full gap-4">

            {/* Top row: icon + tag */}
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center backdrop-blur-sm border border-white/10`}>
                {card.icon}
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-wider ${card.tagColor}`}>
                {card.tag}
              </span>
            </div>

            {/* Text */}
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-white leading-snug">
                {card.title}
              </h3>
              <p className="text-xs mt-1.5 text-white/70 leading-relaxed">
                {card.desc}
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-1.5">
              {card.stats.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/15 text-white/90 px-2.5 py-1 rounded-full border border-white/10">
                  <span className="text-white/70">{s.icon}</span>{s.label}
                </span>
              ))}
            </div>

            {/* CTA button */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all ${card.ctaCls} shadow-sm`}>
                {card.cta}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
            </div>

          </div>
        </Link>
      ))}
    </div>
  );
}
