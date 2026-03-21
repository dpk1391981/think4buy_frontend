import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { MapPin, Home, ArrowRight } from 'lucide-react';
import TopCitiesListingClient from './TopCitiesListingClient';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

export const metadata: Metadata = {
  title: 'Property for Sale in Top Cities | Active Listings | Think4BuySale',
  description:
    "Browse verified properties for sale across India's top residential cities. Flats, houses, plots & villas — active listings directly from owners, builders & agents.",
  keywords:
    'property for sale top cities india, buy property india, flats for sale, houses for sale, plots india, verified listings',
  alternates: { canonical: `${SITE}/property-for-sale-in-top-cities` },
  openGraph: {
    title: 'Property for Sale in Top Cities | Think4BuySale',
    description: "Active listings across India's top residential markets.",
    url: `${SITE}/property-for-sale-in-top-cities`,
    type: 'website',
  },
};

export default function PropertyForSaleInTopCitiesPage() {
  const schema = buildBreadcrumbSchema([
    { name: 'Home',                            url: SITE },
    { name: 'Properties',                      url: `${SITE}/properties` },
    { name: 'Property for Sale in Top Cities', url: `${SITE}/property-for-sale-in-top-cities` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-max py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-primary-600 transition-colors">Properties</Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">Top Cities</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Top Cities</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                Property for Sale in Top Cities
              </h1>
              <p className="text-gray-500 text-sm mt-1.5">
                Active listings across India's most sought-after residential markets
              </p>
            </div>

            <Link
              href="/post-property"
              className="hidden sm:flex items-center gap-2 flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              Post Free
            </Link>
          </div>
        </div>
      </div>

      {/* Listings */}
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <TopCitiesListingClient />
      </Suspense>
    </>
  );
}
