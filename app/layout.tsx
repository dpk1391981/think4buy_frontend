import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import './globals.css';
import Header from '@/components/layout/Header';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import QueryProvider from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ReduxProvider } from '@/providers/ReduxProvider';
import AuthModal from '@/components/auth/AuthModal';
import MobileGuestLoginPrompt from '@/components/auth/MobileGuestLoginPrompt';
import OnboardingEnforcer from '@/components/auth/OnboardingEnforcer';
import ToastNotification from '@/components/common/ToastNotification';
import CookieConsentWrapper from '@/components/consent/CookieConsentWrapper';
import { SearchStateProvider } from '@/contexts/SearchStateContext';
import AuthProgressBar from '@/components/auth/AuthProgressBar';
import AuthLoadingOverlay from '@/components/auth/AuthLoadingOverlay';
import AuthSessionLoader from '@/components/auth/AuthSessionLoader';
import AuthSessionExpiredToast from '@/components/auth/AuthSessionExpiredToast';

const GlobalSearchBar = dynamic(() => import('@/components/search/GlobalSearchBar'), { ssr: false });

const APP_NAME = 'Think4BuySale';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Think4BuySale – Buy, Rent & Sell Properties in India',
    template: `%s | ${APP_NAME}`,
  },
  description:
    'Think4BuySale — India\'s trusted real estate portal. Search 50,000+ verified properties to buy, rent, or sell. Apartments, Villas, Plots, PG & Commercial across 50+ cities.',
  keywords: [
    'Think4BuySale',
    'think4buysale.com',
    'buy property India',
    'rent flat India',
    'sell property online',
    'real estate portal India',
    'property listing India',
    'apartments for sale',
    'house for rent',
    'commercial property India',
    'plot for sale',
    'PG accommodation',
    'property in Mumbai Delhi Bangalore',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} – Buy, Rent & Sell Properties in India`,
    description:
      'India\'s trusted real estate portal. Search 50,000+ verified properties across Mumbai, Delhi, Bangalore, Pune & more.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${APP_NAME} Real Estate` }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@think4buysale',
    creator: '@think4buysale',
    title: `${APP_NAME} – India's Real Estate Portal`,
    description: 'Buy, Rent & Sell Properties across India. Verified listings, best prices.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ overflowX: 'clip' }}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body style={{ overflowX: 'clip' }}>
        <ReduxProvider>
          <QueryProvider>
            <AuthProvider>
              <WishlistProvider>
              <SearchStateProvider>
              <CookieConsentWrapper>
              <Header />
              <GlobalSearchBar asSticky variant="compact" />
              <main className="min-h-screen pb-safe-nav lg:pb-0">{children}</main>
              <ConditionalFooter />
              <MobileBottomNav />
              <OnboardingEnforcer />
              <MobileGuestLoginPrompt />
              <AuthModal />
              <ToastNotification />
              {/* Auth UX — order matters: progress bar is topmost (z-300),
                  login overlay above session loader (z-200 > z-150) */}
              <AuthProgressBar />
              <AuthLoadingOverlay />
              <AuthSessionLoader />
              <AuthSessionExpiredToast />
              </CookieConsentWrapper>
              </SearchStateProvider>
              </WishlistProvider>
            </AuthProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
