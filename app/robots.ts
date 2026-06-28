import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          // Category landing pages
          '/buy',
          '/rent',
          '/pg',
          '/commercial',
          '/new-projects',
          // Programmatic SEO — flat hyphen slug URLs (catch-all route)
          '/property-for-sale-in-',
          '/property-for-rent-in-',
          '/flats-for-sale-in-',
          '/flats-for-rent-in-',
          '/flat-for-sale-in-',
          '/flat-for-rent-in-',
          '/villas-for-sale-in-',
          '/plots-for-sale-in-',
          '/pg-in-',
          '/commercial-property-in-',
          '/new-projects-in-',
          '/apartments-in-',
          '/houses-in-',
          // City & agent landing pages
          '/properties-in/',
          '/agents-in/',
          '/property-agents-in/',
          '/property-prices-in/',
          '/property-for-sale-in-top-cities',
          '/property-for-sale-rent-in-india',
          '/property-for-sale-rent-in-top-cities',
          // Properties & services
          '/properties',
          '/properties/',
          '/services',
          '/services/',
          '/post-property',
          '/post-property/guest',
          // Info pages
          '/privacy',
          '/terms',
          '/about',
          '/contact',
          '/feedback',
          '/complaints',
          '/testimonials',
          '/agents',
          '/agents/',
          '/faq',
          '/property-leads',
          '/advertise',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/profile/',
          '/my-listings/',
          '/admin/',
          '/wishlist/',
          '/owner/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
