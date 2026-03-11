'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { servicesApi } from '@/lib/api';

const SERVICE_ICONS: Record<string, string> = {
  home_loan: '🏦',
  legal: '⚖️',
  interior: '🎨',
  packers_movers: '🚚',
  rental_agreement: '📄',
  insurance: '🛡️',
  property_management: '🔧',
  vastu: '🧿',
};

export default function ServicesBanner() {
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll().then((r) => r.data),
  });

  const displayServices = services || [
    { name: 'Home Loan', slug: 'home-loan', description: 'Best rates from top banks', type: 'home_loan', ctaText: 'Check Eligibility' },
    { name: 'Legal Help', slug: 'legal-services', description: 'Property documentation', type: 'legal', ctaText: 'Get Help' },
    { name: 'Interior Design', slug: 'interior-design', description: 'Transform your home', type: 'interior', ctaText: 'Get Quote' },
    { name: 'Packers & Movers', slug: 'packers-movers', description: 'Reliable moving service', type: 'packers_movers', ctaText: 'Book Now' },
    { name: 'Rental Agreement', slug: 'rental-agreement', description: 'Legal rent agreements', type: 'rental_agreement', ctaText: 'Create Now' },
    { name: 'Insurance', slug: 'property-insurance', description: 'Protect your property', type: 'insurance', ctaText: 'Get Insured' },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container-max">
        <h2 className="section-title text-center mb-2">More Services for You</h2>
        <p className="section-subtitle text-center mb-8">
          Everything you need for your property journey
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayServices.slice(0, 6).map((service: any) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group p-5 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-card text-center transition-all duration-200 flex flex-col items-center"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {SERVICE_ICONS[service.type] || '🏠'}
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
              <span className="mt-3 text-xs text-primary-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {service.ctaText} <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
