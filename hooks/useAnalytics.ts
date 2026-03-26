'use client';

import { useCallback, useRef } from 'react';
import { homeApi, propertiesApi } from '@/lib/api';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

type DeviceType = 'mobile' | 'desktop' | 'tablet';
type Source = 'home_page' | 'search' | 'recommendation' | 'direct' | 'category';

interface TrackOptions {
  country?: string;
  state?: string;
  city?: string;
  source?: Source;
  metadata?: Record<string, any>;
}

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
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

/**
 * Lightweight analytics tracker hook.
 * All tracking is fire-and-forget — never throws.
 *
 * Usage:
 *   const { trackPropertyView, trackSearch } = useAnalytics();
 *   trackPropertyView(propertyId, { city: 'Mumbai', state: 'Maharashtra' });
 */
export function useAnalytics() {
  const sessionId = useRef(getSessionId());
  const { preferences } = useCookieConsent();

  const track = useCallback((
    eventType: string,
    entityType?: string,
    entityId?: string,
    opts: TrackOptions = {},
  ) => {
    // Respect analytics consent — skip all tracking if user has not opted in
    if (!preferences.analytics) return;

    const userId = typeof window !== 'undefined'
      ? localStorage.getItem('userId') || undefined
      : undefined;

    homeApi.trackEvent({
      eventType,
      entityType,
      entityId,
      sessionId:  sessionId.current,
      country:    opts.country,
      state:      opts.state,
      city:       opts.city,
      deviceType: getDeviceType(),
      source:     opts.source || 'direct',
      metadata:   opts.metadata,
    });
  }, []);

  return {
    /**
     * Records a unique property view via the dedicated dedup endpoint.
     * Also fires a generic analytics event for dashboard stats.
     */
    trackPropertyView: (propertyId: string, opts?: TrackOptions & { propertyType?: string }) => {
      if (!preferences.analytics) return;
      // 1. Unique-view endpoint (handles dedup on the server)
      propertiesApi.trackView(propertyId, {
        sessionId:  sessionId.current,
        source:     opts?.source ?? 'direct',
        referrer:   typeof window !== 'undefined' ? document.referrer || undefined : undefined,
        deviceType: getDeviceType(),
      });
      // 2. Generic analytics event (for dashboard/charts — already has its own dedup at the event level)
      track('property_view', 'property', propertyId, {
        ...opts,
        metadata: { ...(opts?.metadata || {}), propertyType: opts?.propertyType },
      });
    },

    trackPropertyInquiry: (propertyId: string, opts?: TrackOptions) =>
      track('property_inquiry', 'property', propertyId, opts),

    trackPropertySave: (propertyId: string, opts?: TrackOptions) =>
      track('property_save', 'property', propertyId, opts),

    trackPropertyClick: (propertyId: string, opts?: TrackOptions) =>
      track('property_click', 'property', propertyId, opts),

    trackSearch: (query: string, opts?: TrackOptions & { propertyType?: string; filters?: any }) =>
      track('search_query', 'search', undefined, {
        ...opts,
        metadata: { query, propertyType: opts?.propertyType, filters: opts?.filters },
      }),

    trackAgentView: (agentId: string, opts?: TrackOptions) =>
      track('agent_profile_view', 'agent', agentId, opts),

    trackAgentContact: (agentId: string, opts?: TrackOptions) =>
      track('agent_contact_click', 'agent', agentId, opts),

    trackProjectView: (projectId: string, opts?: TrackOptions) =>
      track('project_view', 'project', projectId, opts),

    trackCityView: (city: string, state?: string, country?: string) =>
      track('city_view', 'city', undefined, { city, state, country }),

    trackStateView: (state: string, country?: string) =>
      track('state_view', 'state', undefined, { state, country }),

    /** Generic tracker for custom events */
    track,
  };
}
