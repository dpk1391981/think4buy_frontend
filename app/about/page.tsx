import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, ChevronRight, Shield, Users, TrendingUp, Star, CheckCircle, Building2, MapPin, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Think4BuySale – India\'s Trusted Real Estate Platform',
  description: 'Learn about Think4BuySale — India\'s growing real estate marketplace connecting buyers, sellers, and RERA-certified agents across 50+ cities. Our mission, values and story.',
  keywords: 'about think4buysale, real estate platform India, property marketplace India, RERA agents, trusted property portal',
  alternates: { canonical: 'https://think4buysale.com/about' },
  openGraph: {
    title: 'About Think4BuySale | India\'s Trusted Real Estate Platform',
    description: 'We connect home buyers, sellers, and verified agents across India\'s fastest-growing cities.',
    type: 'website',
    url: 'https://think4buysale.com/about',
    siteName: 'Think4BuySale',
  },
  robots: { index: true, follow: true },
};

const STATS = [
  { value: '50,000+', label: 'Active Listings', icon: <Building2 className="w-5 h-5" /> },
  { value: '2,000+',  label: 'Verified Agents',  icon: <Users className="w-5 h-5" /> },
  { value: '50+',     label: 'Cities Covered',   icon: <MapPin className="w-5 h-5" /> },
  { value: '10,000+', label: 'Happy Customers',  icon: <Star className="w-5 h-5" /> },
];

const VALUES = [
  {
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    title: 'Trust & Transparency',
    desc: 'Every agent on our platform is RERA-registered. Every listing is verified before going live. We believe transparency is the foundation of every successful property transaction.',
  },
  {
    icon: <Users className="w-6 h-6 text-emerald-600" />,
    title: 'Customer First',
    desc: 'We design every feature with the buyer and seller in mind. From smart search to real-time chat with agents, we make the property journey seamless and stress-free.',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-amber-600" />,
    title: 'Empowering Agents',
    desc: 'Agents are the lifeblood of real estate. We provide them with technology, leads, and visibility tools to grow their business and serve clients better.',
  },
  {
    icon: <Award className="w-6 h-6 text-violet-600" />,
    title: 'Quality over Quantity',
    desc: 'We curate listings, verify credentials, and maintain quality standards so that every search result is meaningful — not just a wall of noise.',
  },
];

const MILESTONES = [
  { year: '2022', event: 'Think4BuySale founded with a vision to simplify real estate search in India.' },
  { year: '2023', event: 'Launched in 10 major cities with a directory of 500+ verified RERA agents.' },
  { year: '2024', event: 'Expanded to 50+ cities. Introduced Gold, Silver and Bronze agent tiers.' },
  { year: '2025', event: 'Crossed 50,000 active listings and 10,000 successful property matches.' },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Think4BuySale',
            url: 'https://think4buysale.com',
            description: 'India\'s trusted real estate marketplace connecting buyers, sellers and RERA-certified agents.',
            foundingDate: '2022',
            areaServed: { '@type': 'Country', name: 'India' },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              email: 'support@think4buysale.com',
            },
          }),
        }}
      />

      <main className="min-h-screen bg-white pt-16">

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-800 to-primary-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-primary-300 mb-5">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><Home className="w-3.5 h-3.5" />Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">About Us</span>
            </nav>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
              India's Trusted<br />Real Estate Platform
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl leading-relaxed">
              Think4BuySale connects millions of home seekers with verified RERA-certified agents and quality property listings across India's fastest-growing cities.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {STATS.map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary-600">
                    {s.icon}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed">
                  To democratise real estate access in India by making property search transparent, efficient, and trustworthy for every buyer, seller, and agent — regardless of their budget or location.
                </p>
                <p className="text-gray-600 leading-relaxed mt-3">
                  We believe that finding your dream home or the right investment should not require navigating a maze of unverified listings and unscrupulous brokers. We fix that.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed">
                  To become India's most trusted and beloved real estate marketplace — one where every transaction is backed by verified data, expert agents, and genuine reviews from real customers.
                </p>
                <p className="text-gray-600 leading-relaxed mt-3">
                  By 2027, we aim to serve every city and town in India, empowering millions of families to make confident property decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">What We Stand For</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Our values guide every product decision, every partnership, and every customer interaction.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {VALUES.map(v => (
                <div key={v.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                    {v.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10 text-center">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-px" />
              {MILESTONES.map((m, i) => (
                <div key={m.year} className={`relative flex gap-6 sm:gap-0 mb-10 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  <div className={`hidden sm:flex sm:w-1/2 ${i % 2 === 0 ? 'sm:justify-end sm:pr-10' : 'sm:justify-start sm:pl-10'}`}>
                    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 max-w-xs ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                      <span className="inline-block text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full mb-2">{m.year}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{m.event}</p>
                    </div>
                  </div>
                  {/* Mobile */}
                  <div className="sm:hidden flex gap-4 pl-6">
                    <div className="absolute left-5 w-2 h-2 bg-primary-600 rounded-full -translate-x-1 mt-1.5" />
                    <div>
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{m.year}</span>
                      <p className="text-sm text-gray-700 leading-relaxed mt-2">{m.event}</p>
                    </div>
                  </div>
                  {/* Dot — desktop */}
                  <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow" style={{ top: '1.1rem' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="bg-primary-50 py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Why Customers Trust Us</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: '✅', label: 'RERA Verified Agents' },
                { icon: '🔒', label: 'Secure Transactions' },
                { icon: '📸', label: 'Photo-Verified Listings' },
                { icon: '⭐', label: 'Real Customer Reviews' },
                { icon: '🤝', label: 'Zero Brokerage (Owners)' },
                { icon: '📱', label: '24/7 Support' },
              ].map(b => (
                <div key={b.label} className="bg-white rounded-xl border border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">{b.icon}</span>
                  <span className="text-sm font-semibold text-gray-700 text-left">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Find Your Property?</h2>
            <p className="text-gray-500 mb-6">Browse thousands of verified listings or connect with a top-rated agent today.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/properties" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors">
                Search Properties
              </Link>
              <Link href="/agents" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                Find an Agent
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
