import Link from 'next/link';
import { MapPin, TrendingUp, Train, Star, HelpCircle, Building2, Home, DollarSign } from 'lucide-react';
import { getCityData, ContentVariant, CityData } from '@/lib/seo/cityData';

interface Props {
  citySlug: string;
  cityName: string;
  variant: ContentVariant;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function variantTitle(v: ContentVariant, city: string): string {
  switch (v) {
    case 'buy':              return `Property for Sale in ${city} – Complete Buying Guide`;
    case 'flats-for-sale':  return `Flats & Apartments for Sale in ${city}`;
    case 'rent':             return `Rental Properties in ${city} – Find the Right Home`;
    case 'flats-for-rent':  return `Flats for Rent in ${city} – Verified Rental Listings`;
    case 'new-projects':    return `New Projects in ${city} – Latest Launches & New Developments`;
  }
}

function variantIntro(v: ContentVariant, d: CityData): string {
  switch (v) {
    case 'buy':
    case 'flats-for-sale':  return d.buyOverview;
    case 'rent':
    case 'flats-for-rent':  return d.rentOverview;
    case 'new-projects':    return d.newProjectsOverview;
  }
}

function variantLocalities(v: ContentVariant, d: CityData) {
  switch (v) {
    case 'rent':
    case 'flats-for-rent':  return { title: 'Top Areas to Rent in', list: d.topLocalitiesRent };
    case 'new-projects':    return { title: 'Top Localities for New Projects in', list: d.topLocalitiesNewProjects };
    default:                return { title: 'Top Localities to Buy in', list: d.topLocalitiesBuy };
  }
}

function variantPriceLabel(v: ContentVariant, d: CityData): string {
  return v === 'rent' || v === 'flats-for-rent' ? d.priceRangeRent : d.priceRangeBuy;
}

function variantPriceTitle(v: ContentVariant): string {
  return v === 'rent' || v === 'flats-for-rent' ? 'Typical Rent Range' : 'Price Range';
}

function variantLocalityCTA(v: ContentVariant, citySlug: string, locality: string): string {
  const locSlug = locality.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  switch (v) {
    case 'rent':
    case 'flats-for-rent':  return `/flats-for-rent/${citySlug}?locality=${encodeURIComponent(locality)}`;
    case 'new-projects':    return `/new-projects/${citySlug}?locality=${encodeURIComponent(locality)}`;
    default:                return `/flats-for-sale/${citySlug}?locality=${encodeURIComponent(locality)}`;
  }
}

// ── Fallback template for cities not in database ─────────────────────────────

function FallbackContent({ cityName, variant }: { cityName: string; variant: ContentVariant }) {
  const isBuy = variant === 'buy' || variant === 'flats-for-sale';
  const isRent = variant === 'rent' || variant === 'flats-for-rent';
  const isNew = variant === 'new-projects';

  return (
    <section className="bg-white border-t border-gray-100 py-14">
      <div className="container-max max-w-5xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{variantTitle(variant, cityName)}</h2>
        <div className="w-16 h-1 bg-primary-500 rounded mb-8" />

        <div className="text-gray-600 text-sm leading-relaxed space-y-4 mb-10">
          {isBuy && (
            <>
              <p>
                Looking to buy property in {cityName}? Think4BuySale offers thousands of verified property listings
                in {cityName} — apartments, villas, independent houses, plots, and commercial spaces across all
                major localities. Whether you're a first-time homebuyer or a seasoned investor, we connect you
                with the best deals in {cityName}.
              </p>
              <p>
                {cityName} has a growing real estate market with options across all budget segments.
                Properties range from affordable 1BHK flats to luxury penthouses and villas. All listings
                on Think4BuySale are verified, and RERA-registered properties are clearly marked.
              </p>
            </>
          )}
          {isRent && (
            <>
              <p>
                Searching for a rental flat or house in {cityName}? Think4BuySale lists hundreds of verified
                rental properties in {cityName} — furnished, semi-furnished, and unfurnished options.
                Find 1BHK, 2BHK, and 3BHK flats, PG accommodations, and independent houses across all
                major areas of {cityName}.
              </p>
              <p>
                Renting in {cityName} is simple with Think4BuySale. Contact property owners and verified
                agents directly, compare multiple options, and use our rental agreement service for a
                hassle-free move-in.
              </p>
            </>
          )}
          {isNew && (
            <>
              <p>
                Discover the latest new residential and commercial projects launching in {cityName} on
                Think4BuySale. Browse under-construction apartments, pre-launch villa projects, and new
                plotted developments from top builders. Many projects are RERA-registered with transparent
                pricing and delivery timelines.
              </p>
              <p>
                Investing early in new projects in {cityName} can offer pre-launch pricing advantages,
                flexible payment plans, and strong appreciation by possession. Use our filters to find
                projects by budget, possession year, and builder reputation.
              </p>
            </>
          )}
        </div>

        {/* Generic bullets */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">
              {isBuy ? `Why Buy Property in ${cityName}?` : isRent ? `Why Rent in ${cityName}?` : `Why Invest in New Projects in ${cityName}?`}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {isBuy && [
                'Verified listings with RERA registration details',
                'Wide range of budgets — affordable to luxury',
                'Direct contact with owners and builders',
                'Home loan assistance available',
                'Legal and documentation support',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{item}
                </li>
              ))}
              {isRent && [
                'Zero brokerage options available',
                'Furnished and unfurnished choices',
                'Verified landlord profiles',
                'Rental agreement drafting support',
                'Background-checked properties',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{item}
                </li>
              ))}
              {isNew && [
                'RERA-registered projects only',
                'Pre-launch and under-construction pricing',
                'Builder track record and delivery history',
                'Flexible payment plans',
                'Transparent price-per-sqft comparison',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-primary-50 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {isBuy && [
                'Always verify RERA registration before booking',
                'Check OC (Occupancy Certificate) for ready properties',
                'Compare circle rate vs market rate before registering',
                'Get home loan pre-approval to negotiate better',
                'Use Think4BuySale\'s legal service for due diligence',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5 flex-shrink-0">→</span>{item}
                </li>
              ))}
              {isRent && [
                'Always get a registered rental agreement',
                'Check for maintenance charges before finalising',
                'Verify landlord ownership documents',
                'Document existing damages at move-in',
                'Understand notice period clauses',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5 flex-shrink-0">→</span>{item}
                </li>
              ))}
              {isNew && [
                'Check RERA registration and delivery timeline',
                'Verify builder\'s past project delivery record',
                'Understand payment plan structure',
                'Check for hidden charges (car parking, club, etc.)',
                'Visit the site before booking',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5 flex-shrink-0">→</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CityPageContent({ citySlug, cityName, variant }: Props) {
  const data = getCityData(citySlug);

  if (!data) {
    return <FallbackContent cityName={cityName} variant={variant} />;
  }

  const { title: localitiesTitle, list: localitiesList } = variantLocalities(variant, data);

  return (
    <section className="bg-white border-t border-gray-100 py-14" aria-label={`About real estate in ${cityName}`}>
      <div className="container-max max-w-5xl">

        {/* ── Section Title ─────────────────────────────────────────────── */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {variantTitle(variant, cityName)}
          </h2>
          <div className="w-16 h-1 bg-primary-500 rounded" />
        </div>

        {/* ── City Overview ─────────────────────────────────────────────── */}
        <div className="mb-10 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                About {cityName}, {data.state}
              </h3>
              <p className="text-xs text-primary-600 font-medium">{data.famousFor}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{data.overview}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{variantIntro(variant, data)}</p>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <DollarSign className="w-5 h-5 text-primary-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">{variantPriceTitle(variant)}</p>
            <p className="text-sm font-bold text-gray-900">{variantPriceLabel(variant, data)}</p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <Building2 className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Avg Price/Sqft</p>
            <p className="text-sm font-bold text-gray-900">{data.avgPricePerSqft}</p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <Home className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">State</p>
            <p className="text-sm font-bold text-gray-900">{data.state}</p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Market Trend</p>
            <p className="text-sm font-bold text-green-600">Appreciating ↑</p>
          </div>
        </div>

        {/* ── Localities ────────────────────────────────────────────────── */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-5">
            {localitiesTitle} {cityName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {localitiesList.map(({ name, note }) => (
              <Link
                key={name}
                href={variantLocalityCTA(variant, citySlug, name)}
                className="group bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700">
                      {name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{note}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Two column: Highlights + Why Invest ──────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 text-base">{cityName} Highlights</h3>
            </div>
            <ul className="space-y-2.5">
              {data.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 text-base">Why Invest in {cityName}?</h3>
            </div>
            <ul className="space-y-2.5">
              {data.whyInvest.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Connectivity ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Train className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Connectivity in {cityName}</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.connectivity.map((item) => (
              <div key={item} className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
                <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── Market Trend ──────────────────────────────────────────────── */}
        <div className="mb-10 border-l-4 border-primary-500 pl-5 py-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-gray-900 text-base">{cityName} Real Estate Market Trends</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{data.marketTrend}</p>
        </div>

        {/* ── FAQs ──────────────────────────────────────────────────────── */}
        {data.faqs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-bold text-gray-900">
                Frequently Asked Questions — {cityName} Real Estate
              </h3>
            </div>
            <div className="space-y-4">
              {data.faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-gray-50 border border-gray-100 rounded-xl overflow-hidden"
                >
                  <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-800 hover:text-primary-700 flex items-center justify-between list-none">
                    {q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none ml-3 flex-shrink-0">
                      ↓
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* ── Cross-link to other property types ───────────────────────── */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3">Explore More in {cityName}</h3>
          <div className="flex flex-wrap gap-2">
            {variant !== 'buy' && variant !== 'flats-for-sale' && (
              <Link
                href={`/buy/property-in-${citySlug}`}
                className="bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
              >
                🏠 Buy Property in {cityName}
              </Link>
            )}
            {variant !== 'flats-for-sale' && variant !== 'buy' && (
              <Link
                href={`/flats-for-sale/${citySlug}`}
                className="bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
              >
                🏢 Flats for Sale in {cityName}
              </Link>
            )}
            {variant !== 'flats-for-rent' && variant !== 'rent' && (
              <Link
                href={`/flats-for-rent/${citySlug}`}
                className="bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
              >
                🔑 Flats for Rent in {cityName}
              </Link>
            )}
            {variant !== 'new-projects' && (
              <Link
                href={`/new-projects/${citySlug}`}
                className="bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
              >
                🏗️ New Projects in {cityName}
              </Link>
            )}
            <Link
              href={`/agents?city=${encodeURIComponent(cityName)}`}
              className="bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium px-3 py-2 rounded-lg"
            >
              👤 Property Agents in {cityName}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
