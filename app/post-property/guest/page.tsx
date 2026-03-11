import type { Metadata } from 'next';
import GuestPostPropertyClient from './GuestPostPropertyClient';

export const metadata: Metadata = {
  title: 'Post Property FREE – Sell or Rent Your Property | Think4BuySale',
  description:
    'List your property for FREE on Think4BuySale. Reach lakhs of verified buyers & tenants across India. No commission, no hidden charges. Sell or rent faster — go live in minutes.',
  keywords: [
    'post property free',
    'sell property online India',
    'rent property free listing',
    'property listing Think4BuySale',
    'free property advertisement',
    'list property for sale',
    'post property without broker',
  ],
  openGraph: {
    title: 'Post Property FREE | Think4BuySale',
    description: 'Reach lakhs of buyers & tenants. Free listing, zero commission. Go live in minutes.',
    images: [{ url: '/og-post-property.jpg', width: 1200, height: 630 }],
  },
  alternates: { canonical: '/post-property/guest' },
};

export default function GuestPostPropertyPage() {
  return <GuestPostPropertyClient />;
}
