import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Building2,
  TrendingUp,
  Shield,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import HomeSearchPanel from '@/components/home/HomeSearchPanel';
import { HeroLiveBadge, HeroStatTiles } from '@/components/home/HeroLiveStats';
import CityRedirect from '@/components/home/CityRedirect';
import JsonLd, {
  buildWebSiteSchema,
  buildOrganizationSchema,
  buildLocalBusinessSchema,
  buildHomeFaqSchema,
} from '@/components/seo/JsonLd';
import CategoryGrid from '@/components/home/CategoryGrid';

// ─── Above-the-fold: import directly ─────────────────────────────────────────
import FeaturedProperties from '@/components/home/FeaturedProperties';
import HomeLocationSelector from '@/components/home/HomeLocationSelector';
import PlatformStatsCards from '@/components/home/PlatformStatsCards';
import CTAStatsText from '@/components/home/CTAStatsText';
import TopCitiesSection from '@/components/home/TopCitiesSection';

// ─── Below-the-fold: lazy-load with next/dynamic ─────────────────────────────
const TopCategories               = dynamic(() => import('@/components/home/TopCategories'),                    { ssr: true  });
const TopAgents                   = dynamic(() => import('@/components/home/TopAgents'),                          { ssr: true  });
const TopNewProjects              = dynamic(() => import('@/components/home/TopNewProjects'),                     { ssr: true  });
const TopLocalities               = dynamic(() => import('@/components/home/TopLocalities'),                      { ssr: false });
const TopDevelopers               = dynamic(() => import('@/components/home/TopDevelopers'),                      { ssr: false });
const NewProjectsDevelopersSection = dynamic(() => import('@/components/home/NewProjectsDevelopersSection'),      { ssr: false });
const ServicesBanner     = dynamic(() => import('@/components/home/ServicesBanner'),        { ssr: true  });
const TrendingProperties = dynamic(() => import('@/components/home/TrendingProperties'),   { ssr: true  });
const PropertyComparison = dynamic(() => import('@/components/home/PropertyComparison'),   { ssr: false });
const CityPriceSnapshot  = dynamic(() => import('@/components/home/CityPriceSnapshot'),   { ssr: true  });
const AIInsightsSection  = dynamic(() => import('@/components/home/AIInsightsSection'),   { ssr: true  });
const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), { ssr: true  });

// Non-critical / purely decorative sections — defer to client
const StatsBar = dynamic(() => import('@/components/home/StatsBar'), { ssr: false });

export const metadata: Metadata = {
  title: 'Think4BuySale – Buy, Rent & Sell Properties in India',
  description:
    "Think4BuySale – India's trusted real estate portal. 50,000+ verified properties in Mumbai, Delhi, Bangalore, Pune & more. Buy, Rent, Sell — Free listings.",
  openGraph: {
    title: "Think4BuySale – India's Trusted Real Estate Portal",
    description: 'Buy, Rent & Sell Properties across India. 50,000+ verified listings, best prices.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Think4BuySale Real Estate' }],
  },
  alternates: { canonical: '/' },
};

const QUICK_LINKS = [
  { label: 'Flats for Sale',      href: '/flats-for-sale-in-mumbai' },
  { label: 'Villas in Mumbai',    href: '/villas-for-sale-in-mumbai' },
  { label: 'Property for Rent',   href: '/property-for-rent-in-delhi' },
  { label: 'PG in Bangalore',     href: '/pg-in-bangalore' },
  { label: 'Office Space Delhi',  href: '/commercial-property-in-delhi' },
  { label: 'Plots in Hyderabad',  href: '/plots-for-sale-in-hyderabad' },
];


const TRUST_ITEMS = [
  'Every listing verified',
  'Owner contact masked',
  'RERA-checked agents',
  'No pay-to-rank',
  'Free forever for owners',
];

const WHY_US = [
  { icon: Shield,         title: 'Verified Listings',  desc: 'All properties verified by our expert team.',          color: 'bg-blue-50 text-blue-600'   },
  { icon: Building2,      title: 'Largest Database',   desc: 'Thousands of properties across Indian cities.',         color: 'bg-green-50 text-green-600' },
  { icon: TrendingUp,     title: 'Best Prices',        desc: 'Compare and get the best market deals.',               color: 'bg-orange-50 text-orange-600'},
  { icon: HeadphonesIcon, title: '24/7 Support',       desc: 'Expert team available round-the-clock.',               color: 'bg-purple-50 text-purple-600'},
];

export default function HomePage() {
  return (
    <>
      {/* Redirect to city page if user has a saved city in localStorage */}
      <CityRedirect />

      {/* ══════════════════════════════════════════════════════════════════════════
          HERO — one job: get the visitor into a search
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative rv-dark pt-14 md:pt-16">
        {/* Decorative layers — kept inside their own overflow-hidden wrapper so the
            search panel's dropdown can still spill below the section. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 rv-hero-glow" />
          <div className="absolute inset-0 rv-hero-grid" />
        </div>

        <div className="relative z-10 container-rv pt-5 sm:pt-9 lg:pt-13 pb-8 sm:pb-16 lg:pb-24">

          {/* ── Headline + live stat tiles ──────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-10 mb-5 sm:mb-6 lg:mb-[26px]">
            <div className="max-w-[700px]">
              <HeroLiveBadge />

              <h1 className="mt-3 sm:mt-4 text-[26px] sm:text-[40px] lg:text-[52px] font-extrabold text-white leading-[1.14] sm:leading-[1.06] tracking-[-0.025em]">
                Tell us what you want.
                <span className="block text-blue-300">We&apos;ll shortlist it for you.</span>
              </h1>

              <p className="hidden sm:block mt-3.5 max-w-xl text-[15px] lg:text-[17px] leading-relaxed text-slate-200/75">
                Buy, rent or sell across 500+ Indian cities. Type it the way you&apos;d say it — our
                search reads budget, BHK, locality and intent, then ranks only verified matches.
              </p>
              <p className="sm:hidden mt-2 text-[12.5px] leading-relaxed text-slate-200/65">
                Buy, rent or sell — verified listings, real owners, zero brokerage.
              </p>
            </div>

            {/* Live platform numbers — hidden on the smallest screens to keep the
                search panel above the fold */}
            <div className="hidden md:block lg:pb-1.5">
              <HeroStatTiles />
            </div>
          </div>

          {/* ── Search panel (all existing search behaviour preserved) ──────── */}
          <div className="relative">
            <HomeSearchPanel />
          </div>

          {/* ── "Try" chips + owner path ────────────────────────────────────── */}
          <div className="mt-4 sm:mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="-mx-4 flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-200/50 mr-0.5">
                Try
              </span>
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex-shrink-0 whitespace-nowrap rounded-full border border-white/[0.15] bg-white/[0.09] px-3 py-1.5 text-[12px] sm:text-[13px] font-medium text-white/85 transition-colors hover:bg-white/[0.18] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              href="/post-property"
              className="hidden sm:inline-flex flex-shrink-0 items-center gap-2 rounded-[10px] border border-yellow-300/35 bg-yellow-300/10 px-4 py-2.5 text-[13px] font-bold text-yellow-200 transition-colors hover:bg-yellow-300/20"
            >
              Owner or agent? List free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          ACTION CARDS — overlap the hero, then the trust strip
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 pb-6 sm:pb-10">
        <div className="container-rv">
          <div className="relative z-20 mt-4 sm:-mt-10 lg:-mt-14">
            <PlatformStatsCards />
          </div>

          <div className="-mx-4 mt-5 overflow-x-auto no-scrollbar px-4 sm:mx-0 sm:mt-[26px] sm:px-0">
            <div className="flex items-center justify-start gap-5 border-y border-gray-200/70 py-3 sm:justify-center sm:gap-7 sm:py-3.5">
              {TRUST_ITEMS.map((item) => (
                <span
                  key={item}
                  className="flex flex-shrink-0 items-center gap-2 text-[12px] sm:text-[13px] font-semibold text-gray-600"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          🔥 TRENDING NOW
      ══════════════════════════════════════════════════════════════════════════ */}
      <TrendingProperties />

      {/* ══════════════════════════════════════════════════════════════════════════
          FEATURED / RECOMMENDED PROPERTIES
      ══════════════════════════════════════════════════════════════════════════ */}
      <FeaturedProperties />

      {/* ══════════════════════════════════════════════════════════════════════════
          LATEST LISTINGS / TOP CATEGORIES
      ══════════════════════════════════════════════════════════════════════════ */}
      <TopCategories />

      {/* ══════════════════════════════════════════════════════════════════════════
          🏗️ NEW PROJECTS & TOP DEVELOPERS — unified city-aware section
          Shows "All India" tab + "{City}" tab; both new-launches & builders
      ══════════════════════════════════════════════════════════════════════════ */}
      <NewProjectsDevelopersSection />

      {/* ══════════════════════════════════════════════════════════════════════════
          NEW PROJECTS / TOP RESIDENTIAL  (standalone city-aware scroll)
      ══════════════════════════════════════════════════════════════════════════ */}
      <TopNewProjects />

      {/* ══════════════════════════════════════════════════════════════════════════
          TOP LOCALITIES
      ══════════════════════════════════════════════════════════════════════════ */}
      <TopLocalities />

      {/* ══════════════════════════════════════════════════════════════════════════
          TOP DEVELOPERS  (standalone card-per-builder scroll)
      ══════════════════════════════════════════════════════════════════════════ */}
      <TopDevelopers />

      {/* ══════════════════════════════════════════════════════════════════════════
          ⚖️ PROPERTY COMPARISON WIDGET
      ══════════════════════════════════════════════════════════════════════════ */}
      <PropertyComparison />

      {/* ══════════════════════════════════════════════════════════════════════════
          VERIFIED AGENTS
      ══════════════════════════════════════════════════════════════════════════ */}
      <TopAgents />

      {/* ══════════════════════════════════════════════════════════════════════════
          TOP RESIDENTIAL CITIES
      ══════════════════════════════════════════════════════════════════════════ */}
      <TopCitiesSection />

      {/* ══════════════════════════════════════════════════════════════════════════
          📊 CITY PRICE SNAPSHOT
      ══════════════════════════════════════════════════════════════════════════ */}
      <CityPriceSnapshot />

      {/* ══════════════════════════════════════════════════════════════════════════
          🧠 AI / SMART INSIGHTS
      ══════════════════════════════════════════════════════════════════════════ */}
      <AIInsightsSection />

      {/* ══════════════════════════════════════════════════════════════════════════
          DYNAMIC LOCATION SELECTOR
      ══════════════════════════════════════════════════════════════════════════ */}
      <HomeLocationSelector />

      {/* ══════════════════════════════════════════════════════════════════════════
          💬 TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ══════════════════════════════════════════════════════════════════════════
          CATEGORY GRID — "What Are You Looking For?"
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-7 sm:py-12 lg:py-13 bg-gray-50">
        <div className="container-rv">
          <div className="text-center mb-3 sm:mb-8">
            <h2 className="rv-h2">What Are You Looking For?</h2>
            <p className="rv-sub">Browse properties by category</p>
          </div>

          <CategoryGrid />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-7 sm:py-12 lg:py-13 bg-white border-t border-gray-100">
        <div className="container-rv">
          <div className="text-center mb-4 sm:mb-12">
            <h2 className="rv-h2">Why Choose Think4BuySale?</h2>
            <p className="rv-sub">Trusted by millions of home buyers &amp; sellers</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {WHY_US.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group text-center p-3 sm:p-6 rounded-2xl border border-gray-100 hover:shadow-card-hover transition-all duration-300"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-7 sm:mt-12 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex sm:flex-wrap items-center justify-start sm:justify-center gap-4 sm:gap-6 pb-1">
              {['RERA Registered Agents', 'SSL Secured Platform', 'ISO 9001 Certified', 'RBI Approved Partners'].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SERVICES BANNER
      ══════════════════════════════════════════════════════════════════════════ */}
      <ServicesBanner />

      {/* ══════════════════════════════════════════════════════════════════════════
          LIST YOUR PROPERTY — SEO + CTA (free listing)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-8 sm:py-13 lg:py-14">
        <div className="container-rv">
          <div className="grid overflow-hidden rounded-2xl border border-gray-200/80 lg:grid-cols-[1.25fr_1fr]">

            {/* ── Left: the pitch ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden rv-dark px-6 py-8 sm:px-10 sm:py-10">
              <div className="absolute inset-0 rv-cta-glow pointer-events-none" />
              <div className="relative z-10">
                <div><CTAStatsText /></div>
                <p className="rv-eyebrow mt-1 flex text-yellow-200">For owners &amp; agents</p>
                <h2 className="mt-3 text-[24px] sm:text-[30px] lg:text-[32px] font-extrabold leading-[1.2] tracking-[-0.025em] text-white">
                  List free. Your number stays masked until you say so.
                </h2>
                <p className="mt-3 max-w-[520px] text-[13.5px] sm:text-[15px] leading-relaxed text-slate-200/70">
                  Think4BuySale connects property owners, real estate agents and home buyers across
                  500+ cities in India. Whether you want to{' '}
                  <strong className="font-semibold text-white">sell a flat</strong>,{' '}
                  <strong className="font-semibold text-white">rent an apartment</strong>, or{' '}
                  <strong className="font-semibold text-white">buy residential plots</strong> — post
                  in under two minutes with no brokerage, no pay-to-rank and no spam calls.
                </p>

                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <Link
                    href="/post-property"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                  >
                    Post property free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.16]"
                  >
                    Talk to an advisor
                  </Link>
                </div>

                <div className="mt-7 flex gap-7 sm:gap-9">
                  {[
                    { v: '2 min', s: 'to publish' },
                    { v: '₹0',    s: 'forever, unlimited' },
                    { v: '50K+',  s: 'active buyers' },
                  ].map(({ v, s }) => (
                    <div key={s}>
                      <p className="text-xl sm:text-[22px] font-extrabold text-white">{v}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-300/60">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: why owners choose us ─────────────────────────────── */}
            <div className="bg-white px-6 py-8 sm:px-8 sm:py-9">
              <p className="text-[13px] font-extrabold text-gray-900">Why owners &amp; buyers choose us</p>
              <p className="mt-1 text-[12.5px] text-gray-500">Six things bigger portals charge you for</p>

              <div className="mt-5 flex flex-col gap-4">
                {[
                  {
                    title: 'Genuine, Verified Property Listings',
                    desc: 'Every listing on Think4BuySale is reviewed for accuracy. Browse verified flats, residential plots, independent houses, villas, and commercial spaces — zero fake listings, real photos, real prices.',
                  },
                  {
                    title: 'Instant Visibility Across 500+ Indian Cities',
                    desc: 'Your property listing gets indexed on Google within hours. Buyers searching for "flats for sale in [your city]" or "plots near [your locality]" discover your listing organically — no paid ads needed.',
                  },
                  {
                    title: 'Privacy-First — Your Number Stays Safe',
                    desc: 'We mask your phone number until you choose to connect. Only genuine, verified buyers reach you — no spam calls, no broker harassment, no unwanted solicitations.',
                  },
                  {
                    title: 'Completely Free — No Subscription, No Commission',
                    desc: 'Post unlimited residential and commercial properties at absolutely zero cost. No monthly fees, no pay-to-rank upgrades required. Individual owners and registered agents list for free, forever.',
                  },
                  {
                    title: 'Dedicated Support for Every User',
                    desc: 'New to online property listing? Our real estate advisors help you write compelling descriptions, set the right asking price, and attract more buyer inquiries — faster than traditional classifieds.',
                  },
                  {
                    title: 'One Platform for Buyers, Sellers & Agents',
                    desc: 'Think4BuySale is purpose-built for all real estate needs in India — buy a home, rent a flat, sell a plot, discover new residential projects, or build your real estate agency profile.',
                  },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                    </span>
                    <div>
                      <h3 className="text-[13.5px] font-bold text-gray-800">{title}</h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4">
                <span className="text-[11.5px] font-semibold text-gray-400">
                  RERA registered · SSL secured · ISO 9001
                </span>
                <Link href="/properties" className="rv-link ml-auto">
                  Browse listings
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured data — Website, Organization, LocalBusiness, FAQ for AI Overviews */}
      <JsonLd schema={[
        buildWebSiteSchema(process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com'),
        buildOrganizationSchema(process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com'),
        buildLocalBusinessSchema(process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com'),
        buildHomeFaqSchema(),
      ]} />
    </>
  );
}
