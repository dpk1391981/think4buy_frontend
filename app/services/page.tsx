import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Real Estate Services | Home Loan, Legal, Interior & More',
  description:
    'Complete real estate services - home loans, legal documentation, interior design, packers & movers, rental agreements, and property insurance.',
};

const SERVICES = [
  {
    slug: 'home-loan',
    name: 'Home Loan',
    emoji: '🏦',
    description: 'Compare and apply for home loans from 50+ banks and NBFCs. Get the lowest interest rates and fastest approvals.',
    features: ['Rate comparison', 'Online application', '24hr approval', 'Tax benefits'],
    cta: 'Check Eligibility',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    textColor: 'text-blue-600',
  },
  {
    slug: 'legal-services',
    name: 'Legal Services',
    emoji: '⚖️',
    description: 'Complete property legal assistance - title verification, documentation, registration and legal consultation.',
    features: ['Title verification', 'Sale deed', 'Property registration', 'Legal consultation'],
    cta: 'Get Legal Help',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    textColor: 'text-purple-600',
  },
  {
    slug: 'interior-design',
    name: 'Interior Design',
    emoji: '🎨',
    description: 'Transform your new home with expert interior designers. 2D/3D designs, modular kitchens, custom furniture.',
    features: ['Free consultation', '3D visualization', 'Modular furniture', 'Budget-friendly'],
    cta: 'Get Free Quote',
    color: 'bg-pink-50 border-pink-200 hover:border-pink-400',
    textColor: 'text-pink-600',
  },
  {
    slug: 'packers-movers',
    name: 'Packers & Movers',
    emoji: '🚚',
    description: 'Reliable and affordable moving services across India. Door-to-door packing, loading, transport and unloading.',
    features: ['Verified movers', 'Insurance cover', 'Real-time tracking', 'Guaranteed delivery'],
    cta: 'Get Moving Quote',
    color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    textColor: 'text-orange-600',
  },
  {
    slug: 'rental-agreement',
    name: 'Rental Agreement',
    emoji: '📄',
    description: 'Create legally valid rental agreements online in minutes. E-stamping, notarization, and home delivery available.',
    features: ['Online creation', 'E-stamp paper', 'Legal validity', 'Home delivery'],
    cta: 'Create Agreement',
    color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    textColor: 'text-teal-600',
  },
  {
    slug: 'property-insurance',
    name: 'Property Insurance',
    emoji: '🛡️',
    description: 'Protect your property investment with comprehensive insurance. Coverage against natural disasters, theft, and more.',
    features: ['Comprehensive cover', 'Quick claims', 'Digital policy', 'Affordable premiums'],
    cta: 'Get Insured',
    color: 'bg-green-50 border-green-200 hover:border-green-400',
    textColor: 'text-green-600',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 py-12 md:py-16">
        <div className="container-max text-center text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">All Services for Your Property Journey</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Everything you need from finding a property to settling in — all in one place.
          </p>
        </div>
      </div>

      <div className="container-max py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <div
              key={service.slug}
              className={`bg-white rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1 ${service.color}`}
            >
              <div className="text-4xl mb-4">{service.emoji}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{service.description}</p>

              <ul className="space-y-1.5 mb-5">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${service.textColor.replace('text', 'bg')} flex-shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/services/${service.slug}`}
                className={`inline-flex items-center gap-2 font-semibold text-sm ${service.textColor} hover:gap-3 transition-all`}
              >
                {service.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
