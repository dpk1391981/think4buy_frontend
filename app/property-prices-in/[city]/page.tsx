import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, MapPin, BarChart2, ArrowRight, Info } from 'lucide-react';

// ── Static city data seed ─────────────────────────────────────────────────────
// Additional cities can be added here; data is populated from the DB via API
const CITY_META: Record<string, { state: string; fullName: string; description: string }> = {
  mumbai:    { state: 'Maharashtra', fullName: 'Mumbai', description: 'Mumbai, India\'s financial capital, has one of the highest property prices in the country.' },
  delhi:     { state: 'Delhi NCR',   fullName: 'Delhi',  description: 'Delhi NCR encompasses a large metro with diverse price ranges across localities.' },
  bangalore: { state: 'Karnataka',   fullName: 'Bangalore', description: 'Bangalore\'s tech-driven economy continues to push residential prices upward.' },
  hyderabad: { state: 'Telangana',   fullName: 'Hyderabad', description: 'Hyderabad has emerged as one of India\'s fastest-growing real estate markets.' },
  pune:      { state: 'Maharashtra', fullName: 'Pune',   description: 'Pune offers relatively affordable alternatives to Mumbai with strong IT sector demand.' },
  chennai:   { state: 'Tamil Nadu',  fullName: 'Chennai', description: 'Chennai has steady residential demand driven by manufacturing and IT sectors.' },
  noida:     { state: 'Uttar Pradesh', fullName: 'Noida', description: 'Noida offers modern infrastructure and is a top choice for NCR homebuyers.' },
  gurgaon:   { state: 'Haryana',     fullName: 'Gurgaon', description: 'Gurgaon is a premium corporate hub with luxury and mid-range segments both growing.' },
  ahmedabad: { state: 'Gujarat',     fullName: 'Ahmedabad', description: 'Ahmedabad is one of the most affordable metro cities with rapid infrastructure growth.' },
  kolkata:   { state: 'West Bengal', fullName: 'Kolkata', description: 'Kolkata combines heritage charm with emerging new residential townships.' },
};

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

type Params = { city: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug  = params.city.toLowerCase();
  const meta  = CITY_META[slug];
  const name  = meta?.fullName ?? capitalise(slug);
  const state = meta?.state ?? 'India';

  return {
    title:       `Property Prices in ${name} ${new Date().getFullYear()} | Real Estate Trends & Market Insights`,
    description: `Check current property prices in ${name}, ${state}. View avg PSF, price trends, top localities, rental yield, and market insights for ${new Date().getFullYear()}.`,
    alternates:  { canonical: `/property-prices-in/${slug}` },
    openGraph: {
      title:       `Property Prices in ${name} ${new Date().getFullYear()}`,
      description: `Avg price per sqft, trends, and locality data for ${name} real estate market.`,
      type:        'article',
    },
  };
}

export function generateStaticParams() {
  return Object.keys(CITY_META).map(city => ({ city }));
}

// ── Server component fetches data at render time ──────────────────────────────
async function fetchCityData(city: string) {
  const apiBase = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiBase}/insights/price-trends?city=${encodeURIComponent(city)}`, {
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CityPricePage({ params }: { params: Params }) {
  const slug   = params.city.toLowerCase();
  const meta   = CITY_META[slug];
  const name   = meta?.fullName ?? capitalise(slug);
  const state  = meta?.state ?? 'India';
  const year   = new Date().getFullYear();
  const data   = await fetchCityData(name);

  const hasData  = data?.hasData;
  const avgPsf   = hasData ? Number(data.avgPsf) : 0;
  const trend    = hasData ? data.trend : 'stable';
  const trendPct = hasData ? Number(data.trendPct) : 0;

  // FAQ structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the average property price in ${name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: hasData
            ? `The average property price in ${name} is approximately ${fmt(Math.round(Number(data.avgPrice)))} with a median PSF of ₹${Math.round(avgPsf).toLocaleString('en-IN')}.`
            : `Property prices in ${name} vary by locality and property type. Use our tools to get the latest estimates.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is property price in ${name} increasing in ${year}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: hasData
            ? `${name} property prices are trending ${trend} with a ${trendPct}% change recently.`
            : `Market conditions in ${name} vary. Check our live price trends for the latest data.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the rental yield in ${name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: hasData && Number(data.rentYield) > 0
            ? `The gross rental yield in ${name} is approximately ${Number(data.rentYield).toFixed(2)}% per year.`
            : `Rental yields in ${name} depend on the locality and property type. Use our ROI calculator for estimates.`,
        },
      },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Property Prices in ${name} ${year}`,
    description: `Current average property prices, PSF rates, price trends and market insights for ${name} real estate market.`,
    datePublished: new Date().toISOString().split('T')[0],
    dateModified:  new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: 'Think4BuySale' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-violet-700 to-purple-600 text-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-violet-200 mb-4 flex items-center gap-2">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/tools" className="hover:text-white">Tools</Link>
              <span>/</span>
              <span>Property Prices in {name}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Property Prices in {name} {year}
            </h1>
            <p className="text-violet-100 max-w-2xl">
              {meta?.description ?? `Current property prices, price trends, and market insights for ${name} real estate market.`}
            </p>
            {hasData && (
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className="text-xs text-violet-200">Avg PSF</div>
                  <div className="text-xl font-bold">₹{Math.round(avgPsf).toLocaleString('en-IN')}/sqft</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className="text-xs text-violet-200">Market Trend</div>
                  <div className="text-xl font-bold capitalize">{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendPct.toFixed(1)}%</div>
                </div>
                {Number(data.avgMonthlyRent) > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                    <div className="text-xs text-violet-200">Avg Monthly Rent</div>
                    <div className="text-xl font-bold">{fmt(Math.round(Number(data.avgMonthlyRent)))}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

          {/* Intro */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Real Estate Market Overview — {name} {year}</h2>
            <p className="text-gray-600 leading-relaxed">
              {name} remains one of India&apos;s most dynamic real estate markets. {meta?.description ?? ''}{' '}
              {hasData
                ? `Based on active listings, the average price per sq.ft in ${name} is ₹${Math.round(avgPsf).toLocaleString('en-IN')}, with properties in top localities commanding premium rates. The market is currently trending ${trend}.`
                : `Property prices in ${name} vary significantly across localities. Use our price prediction tool to get estimates based on your specific requirements.`
              }
            </p>
          </section>

          {/* Key Stats */}
          {hasData && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Market Statistics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Sale PSF', value: `₹${Math.round(avgPsf).toLocaleString('en-IN')}` },
                  { label: 'Median Sale PSF', value: `₹${Math.round(Number(data.medianPsf ?? avgPsf)).toLocaleString('en-IN')}` },
                  { label: 'Rental Yield', value: `${Number(data.rentYield).toFixed(2)}%` },
                  { label: 'Active Listings', value: Number(data.listingCount).toLocaleString('en-IN') },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-xl font-bold text-violet-700">{s.value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top Localities */}
          {hasData && data.topLocalities?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={18} className="text-violet-500" />Top Localities in {name}</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="py-3 px-4 text-left">Locality</th>
                      <th className="py-3 px-4 text-right">Median PSF</th>
                      <th className="py-3 px-4 text-right">Avg Buy Price</th>
                      <th className="py-3 px-4 text-right">Avg Rent/mo</th>
                      <th className="py-3 px-4 text-right">Yield</th>
                      <th className="py-3 px-4 text-center">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topLocalities.map((loc: any) => (
                      <tr key={loc.name} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{loc.name}</td>
                        <td className="py-3 px-4 text-right">₹{Math.round(Number(loc.medianPsf)).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right">{fmt(Math.round(Number(loc.avgBuyPrice)))}</td>
                        <td className="py-3 px-4 text-right">{fmt(Math.round(Number(loc.avgRent)))}</td>
                        <td className="py-3 px-4 text-right">{loc.rentYield != null ? `${Number(loc.rentYield).toFixed(1)}%` : '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${loc.trend === 'up' ? 'text-green-600' : loc.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                            {loc.trend === 'up' ? '↑' : loc.trend === 'down' ? '↓' : '→'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* AI Smart Insights */}
          {hasData && data.smartInsights?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-violet-500" />Market Insights for {name}</h2>
              <div className="space-y-3">
                {data.smartInsights.map((ins: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-violet-50 rounded-xl p-4">
                    <span className="w-6 h-6 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700">{ins}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq: any, i: number) => (
                <details key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm group">
                  <summary className="cursor-pointer flex items-center justify-between p-4 font-semibold text-gray-900 text-sm">
                    {faq.name}
                    <ArrowRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.acceptedAnswer.text}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Tools */}
          <section className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Use Our Property Tools</h3>
              <p className="text-sm text-gray-600">Calculate EMI, estimate price, or check ROI for properties in {name}.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/tools" className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors">
                Open Tools <ArrowRight size={14} />
              </Link>
              <Link href={`/buy?city=${slug}`} className="flex items-center gap-2 border border-violet-300 text-violet-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors">
                Browse {name} Properties
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">Explore More Cities</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CITY_META)
                .filter(([k]) => k !== slug)
                .map(([key, val]) => (
                  <Link key={key} href={`/property-prices-in/${key}`}
                    className="text-sm text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors">
                    {val.fullName}
                  </Link>
                ))
              }
            </div>
          </section>

          <p className="text-xs text-gray-400 flex items-start gap-1">
            <Info size={12} className="mt-0.5 shrink-0" />
            Data is based on active listings on this platform and is indicative. Prices may vary based on actual transactions. Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
      </main>
    </>
  );
}
