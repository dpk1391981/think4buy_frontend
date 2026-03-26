'use client';

import { Shield } from 'lucide-react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CONSENT_CONTENT } from '@/lib/cookieConsent';

const { banner } = CONSENT_CONTENT;

export default function CookieBanner() {
  const { decided, acceptAll, rejectAll, openModal } = useCookieConsent();
  const handleAccept = () => acceptAll('banner');
  const handleReject = () => rejectAll('banner');

  if (decided) return null;

  return (
    <>
      {/* Backdrop dimmer (mobile only) */}
      <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" aria-hidden="true" />

      {/* Banner */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Cookie consent"
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      >
        {/* Mobile bottom-nav safe area */}
        <div className="bg-white border-t border-gray-200 shadow-2xl shadow-black/10 px-4 py-4 lg:px-6 lg:py-5">
          <div className="max-w-6xl mx-auto">
            {/* Content row */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Icon + text */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center mt-0.5">
                  <Shield className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {banner.text}
                  </p>
                  <button
                    onClick={openModal}
                    className="text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2 mt-1 transition-colors"
                  >
                    Learn more about how we use cookies
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleReject}
                  className="order-3 sm:order-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 whitespace-nowrap"
                >
                  {banner.buttons.reject_all}
                </button>
                <button
                  onClick={openModal}
                  className="order-2 px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200 whitespace-nowrap"
                >
                  {banner.buttons.manage}
                </button>
                <button
                  onClick={handleAccept}
                  className="order-1 sm:order-3 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 rounded-lg transition-all whitespace-nowrap shadow-sm"
                >
                  {banner.buttons.accept_all}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
