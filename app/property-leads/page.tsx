import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Home, ChevronRight, Target, Phone, MessageSquare,
  Users, TrendingUp, CheckCircle, Building2, MapPin, Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Property Leads for Agents & Owners | Think4BuySale',
  description: 'Get verified property buyer leads in your city. Connect with serious home buyers, investors, and tenants actively looking for properties on Think4BuySale.',
  keywords: 'property leads India, real estate leads, buyer leads for agents, property inquiries, real estate agent leads',
  alternates: { canonical: 'https://think4buysale.com/property-leads' },
  openGraph: {
    title: 'Property Leads for Agents & Owners | Think4BuySale',
    description: 'Get verified property buyer leads. Connect with serious buyers and tenants in your city.',
    type: 'website',
    url: 'https://think4buysale.com/property-leads',
    siteName: 'Think4BuySale',
  },
  robots: { index: true, follow: true },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Buyer Submits Requirement',
    desc: 'A buyer or tenant fills out their property requirement — city, budget, type, BHK — on any page of Think4BuySale.',
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    step: '02',
    title: 'Lead is Verified',
    desc: 'Our system scores and verifies the lead based on contact validity, intent signals, and activity on the platform.',
    icon: <CheckCircle className="w-6 h-6" />,
  },
  {
    step: '03',
    title: 'Matched to Best Agent',
    desc: 'The lead is automatically matched to the most relevant agent based on city coverage, property type, and availability.',
    icon: <Target className="w-6 h-6" />,
  },
  {
    step: '04',
    title: 'You Connect & Close',
    desc: 'You receive the lead with full contact details and buyer requirements. Call, WhatsApp, or meet — and close the deal.',
    icon: <Phone className="w-6 h-6" />,
  },
];

const BENEFITS = [
  { icon: '🎯', title: 'Verified Intent',      desc: 'Every lead has expressed active interest in buying, renting, or investing.' },
  { icon: '📍', title: 'City-Specific',         desc: 'Leads are matched to your registered coverage cities — no out-of-area noise.' },
  { icon: '⚡', title: 'Real-Time Delivery',    desc: 'Leads are delivered instantly to your dashboard and via WhatsApp notification.' },
  { icon: '📊', title: 'Lead Score',            desc: 'Each lead carries a score (Hot / Warm / Cold) so you prioritise the best ones first.' },
  { icon: '🔒', title: 'Exclusive Routing',     desc: 'Premium subscribers get first-priority on leads before they are shared more broadly.' },
  { icon: '📱', title: 'Full Contact Details',  desc: 'Name, phone, email, budget, and property requirement — everything you need to call.' },
];

const LEAD_SOURCES = [
  'Property detail page enquiries',
  'Homepage property search forms',
  'SEO landing pages (city-specific)',
  'WhatsApp click-to-chat buttons',
  'Schedule visit requests',
  'Phone reveal events',
  'Agent profile contact forms',
  'Campaign & social media forms',
];

export default function PropertyLeadsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Property Leads for Real Estate Agents',
            provider: { '@type': 'Organization', name: 'Think4BuySale', url: 'https://think4buysale.com' },
            description: 'Verified property buyer and tenant leads delivered to real estate agents across India.',
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Real Estate Lead Generation',
          }),
        }}
      />

      <main className="min-h-screen bg-white pt-16">

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-primary-300 mb-5">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Property Leads</span>
            </nav>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-400 text-amber-900 px-3 py-1 rounded-full mb-4">
                  <Zap className="w-3 h-3" /> For Agents &amp; Owners
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
                  Get Verified Property<br />Buyer Leads Daily
                </h1>
                <p className="text-primary-200 text-lg leading-relaxed mb-6">
                  Connect with serious buyers, investors, and tenants who are actively searching for properties in your city — delivered straight to your dashboard.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/auth/register"
                    className="px-6 py-3 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors"
                  >
                    Start Getting Leads
                  </Link>
                  <Link
                    href="/agents"
                    className="px-6 py-3 border border-primary-400 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors"
                  >
                    Browse Agents
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '10,000+', label: 'Leads Per Month', icon: <Target className="w-5 h-5" /> },
                  { value: '50+',     label: 'Cities Covered',  icon: <MapPin className="w-5 h-5" /> },
                  { value: '2,000+',  label: 'Active Agents',   icon: <Users className="w-5 h-5" /> },
                  { value: '85%',     label: 'Contact Rate',    icon: <TrendingUp className="w-5 h-5" /> },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="flex justify-center mb-2 text-primary-200">{s.icon}</div>
                    <div className="text-2xl font-extrabold">{s.value}</div>
                    <div className="text-xs text-primary-300 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">How Property Leads Work</h2>
              <p className="text-gray-500 max-w-xl mx-auto">From buyer intent to your phone — a fully automated, verified pipeline.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map(step => (
                <div key={step.step} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="text-xs font-bold text-primary-400 mb-1">STEP {step.step}</div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Why Think4BuySale Leads?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Not all leads are equal. Ours are scored, verified, and pre-qualified before they reach you.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map(b => (
                <div key={b.title} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-2xl flex-shrink-0">{b.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{b.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lead Sources */}
        <section className="py-16 px-4 bg-primary-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Where Do Our Leads Come From?</h2>
              <p className="text-gray-500">Every lead originates from a real buyer action on our platform — no cold data, no scraped contacts.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {LEAD_SOURCES.map(src => (
                <div key={src} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-primary-100 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{src}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <Building2 className="w-10 h-10 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Grow Your Business?</h2>
            <p className="text-gray-500 mb-6">Register as an agent, complete your profile, and start receiving verified leads in your city.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/auth/register" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors">
                Register as Agent
              </Link>
              <Link href="/contact" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                Talk to Our Team
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
