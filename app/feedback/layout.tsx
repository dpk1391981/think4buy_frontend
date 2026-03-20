import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback | Think4BuySale – Share Your Experience',
  description: 'Share your feedback about Think4BuySale. Tell us about your property search experience, agent interactions, and what we can improve.',
  keywords: 'think4buysale feedback, property platform review, real estate app feedback India',
  alternates: { canonical: 'https://think4buysale.com/feedback' },
  openGraph: {
    title: 'Share Your Feedback | Think4BuySale',
    description: 'Help us improve by sharing your experience with Think4BuySale.',
    type: 'website',
    url: 'https://think4buysale.com/feedback',
  },
  robots: { index: true, follow: true },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
