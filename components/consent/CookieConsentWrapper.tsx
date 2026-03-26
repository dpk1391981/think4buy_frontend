'use client';

import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import CookieBanner from './CookieBanner';
import CookiePreferencesModal from './CookiePreferencesModal';

export default function CookieConsentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      {children}
      <CookieBanner />
      <CookiePreferencesModal />
    </CookieConsentProvider>
  );
}
