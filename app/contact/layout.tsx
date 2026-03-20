import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Think4BuySale – Real Estate Support',
  description: 'Get in touch with the Think4BuySale team. Contact us for property inquiries, agent support, or general questions about buying, selling or renting property in India.',
  keywords: 'contact think4buysale, real estate support, property help desk, contact agent, property inquiry India',
  alternates: { canonical: 'https://think4buysale.com/contact' },
  openGraph: {
    title: 'Contact Think4BuySale | Real Estate Support',
    description: 'Reach out to our team for any property-related queries — buying, selling, renting or listing your property.',
    type: 'website',
    url: 'https://think4buysale.com/contact',
    siteName: 'Think4BuySale',
  },
  robots: { index: true, follow: true },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
