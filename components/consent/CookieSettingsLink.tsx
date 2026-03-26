'use client';

import { useCookieConsent } from '@/contexts/CookieConsentContext';

export default function CookieSettingsLink() {
  const { openModal } = useCookieConsent();

  return (
    <button
      onClick={openModal}
      className="hover:text-gray-300 transition-colors text-xs text-gray-500"
    >
      Cookie Settings
    </button>
  );
}
