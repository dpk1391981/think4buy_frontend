import type { Metadata } from 'next';
import ServicesGrid from './ServicesGrid';

export const metadata: Metadata = {
  title: 'Real Estate Services | Home Loan, Legal, Interior & More',
  description:
    'Complete real estate services - home loans, legal documentation, interior design, packers & movers, rental agreements, and property insurance.',
};

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
        <ServicesGrid />
      </div>
    </div>
  );
}
