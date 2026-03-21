'use client';

import { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  role: 'buyer' | 'seller' | 'agent' | 'renter';
  avatar: string; // emoji fallback
  rating: number;
  title: string;
  text: string;
  propertyType: string;
  verified: boolean;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Rahul Sharma',
    location: 'Delhi',
    role: 'buyer',
    avatar: '👨‍💼',
    rating: 5,
    title: 'Found my dream home in 3 weeks!',
    text: "I was skeptical at first, but Think4BuySale showed me 50+ verified 3 BHK options in Dwarka within my budget. The price comparison feature saved me from overpaying. Closed the deal in just 3 weeks!",
    propertyType: '3 BHK Apartment, Delhi',
    verified: true,
  },
  {
    id: 2,
    name: 'Priya Mehta',
    location: 'Bangalore',
    role: 'renter',
    avatar: '👩‍💻',
    rating: 5,
    title: 'No broker harassment, zero hidden fees',
    text: "As a working professional relocating to Bangalore, I needed a flat fast. The direct owner connect was a game-changer — no broker middlemen, and my phone was never shared without consent. Highly recommend!",
    propertyType: '2 BHK Flat, Whitefield',
    verified: true,
  },
  {
    id: 3,
    name: 'Arun Patel',
    location: 'Mumbai',
    role: 'agent',
    avatar: '👨‍💼',
    rating: 5,
    title: 'My lead volume doubled in 2 months',
    text: "As a RERA-certified agent in Mumbai, I was struggling with lead quality on other platforms. Think4BuySale's agent dashboard gives me genuine buyer enquiries. My conversion rate improved by 40%.",
    propertyType: 'Real Estate Agent, Thane',
    verified: true,
  },
  {
    id: 4,
    name: 'Sunita Krishnan',
    location: 'Chennai',
    role: 'seller',
    avatar: '👩‍🦱',
    rating: 5,
    title: 'Sold my flat 3 months ahead of target',
    text: "I listed my 2 BHK in Adyar and got 12 genuine inquiries in the first week. The free listing with boost option gave me premium visibility. Got a buyer at above asking price. Absolutely brilliant platform!",
    propertyType: '2 BHK, Adyar, Chennai',
    verified: true,
  },
  {
    id: 5,
    name: 'Vikram Singh',
    location: 'Pune',
    role: 'buyer',
    avatar: '👨‍🦰',
    rating: 4,
    title: 'The comparison tool is incredibly useful',
    text: "The property comparison feature helped me shortlist from 15 properties down to 3. The price-per-sqft breakdown made it easy to spot overpriced listings. Eventually bought a great flat in Hinjewadi.",
    propertyType: '2 BHK Apartment, Pune',
    verified: true,
  },
  {
    id: 6,
    name: 'Anjali Desai',
    location: 'Hyderabad',
    role: 'buyer',
    avatar: '👩‍🔬',
    rating: 5,
    title: 'AI insights helped me pick the right locality',
    text: "The market intelligence section showed me that Gachibowli prices were set to rise faster than other areas. I invested there and saw a 15% appreciation in 8 months. Data-driven buying is the future!",
    propertyType: '3 BHK Flat, Hyderabad',
    verified: true,
  },
];

const ROLE_COLORS: Record<Testimonial['role'], string> = {
  buyer:  'bg-blue-100 text-blue-700',
  seller: 'bg-green-100 text-green-700',
  agent:  'bg-purple-100 text-purple-700',
  renter: 'bg-orange-100 text-orange-700',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
          )}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ t, featured = false }: { t: Testimonial; featured?: boolean }) {
  return (
    <div className={cn(
      'flex flex-col rounded-2xl border transition-all duration-300 bg-white',
      featured
        ? 'border-primary-200 shadow-[0_4px_24px_rgba(37,99,235,0.1)] p-5 sm:p-7'
        : 'border-gray-100 p-5 hover:border-primary-100 hover:shadow-card-hover',
    )}>
      {/* Quote icon */}
      <Quote className="w-6 h-6 text-primary-100 mb-3 flex-shrink-0" />

      {/* Rating */}
      <div className="flex items-center gap-2 mb-2">
        <StarRating rating={t.rating} />
        {t.verified && (
          <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">✓ Verified</span>
        )}
      </div>

      {/* Title */}
      <h4 className={cn('font-bold text-gray-900 mb-2', featured ? 'text-base sm:text-lg' : 'text-sm')}>{t.title}</h4>

      {/* Body */}
      <p className={cn('text-gray-500 leading-relaxed flex-1', featured ? 'text-sm sm:text-base' : 'text-xs sm:text-sm')}>
        &ldquo;{t.text}&rdquo;
      </p>

      {/* Divider */}
      <div className="border-t border-gray-50 mt-4 pt-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
          {t.avatar}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t.name}</p>
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            📍 {t.location} · {t.propertyType}
          </p>
        </div>

        {/* Role badge */}
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full capitalize flex-shrink-0', ROLE_COLORS[t.role])}>
          {t.role}
        </span>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [page, setPage] = useState(0);
  const perPage = 3;
  const pages = Math.ceil((TESTIMONIALS.length - 1) / perPage);
  const rest = TESTIMONIALS.slice(1);
  const visible = rest.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="py-5 sm:py-14 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Real Stories</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Trusted by 10,000+ Families
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            See how Indians are finding their dream properties on Think4BuySale
          </p>

          {/* Aggregate rating */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-black text-gray-900">4.9</span>
            <span className="text-sm text-gray-500">/ 5 · Based on 2,400+ reviews</span>
          </div>
        </div>

        {/* Featured testimonial */}
        <div className="mb-5 sm:mb-8">
          <TestimonialCard t={TESTIMONIALS[0]} featured />
        </div>

        {/* Paginated grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {visible.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'w-9 h-9 rounded-xl text-sm font-medium transition-all',
                  i === page ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-500 hover:border-primary-200'
                )}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page === pages - 1}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats strip */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: '4.9★', label: 'Avg. Rating', sub: 'on Google & App Store' },
            { value: '98%', label: 'Satisfaction', sub: 'among buyers & renters' },
            { value: '2400+', label: 'Reviews', sub: 'verified & authentic' },
            { value: '10K+', label: 'Families', sub: 'found their dream home' },
          ].map(({ value, label, sub }) => (
            <div key={label} className="text-center bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-2xl font-black text-primary-700">{value}</p>
              <p className="text-xs font-bold text-gray-900 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
