'use client';

import Link from 'next/link';
import { Home, Users, MapPin, Search, ArrowRight } from 'lucide-react';

const CARDS = [
  {
    id:      'post',
    href:    '/post-property',
    tag:     'FREE LISTING',
    color:   '#1a56db',
    icon:    <Home className="w-5 h-5 text-white" />,
    title:   'Post Property Free',
    stat:    '50K+ Active Listings',
    cta:     'Post Now',
  },
  {
    id:      'agents',
    href:    '/agents',
    tag:     'TOP AGENTS',
    color:   '#6d28d9',
    icon:    <Users className="w-5 h-5 text-white" />,
    title:   'Find Top Agents',
    stat:    '10K+ Verified Agents',
    cta:     'Explore',
  },
  {
    id:      'cities',
    href:    '/properties',
    tag:     'EXPLORE',
    color:   '#065f46',
    icon:    <MapPin className="w-5 h-5 text-white" />,
    title:   'Top Cities',
    stat:    '50+ Cities Covered',
    cta:     'Browse',
  },
  {
    id:      'find',
    href:    '/find-property',
    tag:     'FREE HELP',
    color:   '#b45309',
    icon:    <Search className="w-5 h-5 text-white" />,
    title:   'Find Your Property',
    stat:    'No Brokerage',
    cta:     'Get Help',
  },
] as const;

export default function PlatformStatsCards() {
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
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {card.title}
          </p>

          {/* Stat */}
          <p className="text-[11px] text-gray-500 font-medium">{card.stat}</p>

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
