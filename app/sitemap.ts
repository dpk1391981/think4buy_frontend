import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

const TOP_CITY_SLUGS = [
  'mumbai', 'delhi', 'bangalore', 'pune', 'hyderabad',
  'chennai', 'kolkata', 'ahmedabad', 'noida', 'gurgaon',
  'navi-mumbai', 'thane', 'surat', 'jaipur', 'kochi',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                  lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/buy`,                         lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/rent`,                        lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/pg`,                          lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/commercial`,                  lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/new-projects`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/properties`,                  lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/post-property`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/post-property/guest`,         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/services`,                    lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/agents`,                      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/faq`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/property-leads`,              lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/advertise`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/testimonials`,                lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`,                     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,                       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/property-for-sale-rent-in-india`,         lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/property-for-sale-in-top-cities`,         lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/property-for-sale-rent-in-top-cities`,    lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // ── Service detail pages ────────────────────────────────────────────────────
  const serviceRoutes: MetadataRoute.Sitemap = [
    'home-loan', 'legal-services', 'interior-design',
    'packers-movers', 'rental-agreement', 'property-insurance',
  ].map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // ── Programmatic SEO — clean hyphen URLs (highest-traffic SEO pages) ────────
  // property-for-sale-in-{city} — primary buy intent
  const cityBuyRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/property-for-sale-in-${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.95,
  }));

  // property-for-rent-in-{city} — primary rent intent
  const cityRentRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/property-for-rent-in-${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // flats-for-sale-in-{city}
  const flatsForSaleRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/flats-for-sale-in-${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // flats-for-rent-in-{city}
  const flatsForRentRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/flats-for-rent-in-${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // villas-for-sale-in-{city}
  const villasRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/villas-for-sale-in-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // plots-for-sale-in-{city}
  const plotsRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/plots-for-sale-in-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // pg-in-{city}
  const pgRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/pg-in-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // new-projects-in-{city}
  const newProjectsRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/new-projects-in-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // commercial-property-in-{city}
  const commercialRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/commercial-property-in-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ── City landing pages (/properties-in/{city}) ──────────────────────────────
  const propertiesInRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/properties-in/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // ── Property prices in city ─────────────────────────────────────────────────
  const pricesInRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/property-prices-in/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // ── Agent city pages (/agents-in/{city}) — slash-separated matches route ────
  const agentCityRoutes: MetadataRoute.Sitemap = TOP_CITY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/agents-in/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...cityBuyRoutes,
    ...cityRentRoutes,
    ...flatsForSaleRoutes,
    ...flatsForRentRoutes,
    ...villasRoutes,
    ...plotsRoutes,
    ...pgRoutes,
    ...newProjectsRoutes,
    ...commercialRoutes,
    ...propertiesInRoutes,
    ...pricesInRoutes,
    ...agentCityRoutes,
  ];
}
