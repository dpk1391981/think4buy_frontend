import type { Metadata } from 'next';
import FindPropertyClient from './FindPropertyClient';

export const metadata: Metadata = {
  title: 'Find Your Dream Property – Post Your Buying Requirement | Think4BuySale',
  description:
    'Tell us your property requirement and our expert agents will find the best matched properties across India. Looking to buy a flat, villa, plot, or commercial space? Share your budget & location.',
  keywords: [
    'find property India',
    'post property requirement',
    'property search India',
    'buy flat India',
    'property dealer India',
    'real estate agent India',
    'property requirement form',
  ],
  openGraph: {
    title: 'Find Your Dream Property | Think4BuySale',
    description: 'Share your property requirement — our verified agents will connect you with the best deals.',
    type: 'website',
  },
};

export default function FindPropertyPage() {
  return <FindPropertyClient />;
}
