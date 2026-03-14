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
  | 'property_alert'
  | 'search'
  | 'contact_form'
  | 'call'
  | 'whatsapp'
  | 'campaign'
  | 'portal_import'
  | 'walkin'
  | 'manual';

export interface LeadCapturePayload {
  source: LeadSource;
  propertyId?: string;
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
