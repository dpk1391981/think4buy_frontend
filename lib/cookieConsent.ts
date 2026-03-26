// ── Cookie Consent Content & Types ─────────────────────────────────────────

export const CONSENT_STORAGE_KEY  = 'cookie_consent_v1';
export const CONSENT_COOKIE_NAME  = 'cc_prefs';
export const CONSENT_POLICY_VERSION = '1.0';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ConsentPreferences {
  essential: true;
  personalization: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState {
  preferences: ConsentPreferences;
  decided: boolean;
  consentVersion: string;
}

export const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  personalization: false,
  analytics: false,
  marketing: false,
};

export const ALL_ACCEPTED: ConsentPreferences = {
  essential: true,
  personalization: true,
  analytics: true,
  marketing: true,
};

// ── Static Content (accurate to actual data collected) ──────────────────────

export const CONSENT_CONTENT = {
  banner: {
    text: 'We use cookies to remember your searches, suggest relevant properties, and improve your experience. You choose what\'s on.',
    buttons: {
      accept_all: 'Accept All',
      reject_all: 'Reject All',
      manage: 'Manage Preferences',
    },
  },
  modal: {
    title: 'Your Privacy, Your Choice',
    description:
      'We use cookies to make your property search faster and more personal. You can turn each category on or off — except the ones that keep the site running. Your preferences are saved and can be changed anytime.',
    categories: [
      {
        id: 'essential' as const,
        name: 'Essential',
        required: true,
        description:
          'These keep the website working. Without them you cannot log in, use the search, or save properties. They cannot be turned off.',
        example:
          'Your login session, shortlisted properties, your OTP verification, and the secure refresh token that keeps you signed in.',
        dataStored: [
          'JWT access token (localStorage)',
          'Refresh token (HTTP-only cookie, never readable by JS)',
          'Your session ID (browser tab memory only)',
          'Your consent preferences (so we don\'t ask again)',
        ],
      },
      {
        id: 'personalization' as const,
        name: 'Personalization',
        required: false,
        description:
          'These remember your preferences so you see listings that match what you\'re actually looking for — without having to set filters every time.',
        example:
          'Remembering your preferred city, budget, and property type so relevant listings appear first. Saving properties you liked. Sending alerts when a matching property is listed.',
        dataStored: [
          'Preferred city, state, budget range, and property type',
          'Your saved / shortlisted properties',
          'Property alerts you set up',
          'Recommended properties based on your browsing history',
        ],
      },
      {
        id: 'analytics' as const,
        name: 'Analytics',
        required: false,
        description:
          'These tell us how people use the site — all data is first-party and anonymous. No third-party analytics tools (Google Analytics, GTM, Hotjar) are used. This data helps us fix problems and improve search.',
        example:
          'We track which properties you viewed, what you searched for, which filters you used, and whether you viewed listings on mobile or desktop — so we can make those flows faster.',
        dataStored: [
          'Pages and properties you viewed (anonymous session ID only)',
          'Search queries and filters you applied',
          'Agent profile views and contact clicks',
          'Device type (mobile / tablet / desktop)',
          'City and state you were browsing from',
        ],
      },
      {
        id: 'marketing' as const,
        name: 'Marketing',
        required: false,
        description:
          'These allow us to show you property-related ads on other websites based on what you browsed here. Note: no third-party ad pixels (Meta, Google Ads) are active today — this consent applies to any we may add in future.',
        example:
          'If you viewed 2BHK flats in Pune, you might see ads for similar properties on social media or other websites. Without this, you may still see ads — just not based on your activity here.',
        dataStored: [
          'Properties and categories you viewed (shared with ad partners only if you consent)',
          'Your approximate location at city level',
        ],
      },
    ],
  },
  trust_message:
    'Cookies are not about tracking you — they are about saving your time. When you allow personalization, we remember you\'re looking for a 3BHK in Bangalore under ₹80L, so you see what matters, not everything. All analytics data is first-party — we do not share it with Google, Meta, or any third party. You are always in control — change your mind anytime from the Cookie Settings link in the footer.',
  toggle_microcopy: {
    analytics_on:  'On — Helping us improve with anonymous, first-party usage data.',
    analytics_off: 'Off — No usage data collected. Site still works fully.',
    marketing_on:  'On — You may see tailored property ads on other platforms.',
    marketing_off: 'Off — Ads elsewhere won\'t be based on your activity here.',
  },
} as const;

export type CategoryId = 'essential' | 'personalization' | 'analytics' | 'marketing';
