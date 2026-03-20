import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'File a Complaint | Think4BuySale – We Take Every Report Seriously',
  description: 'Report fraudulent listings, agent misconduct, payment disputes, or any platform issue on Think4BuySale. Every complaint is reviewed within 48 hours.',
  keywords: 'think4buysale complaint, report agent fraud, property listing complaint India, real estate complaint portal',
  alternates: { canonical: 'https://think4buysale.com/complaints' },
  openGraph: {
    title: 'File a Complaint | Think4BuySale',
    description: 'Report issues and complaints about listings, agents, or the platform. We investigate every report.',
    type: 'website',
    url: 'https://think4buysale.com/complaints',
  },
  robots: { index: true, follow: true },
};

export default function ComplaintsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
