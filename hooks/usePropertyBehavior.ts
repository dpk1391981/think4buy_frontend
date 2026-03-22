'use client';

import { useEffect, useRef, useCallback } from 'react';
import { smartSearchApi } from '@/lib/api';

type EventType = 'view' | 'long_stay' | 'wishlist' | 'contact' | 'inquiry' | 'scroll_deep' | 'image_click' | 'share';

interface UsePropertyBehaviorOptions {
  propertyId: string;
  /** Fire long_stay event after this many seconds (default 30) */
  longStayThreshold?: number;
  /** Fire scroll_deep event when scroll depth exceeds this % (default 70) */
  scrollDepthThreshold?: number;
}

/** Returns a stable session ID for anonymous tracking */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const key = 't4bs_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

/**
 * Tracks user behavior on a property page:
 * - fires `view` on mount
 * - fires `long_stay` after longStayThreshold seconds
 * - fires `scroll_deep` when scrolling past scrollDepthThreshold %
 *
 * Returns a `track(eventType)` helper for manual events (wishlist, contact, etc.)
 */
export function usePropertyBehavior({
  propertyId,
  longStayThreshold = 30,
  scrollDepthThreshold = 70,
}: UsePropertyBehaviorOptions) {
  const sentEvents = useRef(new Set<EventType>());
  const sessionId = typeof window !== 'undefined' ? getSessionId() : '';
  const startTime = useRef(Date.now());

  const send = useCallback(
    (eventType: EventType, duration?: number) => {
      if (!propertyId) return;
      // Deduplicate most event types (allow multiple image_clicks / contacts)
      if (eventType !== 'image_click' && eventType !== 'contact') {
        if (sentEvents.current.has(eventType)) return;
        sentEvents.current.add(eventType);
      }
      smartSearchApi.trackBehavior({ propertyId, eventType, duration, sessionId });
    },
    [propertyId, sessionId],
  );

  // Fire VIEW on mount
  useEffect(() => {
    if (!propertyId) return;
    send('view');
  }, [propertyId, send]);

  // Fire LONG_STAY after threshold seconds
  useEffect(() => {
    if (!propertyId) return;
    const timer = setTimeout(() => {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      send('long_stay', elapsed);
    }, longStayThreshold * 1000);
    return () => clearTimeout(timer);
  }, [propertyId, longStayThreshold, send]);

  // Fire SCROLL_DEEP when user scrolls past threshold %
  useEffect(() => {
    if (!propertyId || typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && (scrolled / total) * 100 >= scrollDepthThreshold) {
        send('scroll_deep');
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [propertyId, scrollDepthThreshold, send]);

  return { track: send };
}
