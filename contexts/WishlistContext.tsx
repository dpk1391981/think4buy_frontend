'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { savedApi } from '@/lib/api';

const KEY = 'pf_wishlist';

interface WishlistContextValue {
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  getIds: () => string[];
}

const WishlistContext = createContext<WishlistContextValue>({
  isSaved: () => false,
  toggle: () => {},
  getIds: () => [],
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Optimistic: load localStorage immediately (works offline / unauthenticated)
    try {
      const local: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (local.length) setIds(new Set(local));
    } catch {}

    // Single authoritative fetch — runs once for the whole app tree
    savedApi.getSavedIds()
      .then(res => {
        const raw = res.data;
        const apiIds: string[] = Array.isArray(raw) ? raw : Array.isArray(raw?.ids) ? raw.ids : [];
        localStorage.setItem(KEY, JSON.stringify(apiIds));
        setIds(new Set(apiIds));
      })
      .catch(() => {}); // unauthenticated — localStorage state stands
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

  const isSaved = useCallback((id: string) => ids.has(id), [ids]);
  const getIds  = useCallback(() => Array.from(ids), [ids]);

  return (
    <WishlistContext.Provider value={{ isSaved, toggle, getIds }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  return useContext(WishlistContext);
}
