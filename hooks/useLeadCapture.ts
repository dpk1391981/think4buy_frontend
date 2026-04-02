'use client';

import { useState, useCallback, useRef } from 'react';
import { leadsApi } from '@/lib/api';

export type LeadSource =
  | 'property_page'
  | 'view_phone'
  | 'schedule_visit'
  | 'download_brochure'
  | 'chatbot'
  | 'seo_form'
  | 'find_property'
  | 'property_alert'
  | 'search'
  | 'contact_form'
  | 'call'
  | 'whatsapp'
  | 'campaign'
  | 'portal_import'
  | 'walkin'
  | 'manual'
  | 'onboarding';

export interface LeadCapturePayload {
  source: LeadSource;
  propertyId?: string;
  /** Direct agent assignment — pass when capturing from an agent's profile page */
  assignedAgentId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  city?: string;
  cityId?: string;
  state?: string;
  propertyType?: 'residential' | 'commercial' | 'plot' | 'rental';
  budgetMin?: number;
  budgetMax?: number;
  requirement?: string;
}

interface LeadCaptureResult {
  leadId: string;
  isDuplicate: boolean;
  message: string;
}

interface UseLeadCaptureReturn {
  submit: (payload: LeadCapturePayload) => Promise<LeadCaptureResult | null>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

/**
 * Reusable hook for capturing leads from any page or component.
 *
 * Automatically attaches UTM parameters from the current URL and
 * device type. Prevents duplicate submissions within the same session
 * using a local ref (in addition to the server-side dedup window).
 *
 * Usage:
 *   const { submit, loading, success, error } = useLeadCapture();
 *   await submit({ source: 'property_page', contactName: '...', ... });
 */
export function useLeadCapture(): UseLeadCaptureReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track recent submissions to prevent accidental double-clicks
  const recentKeys = useRef<Set<string>>(new Set());

  const getTrackingMeta = useCallback(() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    return {
      utmSource: params.get('utm_source') ?? undefined,
      utmMedium: params.get('utm_medium') ?? undefined,
      utmCampaign: params.get('utm_campaign') ?? undefined,
      sessionId: getOrCreateSessionId(),
      deviceType,
    };
  }, []);

  const submit = useCallback(
    async (payload: LeadCapturePayload): Promise<LeadCaptureResult | null> => {
      // Client-side dedup: ignore if same phone+property submitted < 5s ago
      const dedupeKey = `${payload.contactPhone}:${payload.propertyId ?? ''}`;
      if (recentKeys.current.has(dedupeKey)) return null;
      recentKeys.current.add(dedupeKey);
      setTimeout(() => recentKeys.current.delete(dedupeKey), 5000);

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const meta = getTrackingMeta();
        const { data } = await leadsApi.capturePublic({ ...payload, ...meta });
        setSuccess(true);
        return data as LeadCaptureResult;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          (Array.isArray(err?.response?.data?.message)
            ? err.response.data.message.join(', ')
            : null) ||
          'Something went wrong. Please try again.';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getTrackingMeta],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return { submit, loading, error, success, reset };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('t4bs_sid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('t4bs_sid', sid);
    }
    return sid;
  } catch {
    return '';
  }
}

// ── Behavioral (fire-and-forget) lead capture ─────────────────────────────────

/**
 * useBehavioralLeadCapture
 *
 * Captures implicit buyer intent signals without any UI friction.
 * Every action is fire-and-forget — never blocks the user.
 *
 * De-duplication:
 *  • In-memory set prevents repeated fires within the same page session.
 *  • localStorage cooldown (30 min) prevents re-fires across page loads.
 *
 * Usage:
 *   const { onPropertyView, onCallAgent, onSaveProperty } = useBehavioralLeadCapture();
 *   // In a useEffect or event handler:
 *   onPropertyView(property.id, { city: property.city, propertyType: property.type });
 */

const BEHAVIOR_COOLDOWN_MS = 30 * 60 * 1000; // 30 min per property+source pair
const BEHAVIOR_LS_KEY = 't4bs_blc';

function isBehaviorCooled(key: string): boolean {
  try {
    const raw = localStorage.getItem(BEHAVIOR_LS_KEY);
    if (!raw) return false;
    const map: Record<string, number> = JSON.parse(raw);
    const ts = map[key];
    if (!ts) return false;
    return Date.now() - ts < BEHAVIOR_COOLDOWN_MS;
  } catch { return false; }
}

function markBehaviorFired(key: string): void {
  try {
    const raw = localStorage.getItem(BEHAVIOR_LS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    // Prune entries older than 24 h to keep storage lean
    for (const k of Object.keys(map)) {
      if (now - map[k] > 24 * 60 * 60 * 1000) delete map[k];
    }
    map[key] = now;
    localStorage.setItem(BEHAVIOR_LS_KEY, JSON.stringify(map));
  } catch {}
}

export interface BehavioralPayload {
  /** Property ID / slug context */
  propertyId?: string;
  propertyType?: string;
  city?: string;
  cityId?: string;
  locality?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export function useBehavioralLeadCapture() {
  const firedThisSession = useRef<Set<string>>(new Set());

  const fire = useCallback((source: LeadSource, payload: BehavioralPayload = {}) => {
    const key = `${payload.propertyId ?? 'np'}:${source}`;

    // In-memory dedup
    if (firedThisSession.current.has(key)) return;
    // Cross-session cooldown
    if (isBehaviorCooled(key)) return;

    firedThisSession.current.add(key);
    markBehaviorFired(key);

    const body: Record<string, any> = {
      source: source.toUpperCase(),
      sessionId: getOrCreateSessionId(),
      deviceType: typeof navigator !== 'undefined'
        ? (/Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop')
        : 'unknown',
    };
    if (payload.propertyId)   body.propertyId   = payload.propertyId;
    if (payload.propertyType) body.propertyType = payload.propertyType;
    if (payload.city)         body.city         = payload.city;
    if (payload.cityId)       body.cityId       = payload.cityId;
    if (payload.locality)     body.locality     = payload.locality;
    if (payload.budgetMin)    body.budgetMin    = payload.budgetMin;
    if (payload.budgetMax)    body.budgetMax    = payload.budgetMax;

    // Fire-and-forget
    leadsApi.capturePublic(body).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPropertyView = useCallback(
    (propertyId: string, ctx?: BehavioralPayload) => fire('property_page', { propertyId, ...ctx }),
    [fire],
  );

  const onCallAgent = useCallback(
    (propertyId: string, ctx?: BehavioralPayload) => fire('call', { propertyId, ...ctx }),
    [fire],
  );

  const onWhatsApp = useCallback(
    (propertyId: string, ctx?: BehavioralPayload) => fire('whatsapp', { propertyId, ...ctx }),
    [fire],
  );

  const onSaveProperty = useCallback(
    (propertyId: string, ctx?: BehavioralPayload) => fire('property_page', { propertyId, ...ctx }),
    [fire],
  );

  const onSearchFilters = useCallback(
    (ctx: BehavioralPayload) => fire('search', ctx),
    [fire],
  );

  const onScheduleVisit = useCallback(
    (propertyId: string, ctx?: BehavioralPayload) => fire('schedule_visit', { propertyId, ...ctx }),
    [fire],
  );

  const onViewPhone = useCallback(
    (propertyId: string, ctx?: BehavioralPayload) => fire('view_phone', { propertyId, ...ctx }),
    [fire],
  );

  return {
    fire,
    onPropertyView,
    onCallAgent,
    onWhatsApp,
    onSaveProperty,
    onSearchFilters,
    onScheduleVisit,
    onViewPhone,
  };
}
