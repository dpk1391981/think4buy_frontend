import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Building2,
  TrendingUp,
  Shield,
  HeadphonesIcon,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import HomeSearchPanel from '@/components/home/HomeSearchPanel';
import HeroVisual from '@/components/home/HeroVisual';
import JsonLd, { buildWebSiteSchema, buildOrganizationSchema } from '@/components/seo/JsonLd';

// ─── Above-the-fold: import directly ─────────────────────────────────────────
import FeaturedProperties from '@/components/home/FeaturedProperties';
import StateExplorer from '@/components/home/StateExplorer';
import HomeLocationSelector from '@/components/home/HomeLocationSelector';
import PlatformStatsCards from '@/components/home/PlatformStatsCards';
import CTAStatsText from '@/components/home/CTAStatsText';
import TopCitiesSection from '@/components/home/TopCitiesSection';

// ─── Below-the-fold: lazy-load with next/dynamic ─────────────────────────────
// These components are large, data-heavy, or not needed for LCP.
// next/dynamic splits them into separate JS chunks loaded on demand.
const TopCategories   = dynamic(() => import('@/components/home/TopCategories'),   { ssr: true });
const TopAgents       = dynamic(() => import('@/components/home/TopAgents'),        { ssr: true });
const TopNewProjects  = dynamic(() => import('@/components/home/TopNewProjects'),   { ssr: true });
const ServicesBanner  = dynamic(() => import('@/components/home/ServicesBanner'),   { ssr: true });

// Non-critical / purely decorative sections — defer to client
const StatsBar           = dynamic(() => import('@/components/home/StatsBar'),            { ssr: false });
const HomeStickySearch   = dynamic(() => import('@/components/home/HomeStickySearch'),    { ssr: false });

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
  { label: 'Apartments for Sale', href: '/properties?category=buy&type=apartment' },
  { label: 'Villas in Mumbai', href: '/properties?category=buy&type=villa&city=Mumbai' },
  { label: '2 BHK for Rent', href: '/properties?category=rent&bedrooms=2' },
  { label: 'PG in Bangalore', href: '/properties?category=pg&city=Bangalore' },
  { label: 'Office Space Delhi', href: '/properties?category=commercial&city=Delhi' },
  { label: 'Plots in Hyderabad', href: '/properties?category=buy&type=plot&city=Hyderabad' },
];

const PROPERTY_CATEGORIES = [
  { icon: '🏠', label: 'Buy', sublabel: 'Apartments, Villas, Plots', href: '/buy', gradient: 'from-blue-500 to-blue-700' },
  { icon: '🔑', label: 'Rent', sublabel: 'Flats, Houses, PG', href: '/rent', gradient: 'from-emerald-500 to-emerald-700' },
  { icon: '🏢', label: 'Commercial', sublabel: 'Office, Shop, Warehouse', href: '/commercial', gradient: 'from-orange-500 to-orange-700' },
  { icon: '🛏️', label: 'PG / Co-Living', sublabel: 'Single, Double, Triple', href: '/pg', gradient: 'from-purple-500 to-purple-700' },
  { icon: '🏗️', label: 'New Projects', sublabel: 'Builder Floors, Societies', href: '/new-projects', gradient: 'from-pink-500 to-rose-600' },
  { icon: '📐', label: 'Plot / Land', sublabel: 'Residential, Commercial', href: '/buy?type=plot', gradient: 'from-teal-500 to-teal-700' },
];

const WHY_US = [
  { icon: Shield, title: 'Verified Listings', desc: 'All properties verified by our expert team.', color: 'bg-blue-50 text-blue-600' },
  { icon: Building2, title: 'Largest Database', desc: 'Thousands of properties across Indian cities.', color: 'bg-green-50 text-green-600' },
  { icon: TrendingUp, title: 'Best Prices', desc: 'Compare and get the best market deals.', color: 'bg-orange-50 text-orange-600' },
  { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Expert team available round-the-clock.', color: 'bg-purple-50 text-purple-600' },
];

export default function HomePage() {
  return (
    <>
      {/* ─── Sticky search bar (appears on scroll) ───────────────────────── */}
      <HomeStickySearch />

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative flex items-center bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-14 md:pt-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[400px] bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-10 sm:pb-14 lg:pb-16">

          {/* ── Top row: headline (left) + visual (right) — always side-by-side ── */}
          <div className="flex items-center gap-3 sm:gap-6 xl:gap-10 mb-7 sm:mb-9 lg:mb-10">

            {/* Headline column */}
            <div className="flex-1 min-w-0">
              {/* Trust badge — hidden on mobile (no room with visual column) */}
              <div className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                India&apos;s #1 Trusted Real Estate Platform
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-3 sm:mb-4">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Dream Property
                </span>
              </h1>

              {/* Sub-text — desktop only */}
              <p className="hidden sm:block text-base lg:text-lg text-blue-100/75 mb-4 lg:mb-5 max-w-xl leading-relaxed">
                50,000+ verified properties across India. Buy, rent, or invest with total confidence.
              </p>
              <p className="sm:hidden text-xs text-blue-100/60 mb-1">
                50,000+ verified properties · India
              </p>

              {/* Trust pills — desktop */}
              <div className="hidden sm:flex flex-wrap gap-4 lg:gap-5">
                {[
                  { icon: '✓', text: 'Verified Listings' },
                  { icon: '🏙️', text: '100+ Cities' },
                  { icon: '🤝', text: 'Zero Brokerage' },
                  { icon: '⭐', text: '10K+ Happy Buyers' },
                ].map(({ icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-sm text-blue-100/80 font-medium">
                    <span className="text-green-400 font-bold">{icon}</span>{text}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual — small on mobile, full on desktop */}
            <div className="w-[108px] sm:w-[220px] lg:w-[380px] xl:w-[430px] flex-shrink-0">
              <HeroVisual />
            </div>
          </div>

          {/* ── Full-width search panel ── */}
          <div className="relative">
            {/* Glow ring behind the search bar */}
            <div className="absolute -inset-x-2 -inset-y-3 bg-gradient-to-r from-primary-500/20 via-blue-500/15 to-primary-500/20 rounded-3xl blur-xl pointer-events-none" />
            <div className="relative">
              <HomeSearchPanel />
            </div>
          </div>

          {/* ── Quick links ── */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 mt-5">
            <span className="text-blue-300/60 text-xs font-medium uppercase tracking-wide mr-1">Quick:</span>
            {QUICK_LINKS.map((link) => (
              <Link key={link.label} href={link.href}
                className="text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-1.5 rounded-full transition-all border border-white/10 hover:border-white/30">
                {link.label}
              </Link>
            ))}
          </div>

        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full fill-gray-50" preserveAspectRatio="none">
            <path d="M0,30L60,28C120,26,240,22,360,22C480,22,600,26,720,30C840,34,960,38,1080,36C1200,34,1320,28,1380,25L1440,22L1440,60L0,60Z" />
          </svg>
        </div>
      </section>

      {/* ─── Platform Stats ───────────────────────────────────────────────── */}
      <section className="py-3 sm:py-8 bg-gray-50">
        <div className="container-max">
          <PlatformStatsCards />
        </div>
      </section>

       {/* ─── Latest Listings / Top Categories ───────────────────────────── */}
      <TopCategories />

      {/* ─── Featured Properties ──────────────────────────────────────────── */}
      <FeaturedProperties />

      {/* ─── State Explorer / Top States ─────────────────────────────────── */}
      <StateExplorer />

      {/* ─── Top Residential Cities in India (horizontal scroll) ─────────── */}
      <TopCitiesSection />

      {/* ─── Dynamic Location Selector (state selected → cities) ─────────── */}
      <HomeLocationSelector />

      {/* ─── Popular Projects ─────────────────────────────────────────────── */}
      <TopNewProjects />

      {/* ─── Verified Agents ──────────────────────────────────────────────── */}
      <TopAgents />

      {/* ─── Explore Cities (dynamic, reacts to location Redux state) ─────── */}
      {/* <CityExplorer /> */}

      {/* ─── What Are You Looking For? — Category Grid (last, per conversion best practice) */}
      <section className="py-4 sm:py-12 bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-3 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">What Are You Looking For?</h2>
            <p className="text-gray-500 mt-1 text-sm sm:mt-2">Browse properties by category</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
            {PROPERTY_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group relative overflow-hidden rounded-2xl p-2.5 sm:p-5 flex flex-col items-center text-center transition-all duration-300 active:scale-95 bg-white border border-gray-100"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${cat.gradient} rounded-xl flex items-center justify-center mb-1.5 sm:mb-3 text-lg sm:text-2xl shadow-lg`}
                >
                  {cat.icon}
                </div>
                <span className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">{cat.label}</span>
                <span className="text-xs text-gray-500 hidden sm:block mt-1 leading-tight">{cat.sublabel}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ────────────────────────────────────────────────── */}
      <section className="py-5 sm:py-16 bg-white">
        <div className="container-max">
          <div className="text-center mb-4 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Why Choose Think4BuySale?</h2>
            <p className="text-gray-500 mt-1 text-sm sm:mt-2">Trusted by millions of home buyers &amp; sellers</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {WHY_US.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group text-center p-3 sm:p-6 rounded-2xl border border-gray-100 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Trust indicators — scroll on mobile */}
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

      {/* ─── Services ─────────────────────────────────────────────────────── */}
      <ServicesBanner />

      {/* ─── List Your Property for FREE — SEO + CTA ─────────────────────── */}
      <section className="py-10 sm:py-16 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container-max relative z-10 px-4">

          {/* ── SEO heading block ── */}
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
            <CTAStatsText />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
              List Your Property for{' '}
              <span className="text-yellow-400">FREE</span> on India&apos;s Trusted Real Estate Platform
            </h2>
            <p className="text-blue-100/75 text-sm sm:text-base leading-relaxed">
              Think4BuySale connects property owners, real estate agents, and home buyers across 500+ cities in India.
              Whether you want to <strong className="text-white font-semibold">sell a flat</strong>,{' '}
              <strong className="text-white font-semibold">rent an apartment</strong>, or{' '}
              <strong className="text-white font-semibold">buy residential plots</strong> — post your listing in under
              2 minutes with zero charges, no brokerage, and no hidden fees.
            </p>
          </div>

          {/* ── Why Choose Us — plain text grid (SEO content) ── */}
          <div className="max-w-4xl mx-auto mb-10">
            <p className="text-center text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-6">
              Why Property Owners &amp; Buyers Choose Think4BuySale
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              {[
                {
                  icon: <Building2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />,
                  title: 'Genuine, Verified Property Listings',
                  desc: 'Every listing on Think4BuySale is reviewed for accuracy. Browse verified flats, residential plots, independent houses, villas, and commercial spaces — zero fake listings, real photos, real prices.',
                },
                {
                  icon: <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />,
                  title: 'Instant Visibility Across 500+ Indian Cities',
                  desc: 'Your property listing gets indexed on Google within hours. Buyers searching for "flats for sale in [your city]" or "plots near [your locality]" discover your listing organically — no paid ads needed.',
                },
                {
                  icon: <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />,
                  title: 'Privacy-First — Your Number Stays Safe',
                  desc: 'We mask your phone number until you choose to connect. Only genuine, verified buyers reach you — no spam calls, no broker harassment, no unwanted solicitations.',
                },
                {
                  icon: <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />,
                  title: 'Completely Free — No Subscription, No Commission',
                  desc: 'Post unlimited residential and commercial properties at absolutely zero cost. No monthly fees, no pay-to-rank upgrades required. Individual owners and registered agents list for free, forever.',
                },
                {
                  icon: <HeadphonesIcon className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />,
                  title: 'Dedicated Support for Every User',
                  desc: "New to online property listing? Our real estate advisors help you write compelling descriptions, set the right asking price, and attract more buyer inquiries — faster than traditional classifieds.",
                },
                {
                  icon: <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />,
                  title: 'One Platform for Buyers, Sellers & Agents',
                  desc: 'Think4BuySale is purpose-built for all real estate needs in India — buy a home, rent a flat, sell a plot, discover new residential projects, or build your real estate agency profile.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  {icon}
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                    <p className="text-blue-100/65 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA Card ── */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl px-6 py-7 sm:px-10 sm:py-9 text-center">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Get Started Today — It&apos;s Free</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
              Ready to Sell or Rent Your Property?
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Join <strong className="text-gray-700">thousands of verified owners &amp; agents</strong> listing properties
              on Think4BuySale. Post your property now and start receiving genuine buyer inquiries today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/post-property"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-7 py-3 rounded-xl transition-all hover:shadow-lg text-sm"
              >
                Post Property for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 font-medium px-7 py-3 rounded-xl transition-all text-sm"
              >
                Browse Listings
              </Link>
            </div>
            <p className="mt-4 text-[11px] text-gray-400">
              No credit card required &nbsp;·&nbsp; No brokerage &nbsp;·&nbsp; Cancel anytime
            </p>
          </div>

        </div>
      </section>

      {/* Structured data for Google rich results */}
      <JsonLd schema={[
        buildWebSiteSchema(process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com'),
        buildOrganizationSchema(process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com'),
      ]} />
    </>
  );
}
