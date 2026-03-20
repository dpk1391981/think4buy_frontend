import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, ChevronRight, Star, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Testimonials | Think4BuySale – Real Stories from Real Buyers',
  description: 'Read genuine reviews and success stories from home buyers, sellers, and investors who found their perfect property on Think4BuySale.',
  keywords: 'think4buysale reviews, property buyer testimonials, real estate success stories India, verified customer reviews',
  alternates: { canonical: 'https://think4buysale.com/testimonials' },
  openGraph: {
    title: 'Customer Testimonials | Think4BuySale',
    description: 'Real stories from buyers, sellers, and investors who found their perfect property on Think4BuySale.',
    type: 'website',
    url: 'https://think4buysale.com/testimonials',
    siteName: 'Think4BuySale',
  },
  robots: { index: true, follow: true },
};

interface Testimonial {
  id: number;
  name: string;
  location: string;
  role: string;
  rating: number;
  text: string;
  date: string;
  propertyType: string;
  highlight?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    location: 'Delhi',
    role: 'Home Buyer',
    rating: 5,
    propertyType: '3BHK Apartment',
    date: 'January 2025',
    highlight: 'Found my dream home in just 2 weeks',
    text: "I had been searching for a 3BHK apartment in South Delhi for almost 6 months. Then I found Think4BuySale. Within 2 weeks, I had visited 4 verified properties and finalised one. The agent assigned to me — Vikram Singh — was professional, punctual, and honest about each property's pros and cons. Highly recommend!",
  },
  {
    id: 2,
    name: 'Priya Mehta',
    location: 'Mumbai',
    role: 'Property Seller',
    rating: 5,
    propertyType: '2BHK Flat',
    date: 'December 2024',
    highlight: 'Sold at the right price, zero hassle',
    text: 'I was worried about listing my flat — I\'d heard horror stories about agents quoting too low. On Think4BuySale, I got genuine market valuation guidance and my agent helped me close at a price I was satisfied with. The whole process from listing to registration took just 45 days.',
  },
  {
    id: 3,
    name: 'Amit Kulkarni',
    location: 'Pune',
    role: 'First-Time Buyer',
    rating: 5,
    propertyType: 'Villa',
    date: 'November 2024',
    highlight: 'Transparent process from day one',
    text: 'As a first-time buyer, I was nervous about the entire process. The RERA-verified agents on Think4BuySale were incredibly patient. They explained every document, every clause. I never felt pressured. The photo-verified listings also meant I wasn\'t wasting time on fake listings. 10/10.',
  },
  {
    id: 4,
    name: 'Sunita Reddy',
    location: 'Hyderabad',
    role: 'Investor',
    rating: 5,
    propertyType: 'Commercial Plot',
    date: 'October 2024',
    highlight: 'Best platform for commercial investments',
    text: 'I was looking for commercial plots in the Outer Ring Road corridor. Think4BuySale had the most comprehensive listings I found anywhere online. The agent I connected with had deep knowledge of local development plans and future appreciation potential. I\'ve now purchased two plots through this platform.',
  },
  {
    id: 5,
    name: 'Mohammed Farhan',
    location: 'Bangalore',
    role: 'Tenant',
    rating: 4,
    propertyType: '1BHK Rental',
    date: 'September 2024',
    highlight: 'No brokerage, direct owner contact',
    text: 'I needed a furnished 1BHK near Whitefield for my new job. Think4BuySale had both direct owner listings and agent listings clearly marked. I found a zero-brokerage owner listing and the owner was responsive and transparent. Moved in within a week of finding the listing!',
  },
  {
    id: 6,
    name: 'Kavita Nair',
    location: 'Kochi',
    role: 'NRI Buyer',
    rating: 5,
    propertyType: '4BHK Villa',
    date: 'August 2024',
    highlight: 'Seamless remote property purchase',
    text: 'Buying property from abroad is stressful. Think4BuySale\'s agents were extremely accommodating of time-zone differences. Video tours were arranged, documentation was explained clearly, and the whole transaction was handled with complete transparency. I\'ve already recommended this platform to five other NRI friends.',
  },
  {
    id: 7,
    name: 'Deepak Joshi',
    location: 'Noida',
    role: 'Plot Buyer',
    rating: 5,
    propertyType: 'Residential Plot',
    date: 'July 2024',
    highlight: 'Verified plots, no legal surprises',
    text: 'I had a bad experience before on another portal — I booked a plot that turned out to have a legal dispute. On Think4BuySale, every listing is RERA-checked. My agent walked me through all the documents before I paid a single rupee. That level of trust is rare in real estate today.',
  },
  {
    id: 8,
    name: 'Ananya Singh',
    location: 'Gurgaon',
    role: 'Home Buyer',
    rating: 4,
    propertyType: '2BHK Apartment',
    date: 'June 2024',
    highlight: 'Smart search saved me months',
    text: 'The search filters on Think4BuySale are the best I\'ve used. I could filter by BHK, exact price range, possession date, and furnishing status all at once. This cut my search time dramatically. I found my apartment in Sector 57 within 10 days.',
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-primary-100 flex-shrink-0" />

      {/* Highlight */}
      {t.highlight && (
        <p className="text-base font-bold text-gray-900 leading-snug">&ldquo;{t.highlight}&rdquo;</p>
      )}

      {/* Body */}
      <p className="text-sm text-gray-600 leading-relaxed flex-1">{t.text}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{t.name}</p>
            <p className="text-xs text-gray-500">{t.role} · {t.location}</p>
          </div>
        </div>
        <div className="text-right">
          <StarRow rating={t.rating} />
          <p className="text-[10px] text-gray-400 mt-0.5">{t.propertyType}</p>
        </div>
      </div>
    </article>
  );
}

const avgRating = (TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / TESTIMONIALS.length).toFixed(1);

export default function TestimonialsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Think4BuySale Customer Reviews',
            description: 'Genuine testimonials from buyers, sellers, and investors on Think4BuySale',
            url: 'https://think4buysale.com/testimonials',
            numberOfItems: TESTIMONIALS.length,
            itemListElement: TESTIMONIALS.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Review',
                reviewBody: t.text,
                reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5 },
                author: { '@type': 'Person', name: t.name },
                datePublished: t.date,
              },
            })),
          }),
        }}
      />

      <main className="min-h-screen bg-white pt-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-800 to-primary-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-primary-300 mb-5">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Testimonials</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">What Our Customers Say</h1>
            <p className="text-primary-200 text-lg max-w-2xl">
              Real stories from buyers, sellers, and investors who found their perfect property on Think4BuySale.
            </p>

            {/* Summary stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <div className="text-3xl font-extrabold">{avgRating}</div>
                <StarRow rating={5} />
                <p className="text-xs text-primary-200 mt-1">Average Rating</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <div className="text-3xl font-extrabold">{TESTIMONIALS.length}+</div>
                <p className="text-sm font-semibold text-primary-100 mt-1">Reviews Shown</p>
                <p className="text-xs text-primary-200">Thousands more online</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <div className="text-3xl font-extrabold">10k+</div>
                <p className="text-sm font-semibold text-primary-100 mt-1">Happy Customers</p>
                <p className="text-xs text-primary-200">Across 50+ cities</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials grid */}
        <section className="py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Real Experiences, Real People</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Every review below is from a verified customer who used Think4BuySale to buy, sell, or rent property.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map(t => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </div>
        </section>

        {/* Trust section */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Why Customers Trust Think4BuySale</h2>
            <p className="text-gray-500 mb-8">We earn trust every day through verified listings, certified agents, and transparent processes.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: '✅', label: 'RERA-Verified Agents' },
                { icon: '📸', label: 'Photo-Verified Listings' },
                { icon: '🔒', label: 'Secure & Confidential' },
                { icon: '⭐', label: 'Real Customer Reviews' },
                { icon: '🤝', label: 'No Hidden Charges' },
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Write Your Own Story?</h2>
            <p className="text-gray-500 mb-6">Join thousands of happy customers across India.</p>
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
