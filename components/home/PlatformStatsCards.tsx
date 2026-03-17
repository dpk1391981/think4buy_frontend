'use client';

import Link from 'next/link';
import { Home, Users, MapPin, Search, ArrowRight } from 'lucide-react';
import { useAppSelector } from '@/lib/store';

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const STATIC_CARDS = [
  {
    id:    'post',
    href:  '/post-property',
    tag:   'FREE LISTING',
    color: '#1a56db',
    icon:  <Home className="w-5 h-5 text-white" />,
    title: 'Post Property Free',
    stat:  '50K+ Active Listings',
    cta:   'Post Now',
  },
] as const;

export default function PlatformStatsCards() {
  const selectedCountry = useAppSelector(s => s.ui.selectedCountry);
  const selectedState   = useAppSelector(s => s.ui.selectedState);
  const selectedCity    = useAppSelector(s => s.ui.selectedCity);

  // ── Cities card — href changes based on selected location ─────────────────
  const citiesHref = selectedCity
    ? `/property-in-${toSlug(selectedCity)}`
    : selectedState
    ? `/properties-in-${toSlug(selectedState)}`
    : selectedCountry
    ? `/property-for-sale-rent-in-${toSlug(selectedCountry)}`
    : '/property-for-sale-rent-in-india';

  const citiesStat = selectedCity
    ? `Properties in ${selectedCity}`
    : selectedState
    ? `Cities in ${selectedState}`
    : selectedCountry
    ? `States in ${selectedCountry}`
    : '50+ Cities Covered';

  const citiesTag = selectedCity || selectedState ? 'IN YOUR AREA' : 'EXPLORE';

  // ── Agents card — href changes based on selected location ─────────────────
  const agentsHref = selectedCity
    ? `/property-agents-in/${toSlug(selectedCity)}`
    : selectedState
    ? `/property-agents-in/${toSlug(selectedState)}`
    : '/agents';

  const agentsStat = selectedCity
    ? `Agents in ${selectedCity}`
    : selectedState
    ? `Agents in ${selectedState}`
    : '10K+ Verified Agents';

  const agentsTag = selectedCity || selectedState ? 'LOCAL AGENTS' : 'TOP AGENTS';

  const CARDS = [
    ...STATIC_CARDS,
    {
      id:    'agents',
      href:  agentsHref,
      tag:   agentsTag,
      color: '#6d28d9',
      icon:  <Users className="w-5 h-5 text-white" />,
      title: 'Find Top Agents',
      stat:  agentsStat,
      cta:   'Explore',
    },
    {
      id:    'cities',
      href:  citiesHref,
      tag:   citiesTag,
      color: '#065f46',
      icon:  <MapPin className="w-5 h-5 text-white" />,
      title: selectedCity ? `Properties in ${selectedCity}` : selectedState ? `Properties in ${selectedState}` : 'Top Cities',
      stat:  citiesStat,
      cta:   'Browse',
    },
    {
      id:    'find',
      href:  '/find-property',
      tag:   'FREE HELP',
      color: '#b45309',
      icon:  <Search className="w-5 h-5 text-white" />,
      title: 'Find Your Property',
      stat:  'No Brokerage',
      cta:   'Get Help',
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {CARDS.map(card => (
        <Link
          key={card.id}
          href={card.href}
          className="group relative bg-white rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col px-4 py-3.5 gap-2"
          style={{ border: `1.5px solid ${card.color}40` }}
        >
          {/* Tag + Icon row */}
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] font-extrabold tracking-widest uppercase"
              style={{ color: card.color }}
            >
              {card.tag}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: card.color }}
            >
              {card.icon}
            </div>
          </div>

          {/* Title */}
          <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">
            {card.title}
          </p>

          {/* Stat */}
          <p className="text-[11px] text-gray-500 font-medium line-clamp-1">{card.stat}</p>

          {/* CTA */}
          <div
            className="flex items-center gap-1 mt-0.5 self-start px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${card.color}15` }}
          >
            <span
              className="text-[11px] font-extrabold transition-colors"
              style={{ color: card.color }}
            >
              {card.cta}
            </span>
            <ArrowRight
              className="w-3 h-3 group-hover:translate-x-0.5 transition-all"
              style={{ color: card.color }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
