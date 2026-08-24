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
    icon:  <Home className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />,
    title: 'Post Property Free',
    stat:  'List in minutes, reach buyers',
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
    : '/property-for-sale-rent-in-top-cities';

  const citiesStat = selectedCity
    ? `Browse listings in ${selectedCity}`
    : selectedState
    ? `Browse cities in ${selectedState}`
    : selectedCountry
    ? `Explore states in ${selectedCountry}`
    : 'Top residential markets';

  const citiesTag = selectedCity || selectedState ? 'IN YOUR AREA' : 'EXPLORE';

  // ── Agents card — href changes based on selected location ─────────────────
  const agentsHref = selectedCity
    ? `/property-agents-in/${toSlug(selectedCity)}`
    : selectedState
    ? `/property-agents-in/${toSlug(selectedState)}`
    : '/agents';

  const agentsStat = selectedCity
    ? `Local agents in ${selectedCity}`
    : selectedState
    ? `Local agents in ${selectedState}`
    : 'Verified & RERA registered';

  const agentsTag = selectedCity || selectedState ? 'LOCAL AGENTS' : 'TOP AGENTS';

  const CARDS = [
    ...STATIC_CARDS,
    {
      id:    'agents',
      href:  agentsHref,
      tag:   agentsTag,
      color: '#6d28d9',
      icon:  <Users className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />,
      title: 'Find Top Agents',
      stat:  agentsStat,
      cta:   'Explore',
    },
    {
      id:    'cities',
      href:  citiesHref,
      tag:   citiesTag,
      color: '#065f46',
      icon:  <MapPin className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />,
      title: selectedCity ? `Properties in ${selectedCity}` : selectedState ? `Properties in ${selectedState}` : 'Top Cities',
      stat:  citiesStat,
      cta:   'Browse',
    },
    {
      id:    'find',
      href:  '/find-property',
      tag:   'FREE HELP',
      color: '#b45309',
      icon:  <Search className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />,
      title: 'Find Your Property',
      stat:  'No Brokerage',
      cta:   'Get Help',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3.5">
      {CARDS.map(card => (
        <Link
          key={card.id}
          href={card.href}
          className="rv-card rv-card-hover group flex flex-col gap-1.5 p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.06)] sm:gap-2.5 sm:p-[18px]"
        >
          {/* Glyph + tag row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] sm:h-[34px] sm:w-[34px] sm:rounded-[10px]"
              style={{ backgroundColor: `${card.color}14`, color: card.color }}
            >
              {card.icon}
            </span>
            <span
              className="truncate rounded-md px-1.5 py-[3px] text-[8.5px] font-extrabold uppercase tracking-[0.09em] sm:px-2 sm:py-1 sm:text-[10px] sm:tracking-[0.1em]"
              style={{ backgroundColor: `${card.color}14`, color: card.color }}
            >
              {card.tag}
            </span>
          </div>

          <div>
            <p className="text-[13px] font-bold leading-tight text-gray-900 line-clamp-1 sm:text-[15px]">
              {card.title}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-gray-500 line-clamp-2 sm:mt-[3px] sm:text-[12.5px]">
              {card.stat}
            </p>
          </div>

          {/* CTA — desktop only; the whole card is tappable on mobile */}
          <span
            className="mt-auto hidden items-center gap-1.5 pt-1 text-[12.5px] font-bold sm:flex"
            style={{ color: card.color }}
          >
            {card.cta}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
