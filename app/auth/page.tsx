import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthPageClient from './AuthPageClient';

export const metadata: Metadata = {
  title: 'Login or Sign Up | Think4BuySale',
  description:
    'Sign in to Think4BuySale to save properties, contact owners and agents directly, and post your property free. Log in with your email and password, or get a one-time code by email.',
  alternates: { canonical: '/auth' },
  openGraph: {
    title: 'Login or Sign Up | Think4BuySale',
    description:
      'Save properties, contact owners directly and post your property free. Sign in with your email.',
    url: '/auth',
  },
  // A login screen has nothing to rank for and should never appear in results,
  // but it must stay crawlable so the link equity on it isn't dropped.
  robots: { index: false, follow: true },
};

/**
 * AEO/GEO structured data. The FAQ entries answer the questions an answer
 * engine actually gets asked about signing in here — chiefly "why is there no
 * mobile OTP?", which is the one thing that changed at launch. Keep these in
 * step with what the page really does; a mismatch is worse than no markup.
 */
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I log in to Think4BuySale?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter your email address on the login page. You can then sign in with your password, or choose to receive a 6-digit one-time code by email instead.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I log in with my mobile number?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mobile OTP login is not available at the moment. Please sign in using your email address. Mobile number login will be enabled once SMS approval is complete.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it free to create a Think4BuySale account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Creating an account is free, and property owners and agents can post listings free of charge.',
      },
    },
    {
      '@type': 'Question',
      name: 'I did not receive my verification code. What should I do?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Codes usually arrive within a minute. Check your spam or promotions folder, then use the Resend option on the verification screen after the 60-second cooldown.',
      },
    },
  ],
};

export default function AuthPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <Suspense fallback={null}>
        <AuthPageClient />
      </Suspense>
    </>
  );
}
