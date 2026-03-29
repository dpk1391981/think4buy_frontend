import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                        lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/buy`,               lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/rent`,              lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/pg`,                lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/commercial`,        lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/new-projects`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/services`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/post-property`,     lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/post-property/guest`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/properties`,        lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/privacy`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,             lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/about`,             lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`,           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/feedback`,          lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/complaints`,        lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/testimonials`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/property-leads`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/advertise`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Service detail pages
  const serviceRoutes: MetadataRoute.Sitemap = [
    'home-loan', 'legal-services', 'interior-design',
    'packers-movers', 'rental-agreement', 'property-insurance',
  ].map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // City landing pages (high-traffic SEO pages)
  const topCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad',
    'Chennai', 'Kolkata', 'Ahmedabad', 'Noida', 'Gurgaon',
    'Navi-Mumbai', 'Thane', 'Surat', 'Jaipur', 'Kochi',
  ];

  const topCitySlugs = [
    'mumbai', 'delhi', 'bangalore', 'pune', 'hyderabad',
    'chennai', 'kolkata', 'ahmedabad', 'noida', 'gurgaon',
    'navi-mumbai', 'thane', 'surat', 'jaipur', 'kochi',
  ];

  const cityBuyRoutes: MetadataRoute.Sitemap = topCities.map((city) => ({
    url: `${BASE_URL}/properties?city=${city}&category=buy`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const cityRentRoutes: MetadataRoute.Sitemap = topCities.map((city) => ({
    url: `${BASE_URL}/properties?city=${city}&category=rent`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Property type pages
  const propertyTypeRoutes: MetadataRoute.Sitemap = [
    'apartment', 'villa', 'house', 'plot', 'penthouse', 'commercial_office',
  ].map((type) => ({
    url: `${BASE_URL}/properties?type=${type}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Agent listing by city (SEO-friendly URLs)
  const agentCityRoutes: MetadataRoute.Sitemap = topCitySlugs.map((slug) => ({
    url: `${BASE_URL}/agents-in-${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...cityBuyRoutes,
    ...cityRentRoutes,
    ...propertyTypeRoutes,
    ...agentCityRoutes,
  ];
}
