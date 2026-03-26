'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  ConsentPreferences,
  ConsentState,
  CONSENT_STORAGE_KEY,
  CONSENT_COOKIE_NAME,
  CONSENT_POLICY_VERSION,
  DEFAULT_PREFERENCES,
  ALL_ACCEPTED,
} from '@/lib/cookieConsent';
import { consentApi } from '@/lib/api';

// ── Context shape ────────────────────────────────────────────────────────────

interface CookieConsentContextValue extends ConsentState {
  modalOpen: boolean;
  acceptAll: (source?: ConsentSource) => void;
  rejectAll: (source?: ConsentSource) => void;
  savePreferences: (prefs: Omit<ConsentPreferences, 'essential'>, source?: ConsentSource) => void;
  openModal: () => void;
  closeModal: () => void;
}

type ConsentSource = 'banner' | 'modal' | 'settings';

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

function persist(preferences: ConsentPreferences, version = CONSENT_POLICY_VERSION) {
  const payload: ConsentState = { preferences, decided: true, consentVersion: version };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable — silently skip
  }
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(preferences)
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function load(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    parsed.preferences.essential = true;

    // If the stored policy version is older than current, force re-consent
    if (parsed.consentVersion && parsed.consentVersion !== CONSENT_POLICY_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_asid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('_asid', sid);
  }
  return sid;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsentState>({
    preferences: DEFAULT_PREFERENCES,
    decided: false,
    consentVersion: CONSENT_POLICY_VERSION,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const syncedFromServer = useRef(false);

  // Step 1: hydrate from localStorage
  useEffect(() => {
    const saved = load();
    if (saved) {
      setState(saved);
    }
  }, []);

  // Step 2: after mount, try to pull the authoritative record from the backend.
  // This syncs preferences when the user logs in on a new device.
  useEffect(() => {
    if (syncedFromServer.current) return;
    syncedFromServer.current = true;

    const sessionId = getSessionId();
    consentApi.getMe(sessionId).then((res: any) => {
      const serverData = res?.data;
      if (!serverData) return; // No server record — rely on localStorage / show banner

      const prefs: ConsentPreferences = {
        essential:       true,
        personalization: !!serverData.personalization,
        analytics:       !!serverData.analytics,
        marketing:       !!serverData.marketing,
      };
      const next: ConsentState = {
        preferences: prefs,
        decided: true,
        consentVersion: serverData.consentVersion ?? CONSENT_POLICY_VERSION,
      };

      // Only overwrite if server record is newer (version matches current policy)
      if (!serverData.consentVersion || serverData.consentVersion === CONSENT_POLICY_VERSION) {
        setState(next);
        persist(prefs, serverData.consentVersion ?? CONSENT_POLICY_VERSION);
      }
    });
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const commitPreferences = useCallback(
    (preferences: ConsentPreferences, source: ConsentSource = 'banner') => {
      const next: ConsentState = {
        preferences,
        decided: true,
        consentVersion: CONSENT_POLICY_VERSION,
      };
      setState(next);
      persist(preferences);
      // Persist to backend — fire-and-forget
      consentApi.save({
        sessionId:       getSessionId(),
        personalization: preferences.personalization,
        analytics:       preferences.analytics,
        marketing:       preferences.marketing,
        source,
        consentVersion:  CONSENT_POLICY_VERSION,
      });
    },
    []
  );

  const acceptAll = useCallback(
    (source: ConsentSource = 'banner') => commitPreferences(ALL_ACCEPTED, source),
    [commitPreferences]
  );

  const rejectAll = useCallback(
    (source: ConsentSource = 'banner') => commitPreferences(DEFAULT_PREFERENCES, source),
    [commitPreferences]
  );

  const savePreferences = useCallback(
    (prefs: Omit<ConsentPreferences, 'essential'>, source: ConsentSource = 'modal') => {
      commitPreferences({ essential: true, ...prefs }, source);
      setModalOpen(false);
    },
    [commitPreferences]
  );

  const openModal  = useCallback(() => setModalOpen(true),  []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{ ...state, modalOpen, acceptAll, rejectAll, savePreferences, openModal, closeModal }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
