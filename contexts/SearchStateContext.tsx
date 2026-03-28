'use client';

/**
 * SearchStateContext — Centralized user search behavior tracking.
 *
 * Tracks selected category, property type, search queries and filters
 * across GlobalSearchBar, StickySearch, and Mobile Search components.
 * Persists via sessionStorage so state survives soft navigations.
 *
 * Events fired:
 *   CATEGORY_SELECTED, PROPERTY_TYPE_SELECTED, FILTER_APPLIED,
 *   SEARCH_PERFORMED, SCROLL_DEPTH_REACHED
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { homeApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchState {
  category: string;      // e.g. "buy", "rent", "pg"
  city: string;
  propertyType: string;  // e.g. "apartment", "villa"
  lastQuery: string;
}

interface SearchStateContextValue extends SearchState {
  /** Track + persist category selection */
  trackCategorySelect: (category: string, label?: string) => void;
  /** Track + persist property type selection */
  trackPropertyTypeSelect: (type: string) => void;
  /** Track filter application (fires FILTER_APPLIED event) */
  trackFilterApply: (filters: Record<string, string>) => void;
  /** Track a performed search (fires SEARCH_PERFORMED event) */
  trackSearchPerform: (query: string, opts?: { category?: string; city?: string; propertyType?: string }) => void;
  /** Track how far the user has scrolled (fires once per threshold) */
  trackScrollDepth: (pct: number) => void;
  /** Sync state from URL params (called on page load) */
  syncFromUrl: (params: { category?: string; city?: string; type?: string }) => void;
}

// ── Session storage helpers ───────────────────────────────────────────────────

const SS_KEY = '_t4b_search_state';

function readSS(): Partial<SearchState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeSS(state: SearchState) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch {}
}

// ── Analytics helper (fire-and-forget) ───────────────────────────────────────

function fireEvent(eventType: string, metadata?: Record<string, any>) {
  try {
    const sessionId = (() => {
      let sid = sessionStorage.getItem('_asid');
      if (!sid) {
        sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('_asid', sid);
      }
      return sid;
    })();
    const userId = localStorage.getItem('userId') || undefined;
    const w = window.innerWidth;
    const deviceType = w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';

    homeApi.trackEvent({
      eventType,
      entityType: 'search',
      sessionId,
      deviceType,
      source: 'search',
      metadata: { ...metadata, userId },
    });
  } catch { /* fire-and-forget */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const SearchStateContext = createContext<SearchStateContextValue | null>(null);

const INITIAL: SearchState = { category: '', city: '', propertyType: '', lastQuery: '' };

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SearchState>(() => ({
    ...INITIAL,
    ...readSS(),
  }));

  // Track which scroll-depth thresholds have already been fired this session
  const firedDepths = useRef(new Set<number>());

  const update = useCallback((patch: Partial<SearchState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      writeSS(next);
      return next;
    });
  }, []);

  const trackCategorySelect = useCallback((category: string, label?: string) => {
    update({ category });
    fireEvent('CATEGORY_SELECTED', { category, label: label || category });
  }, [update]);

  const trackPropertyTypeSelect = useCallback((type: string) => {
    update({ propertyType: type });
    fireEvent('PROPERTY_TYPE_SELECTED', { propertyType: type });
  }, [update]);

  const trackFilterApply = useCallback((filters: Record<string, string>) => {
    const filterCount = Object.keys(filters).filter(k => filters[k]).length;
    fireEvent('FILTER_APPLIED', { filters, filterCount });
  }, []);

  const trackSearchPerform = useCallback((
    query: string,
    opts?: { category?: string; city?: string; propertyType?: string },
  ) => {
    update({
      lastQuery: query,
      ...(opts?.category ? { category: opts.category } : {}),
      ...(opts?.city ? { city: opts.city } : {}),
      ...(opts?.propertyType ? { propertyType: opts.propertyType } : {}),
    });
    fireEvent('SEARCH_PERFORMED', {
      query,
      category: opts?.category || state.category,
      city: opts?.city || state.city,
      propertyType: opts?.propertyType || state.propertyType,
    });
  }, [update, state.category, state.city, state.propertyType]);

  const trackScrollDepth = useCallback((pct: number) => {
    const threshold = pct >= 90 ? 90 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
    if (threshold > 0 && !firedDepths.current.has(threshold)) {
      firedDepths.current.add(threshold);
      fireEvent('SCROLL_DEPTH_REACHED', { depth: threshold });
    }
  }, []);

  const syncFromUrl = useCallback((params: { category?: string; city?: string; type?: string }) => {
    const patch: Partial<SearchState> = {};
    if (params.category !== undefined) patch.category = params.category;
    if (params.city !== undefined) patch.city = params.city;
    if (params.type !== undefined) patch.propertyType = params.type;
    if (Object.keys(patch).length > 0) update(patch);
  }, [update]);

  return (
    <SearchStateContext.Provider value={{
      ...state,
      trackCategorySelect,
      trackPropertyTypeSelect,
      trackFilterApply,
      trackSearchPerform,
      trackScrollDepth,
      syncFromUrl,
    }}>
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  const ctx = useContext(SearchStateContext);
  if (!ctx) throw new Error('useSearchState must be used within SearchStateProvider');
  return ctx;
}
