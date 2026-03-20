import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/buy',
          '/rent',
          '/pg',
          '/commercial',
          '/new-projects',
          '/services',
          '/services/',
          '/properties',
          '/properties/',
          '/post-property',
          '/post-property/guest',
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
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
