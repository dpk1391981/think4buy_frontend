'use client';

import { useState, useEffect, useCallback } from 'react';
import { savedApi } from '@/lib/api';

const KEY = 'pf_wishlist';

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 1. Load localStorage immediately for instant optimistic UI
    let localIds: string[] = [];
    try {
      localIds = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (localIds.length) setIds(new Set(localIds));
    } catch {}

    // 2. Sync with backend
    savedApi.getSavedIds()
      .then(res => {
        const raw = res.data;
        // Handle both plain array and { ids: [...] } shaped responses
        const apiIds: string[] = Array.isArray(raw) ? raw : Array.isArray(raw?.ids) ? raw.ids : [];

        // Push any localStorage-only IDs up to the backend (covers old localStorage-only saves)
        const missing = localIds.filter(id => !apiIds.includes(id));
        missing.forEach(id => savedApi.save(id).catch(() => {}));

        // Merge backend + localStorage into UI state
        const all = Array.from(new Set(localIds.concat(apiIds)));
        if (all.length) {
          localStorage.setItem(KEY, JSON.stringify(all));
          setIds(new Set(all));
        }
      })
      .catch(() => {}); // not logged in or network error — fall back to localStorage
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        savedApi.unsave(id).catch(() => {}); // fire-and-forget — API syncs backend
      } else {
        next.add(id);
        savedApi.save(id).catch(() => {});   // fire-and-forget
      }
      localStorage.setItem(KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isSaved = (id: string) => ids.has(id);
  const getIds  = () => Array.from(ids);

  return { isSaved, toggle, getIds };
}
