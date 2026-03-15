'use client';

import { useState, useEffect, useCallback } from 'react';
import { savedApi } from '@/lib/api';

const KEY = 'pf_wishlist';

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load localStorage immediately for instant optimistic UI (guest/offline)
    try {
      const localIds: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (localIds.length) setIds(new Set(localIds));
    } catch {}

    // Sync with backend — API response is the source of truth for logged-in users
    savedApi.getSavedIds()
      .then(res => {
        const raw = res.data;
        const apiIds: string[] = Array.isArray(raw) ? raw : Array.isArray(raw?.ids) ? raw.ids : [];
        // Replace local state with backend state (avoids cross-user localStorage pollution)
        localStorage.setItem(KEY, JSON.stringify(apiIds));
        setIds(new Set(apiIds));
      })
      .catch(() => {}); // not logged in — keep localStorage state
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        savedApi.unsave(id).catch(() => {});
      } else {
        next.add(id);
        savedApi.save(id).catch(() => {});
      }
      localStorage.setItem(KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isSaved = (id: string) => ids.has(id);
  const getIds  = () => Array.from(ids);

  return { isSaved, toggle, getIds };
}
